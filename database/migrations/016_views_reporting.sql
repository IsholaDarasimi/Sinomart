-- =====================================================================================
-- 016_views_reporting.sql
-- Pre-built reporting views so admin dashboard widgets don't run ad-hoc full-table scans.
-- All are plain views (always live) except where noted; promote to MATERIALIZED VIEW +
-- scheduled refresh once data volume makes that necessary.
-- =====================================================================================

-- ---------- DAILY / MONTHLY SALES SUMMARY ----------
create view daily_sales_summary as
select
  date_trunc('day', o.created_at)::date as sales_date,
  count(distinct o.id) as order_count,
  count(distinct o.id) filter (where o.status not in ('cancelled','refunded')) as completed_orders,
  count(distinct o.id) filter (where o.status = 'cancelled') as cancelled_orders,
  sum(o.total) filter (where o.payment_status = 'successful') as revenue,
  sum(o.delivery_fee) filter (where o.payment_status = 'successful') as delivery_revenue,
  sum(o.discount_amount) filter (where o.payment_status = 'successful') as total_discount,
  round(avg(o.total) filter (where o.payment_status = 'successful'), 2) as average_order_value
from orders o
group by 1;

create view monthly_sales_summary as
select
  date_trunc('month', o.created_at)::date as sales_month,
  count(distinct o.id) as order_count,
  sum(o.total) filter (where o.payment_status = 'successful') as revenue,
  sum(o.delivery_fee) filter (where o.payment_status = 'successful') as delivery_revenue,
  sum(o.discount_amount) filter (where o.payment_status = 'successful') as total_discount,
  round(avg(o.total) filter (where o.payment_status = 'successful'), 2) as average_order_value,
  count(distinct o.customer_id) as unique_customers
from orders o
group by 1;

-- ---------- PRODUCT PERFORMANCE ----------
create view product_performance as
select
  p.id as product_id,
  p.name,
  p.sku,
  b.name as brand_name,
  p.status,
  coalesce(sales.units_sold, 0) as units_sold,
  coalesce(sales.revenue, 0) as revenue,
  coalesce(views.view_count, 0) as views,
  coalesce(saves.save_count, 0) as saves,
  coalesce(atc.add_to_cart_count, 0) as add_to_cart_count,
  case when coalesce(views.view_count,0) = 0 then 0
       else round(coalesce(sales.units_sold,0)::numeric / views.view_count * 100, 2)
  end as conversion_rate_pct,
  pra.average_rating,
  pra.review_count,
  inv.quantity_on_hand,
  inv.quantity_reserved,
  (inv.quantity_on_hand - inv.quantity_reserved) as quantity_available
from products p
left join brands b on b.id = p.brand_id
left join (
  select oi.product_id, sum(oi.quantity) as units_sold, sum(oi.line_total) as revenue
  from order_items oi join orders o on o.id = oi.order_id
  where o.payment_status = 'successful'
  group by oi.product_id
) sales on sales.product_id = p.id
left join (
  select product_id, count(*) as view_count from analytics_events
  where event_type = 'product_view' group by product_id
) views on views.product_id = p.id
left join (
  select product_id, count(*) as save_count from saved_products group by product_id
) saves on saves.product_id = p.id
left join (
  select product_id, count(*) as add_to_cart_count from analytics_events
  where event_type = 'add_to_cart' group by product_id
) atc on atc.product_id = p.id
left join product_rating_aggregates pra on pra.product_id = p.id
left join inventory inv on inv.product_id = p.id and inv.variant_id is null;

-- ---------- CATEGORY PERFORMANCE ----------
create view category_performance as
select
  c.id as category_id,
  c.name,
  c.parent_id,
  count(distinct oi.order_id) as orders,
  coalesce(sum(oi.quantity), 0) as units_sold,
  coalesce(sum(oi.line_total), 0) as revenue,
  round(avg(oi.line_total), 2) as avg_line_value
from categories c
join product_categories pc on pc.category_id = c.id
join order_items oi on oi.product_id = pc.product_id
join orders o on o.id = oi.order_id and o.payment_status = 'successful'
group by c.id, c.name, c.parent_id;

-- ---------- CUSTOMER SUMMARY ----------
create view customer_summary as
select
  p.id as customer_id,
  p.full_name,
  p.email,
  count(distinct o.id) filter (where o.payment_status = 'successful') as completed_orders,
  coalesce(sum(o.total) filter (where o.payment_status = 'successful'), 0) as lifetime_spend,
  round(avg(o.total) filter (where o.payment_status = 'successful'), 2) as avg_order_value,
  min(o.created_at) as first_order_at,
  max(o.created_at) as last_order_at,
  (count(distinct o.id) filter (where o.payment_status = 'successful') > 1) as is_returning
