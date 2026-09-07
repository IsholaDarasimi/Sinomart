-- =====================================================================================
-- 014_analytics_audit.sql
-- Event-level analytics stream (funnel, marketing attribution, product/category behaviour)
-- and the administrative audit log.
-- =====================================================================================

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type analytics_event_type not null,
  session_id text not null,
  customer_id uuid references profiles(id),
  product_id uuid references products(id),
  category_id uuid references categories(id),
  order_id uuid references orders(id),
  banner_id uuid references homepage_banners(id),
  campaign_id uuid references campaigns(id),
  metadata jsonb not null default '{}'::jsonb,
  source text,                 -- 'web','mobile_web','app'
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

-- High-cardinality append-only table: index only what dashboards actually query.
create index idx_analytics_events_type_created on analytics_events(event_type, created_at desc);
create index idx_analytics_events_session on analytics_events(session_id);
create index idx_analytics_events_customer on analytics_events(customer_id) where customer_id is not null;
create index idx_analytics_events_product on analytics_events(product_id) where product_id is not null;
create index idx_analytics_events_utm on analytics_events(utm_source, utm_campaign) where utm_source is not null;
create index idx_analytics_events_created on analytics_events(created_at desc);

comment on table analytics_events is
  'Single event stream driving the checkout funnel, product/category performance, marketing attribution (UTM), and banner analytics. Partition by month in production once volume grows (declarative partitioning on created_at).';

-- ---------- AUDIT LOG ----------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,             -- 'product.update','order.status_change','coupon.create', etc.
  resource_type text not null,
  resource_id uuid,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_actor on audit_logs(actor_id, created_at desc);
create index idx_audit_logs_resource on audit_logs(resource_type, resource_id);
create index idx_audit_logs_created on audit_logs(created_at desc);

comment on table audit_logs is
  'Populated by admin-facing RPCs/Edge Functions (never trust the client to log its own actions). Immutable — no UPDATE/DELETE policies are granted to anyone except via service_role maintenance.';
