-- =====================================================================================
-- 011_search.sql
-- Search logging (drives autocomplete/suggestions + "what are we missing" analytics).
-- Product search itself uses products.search_vector (GIN, tsvector) + pg_trgm, defined
-- in 003. Category suggestions come directly from the categories table (already indexed).
-- =====================================================================================

create table search_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  customer_id uuid references profiles(id),
  query text not null,
  normalized_query text generated always as (lower(trim(query))) stored,
  result_count int not null default 0,
  clicked_product_id uuid references products(id),
  created_at timestamptz not null default now()
);

create index idx_search_logs_normalized on search_logs(normalized_query);
create index idx_search_logs_created on search_logs(created_at desc);
create index idx_search_logs_trgm on search_logs using gin (normalized_query gin_trgm_ops);

comment on table search_logs is
  'Powers "top searches", "zero-result searches" (result_count = 0 => demand for unstocked products), and autocomplete popularity ranking.';

-- Autocomplete/suggestion RPC: blends matching product names, brand names, and category
-- names, ranked by trigram similarity, so "wat" surfaces "Water Bottles" etc.
create or replace function search_suggestions(p_query text, p_limit int default 8)
returns table (
  label text,
  suggestion_type text,
  target_id uuid,
  target_slug text
)
language sql
stable
as $$
  with q as (select lower(trim(p_query)) as term),
  cat_matches as (
    select name as label, 'category'::text as suggestion_type, id as target_id, slug as target_slug,
           similarity(lower(name), (select term from q)) as sim
    from categories
    where is_active and lower(name) % (select term from q)
    order by sim desc
    limit p_limit
  ),
  brand_matches as (
    select name as label, 'brand'::text as suggestion_type, id as target_id, slug as target_slug,
           similarity(lower(name), (select term from q)) as sim
    from brands
    where is_active and lower(name) % (select term from q)
    order by sim desc
    limit p_limit
  ),
  product_matches as (
    select name as label, 'product'::text as suggestion_type, id as target_id, slug as target_slug,
           similarity(lower(name), (select term from q)) as sim
    from products
    where is_active and status = 'active' and lower(name) % (select term from q)
    order by sim desc
    limit p_limit
  )
  select label, suggestion_type, target_id, target_slug from cat_matches
  union all
  select label, suggestion_type, target_id, target_slug from brand_matches
  union all
  select label, suggestion_type, target_id, target_slug from product_matches
  order by suggestion_type
  limit p_limit;
$$;