from profiles p
left join orders o on o.customer_id = p.id
where p.role = 'customer'
group by p.id, p.full_name, p.email;

-- ---------- INVENTORY SUMMARY ----------
create view inventory_summary as
select
  p.id as product_id,
  p.name,
  p.sku,
  inv.quantity_on_hand,
  inv.quantity_reserved,
  (inv.quantity_on_hand - inv.quantity_reserved) as quantity_available,
  inv.low_stock_threshold,
  (inv.quantity_on_hand - inv.quantity_reserved) <= inv.low_stock_threshold as is_low_stock,
  (inv.quantity_on_hand - inv.quantity_reserved) <= 0 as is_out_of_stock,
  (inv.quantity_on_hand * p.base_price) as stock_value
from products p
join inventory inv on inv.product_id = p.id and inv.variant_id is null;

-- ---------- ABANDONED CART SUMMARY ----------
create view abandoned_cart_summary as
select
  c.id as cart_id,
  c.customer_id,
  c.updated_at as last_activity_at,
  count(ci.id) as item_count,
  coalesce(sum(po.price * ci.quantity), 0) as cart_value
from carts c
join cart_items ci on ci.cart_id = c.id
join purchase_options po on po.id = ci.purchase_option_id
where c.status = 'active' and c.updated_at < now() - interval '2 hours'
group by c.id, c.customer_id, c.updated_at;

-- ---------- DELIVERY SUMMARY ----------
create view delivery_summary as
select
  dz.id as zone_id,
  dz.name as zone_name,
  count(o.id) as order_count,
  coalesce(sum(o.delivery_fee), 0) as delivery_revenue,
  count(o.id) filter (where o.delivery_fee = 0) as free_delivery_orders,
  round(avg(o.delivery_fee), 2) as avg_delivery_fee,
  count(o.id) filter (where o.status = 'delivered') as delivered_orders,
  count(o.id) filter (where o.status = 'cancelled') as cancelled_orders
from delivery_zones dz
left join orders o on o.delivery_zone_id = dz.id
group by dz.id, dz.name;

-- ---------- CAMPAIGN SUMMARY ----------
create view campaign_summary as
select
  camp.id as campaign_id,
  camp.name,
  count(distinct cp.product_id) as product_count,
  count(distinct oi.order_id) as orders,
  coalesce(sum(oi.line_total), 0) as revenue
from campaigns camp
left join campaign_products cp on cp.campaign_id = camp.id
left join order_items oi on oi.product_id = cp.product_id
left join orders o on o.id = oi.order_id and o.payment_status = 'successful'
group by camp.id, camp.name;

-- ---------- BANNER PERFORMANCE ----------
create view banner_performance as
select
  b.id as banner_id,
  b.title,
  count(*) filter (where be.event_type = 'impression') as impressions,
  count(*) filter (where be.event_type = 'click') as clicks,
  case when count(*) filter (where be.event_type = 'impression') = 0 then 0
       else round(count(*) filter (where be.event_type = 'click')::numeric /
                   count(*) filter (where be.event_type = 'impression') * 100, 2)
  end as click_through_rate_pct
from homepage_banners b
left join banner_events be on be.banner_id = b.id
group by b.id, b.title;

-- ---------- CHECKOUT / SALES FUNNEL ----------
create view sales_funnel as
select
  count(*) filter (where event_type = 'product_view') as product_views,
  count(*) filter (where event_type = 'add_to_cart') as add_to_carts,
  count(*) filter (where event_type = 'checkout_started') as checkouts_started,
  count(*) filter (where event_type = 'payment_started') as payments_started,
  count(*) filter (where event_type = 'payment_success') as payments_successful,
  count(*) filter (where event_type = 'order_created') as orders_created
from analytics_events
where created_at >= now() - interval '30 days';

-- ---------- MARKETING ATTRIBUTION (UTM funnel) ----------
create view marketing_attribution as
select
  utm_source,
  utm_campaign,
  count(distinct session_id) as sessions,
  count(*) filter (where event_type = 'product_view') as product_views,
  count(*) filter (where event_type = 'add_to_cart') as add_to_carts,
  count(distinct order_id) filter (where event_type = 'order_created') as orders
from analytics_events
where utm_source is not null
group by utm_source, utm_campaign;

-- ---------- ZERO-RESULT SEARCH DEMAND (unstocked-product signal) ----------
create view search_demand_gaps as
select normalized_query, count(*) as search_count, max(created_at) as last_searched_at
from search_logs
where result_count = 0
group by normalized_query
order by search_count desc;
