-- =====================================================================================
-- 010_reviews_recommendations.sql
-- Reviews with server-enforced verified-purchase eligibility, and product recommendations.
-- =====================================================================================

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  customer_id uuid not null references profiles(id) on delete cascade,
  order_id uuid not null references orders(id),
  order_item_id uuid not null references order_items(id),
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  status review_status not null default 'pending',
  is_verified_purchase boolean not null default true,   -- always true; rows can only be created via fn_submit_review
  moderated_by uuid references profiles(id),
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_review_per_order_item unique (customer_id, order_item_id)
);

create index idx_reviews_product on reviews(product_id, status);
create index idx_reviews_customer on reviews(customer_id);

create trigger trg_reviews_updated_at
  before update on reviews for each row execute function set_updated_at();

comment on table reviews is
  'INSERT must go through fn_submit_review() (015), which verifies: order belongs to customer, order contains the product via order_item_id, and order status is delivered/collected. Direct inserts are blocked by RLS/trigger — see 017.';

-- Guard rail: even if something bypasses the RPC, a DB-level trigger re-validates eligibility.
create or replace function enforce_review_eligibility()
returns trigger
language plpgsql
as $$
declare
  eligible boolean;
begin
  select exists (
    select 1
    from order_items oi
    join orders o on o.id = oi.order_id
    where oi.id = new.order_item_id
      and oi.order_id = new.order_id
      and o.customer_id = new.customer_id
      and oi.product_id = new.product_id
      and o.status in ('delivered', 'collected')
  ) into eligible;

  if not eligible then
    raise exception 'REVIEW_NOT_ELIGIBLE: reviews can only be created for delivered/collected order items belonging to the reviewer';
  end if;

  return new;
end;
$$;

create trigger trg_reviews_eligibility
  before insert on reviews
  for each row execute function enforce_review_eligibility();

-- ---------- REVIEW AGGREGATES ----------
-- Cached per-product aggregate (kept in sync by trigger) instead of recomputing on every page load.
create table product_rating_aggregates (
  product_id uuid primary key references products(id) on delete cascade,
  review_count int not null default 0,
  average_rating numeric(3,2) not null default 0,
  rating_5_count int not null default 0,
  rating_4_count int not null default 0,
  rating_3_count int not null default 0,
  rating_2_count int not null default 0,
  rating_1_count int not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function refresh_product_rating_aggregate(p_product_id uuid)
returns void
language plpgsql
as $$
begin
  insert into product_rating_aggregates as pra (
    product_id, review_count, average_rating,
    rating_5_count, rating_4_count, rating_3_count, rating_2_count, rating_1_count, updated_at
  )
  select
    p_product_id,
    count(*),
    coalesce(round(avg(rating)::numeric, 2), 0),
    count(*) filter (where rating = 5),
    count(*) filter (where rating = 4),
    count(*) filter (where rating = 3),
    count(*) filter (where rating = 2),
    count(*) filter (where rating = 1),
    now()
  from reviews
  where product_id = p_product_id and status = 'approved'
  on conflict (product_id) do update set
    review_count = excluded.review_count,
    average_rating = excluded.average_rating,
    rating_5_count = excluded.rating_5_count,
    rating_4_count = excluded.rating_4_count,
    rating_3_count = excluded.rating_3_count,
    rating_2_count = excluded.rating_2_count,
    rating_1_count = excluded.rating_1_count,
    updated_at = now();
end;
$$;

create or replace function trg_reviews_refresh_aggregate()
returns trigger
language plpgsql
as $$
begin
  perform refresh_product_rating_aggregate(coalesce(new.product_id, old.product_id));
  return coalesce(new, old);
end;
$$;

create trigger trg_reviews_aggregate
  after insert or update of status, rating or delete on reviews
  for each row execute function trg_reviews_refresh_aggregate();

-- ---------- RECOMMENDATIONS ----------
create table product_recommendations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  recommended_product_id uuid not null references products(id) on delete cascade,
  recommendation_type recommendation_type not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint chk_recommend_not_self check (product_id <> recommended_product_id),
  constraint uq_recommendation unique (product_id, recommended_product_id, recommendation_type)
);

create index idx_recommendations_product on product_recommendations(product_id, recommendation_type);

-- Recently viewed is derived from analytics_events (014) rather than duplicated here.
