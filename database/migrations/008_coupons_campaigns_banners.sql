-- =====================================================================================
-- 008_coupons_campaigns_banners.sql
-- Coupons, marketing campaigns, and homepage banners (with impression/click analytics).
-- =====================================================================================

-- ---------- COUPONS ----------
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  coupon_type coupon_type not null,
  percentage_value numeric(5,2) check (percentage_value is null or (percentage_value > 0 and percentage_value <= 100)),
  fixed_value numeric(12,2) check (fixed_value is null or fixed_value > 0),
  grants_free_delivery boolean not null default false,
  minimum_order_amount numeric(12,2) not null default 0,
  maximum_discount_amount numeric(12,2),
  usage_limit int,                 -- total redemptions allowed, NULL = unlimited
  customer_usage_limit int not null default 1,
  times_used int not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_coupon_value check (
    (coupon_type = 'percentage' and percentage_value is not null) or
    (coupon_type = 'fixed' and fixed_value is not null) or
    (coupon_type = 'free_delivery')
  )
);

create index idx_coupons_active on coupons(is_active, starts_at, ends_at);

create trigger trg_coupons_updated_at
  before update on coupons for each row execute function set_updated_at();

create table coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  customer_id uuid not null references profiles(id),
  order_id uuid,                    -- FK added in 009
  discount_amount numeric(12,2) not null,
  used_at timestamptz not null default now()
);

create index idx_coupon_usages_coupon on coupon_usages(coupon_id);
create index idx_coupon_usages_customer on coupon_usages(customer_id);

-- ---------- CAMPAIGNS ----------
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  banner_image_url text,
  grants_free_delivery boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_campaigns_active on campaigns(is_active, starts_at, ends_at);

create trigger trg_campaigns_updated_at
  before update on campaigns for each row execute function set_updated_at();

create table campaign_products (
  campaign_id uuid not null references campaigns(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  discount_type discount_type,
  discount_value numeric(12,2),
  added_at timestamptz not null default now(),
  primary key (campaign_id, product_id)
);

create index idx_campaign_products_product on campaign_products(product_id);

-- ---------- HOMEPAGE BANNERS ----------
create table homepage_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  storage_path text,
  cta_text text,
  destination_type banner_destination_type not null default 'none',
  destination_category_id uuid references categories(id),
  destination_campaign_id uuid references campaigns(id),
  destination_product_id uuid references products(id),
  destination_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_banner_destination check (
    (destination_type = 'category' and destination_category_id is not null) or
    (destination_type = 'campaign' and destination_campaign_id is not null) or
    (destination_type = 'product' and destination_product_id is not null) or
    (destination_type = 'external_url' and destination_url is not null) or
    (destination_type = 'none')
  )
);

create index idx_banners_active on homepage_banners(is_active, sort_order);

create trigger trg_banners_updated_at
  before update on homepage_banners for each row execute function set_updated_at();

-- Impression/click analytics feed banner_performance reporting view (016)
create table banner_events (
  id uuid primary key default gen_random_uuid(),
  banner_id uuid not null references homepage_banners(id) on delete cascade,
  event_type text not null check (event_type in ('impression','click')),
  session_id text,
  customer_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_banner_events_banner_type on banner_events(banner_id, event_type, created_at desc);
