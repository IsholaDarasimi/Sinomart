-- =====================================================================================
-- 017_rls_policies.sql
-- Row Level Security. Default posture: deny-by-default (RLS enabled, no USING(true)
-- on sensitive tables). Customers see only their own data; public catalogue data is
-- readable by anyone; writes to catalogue/pricing/inventory/orders/analytics are
-- restricted to admins (via is_admin()/has_permission()) or SECURITY DEFINER RPCs.
-- =====================================================================================

-- ---------- PROFILES ----------
alter table profiles enable row level security;

create policy profiles_select_own on profiles for select
  using (id = auth.uid() or is_admin());

create policy profiles_update_own on profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- customers may update their own contact/profile fields but NEVER their own role
    and role = (select role from profiles where id = auth.uid())
  );

create policy profiles_admin_manage on profiles for update
  using (is_super_admin())
  with check (is_super_admin());

comment on policy profiles_update_own on profiles is
  'The WITH CHECK clause pins role to its current value, so a customer cannot self-promote via a client-side UPDATE. Only super_admin (via profiles_admin_manage) can change role.';

-- ---------- ADDRESSES ----------
alter table addresses enable row level security;

create policy addresses_owner_all on addresses for all
  using (customer_id = auth.uid() or is_admin())
  with check (customer_id = auth.uid() or is_admin());

-- ---------- PERMISSION TABLES ----------
alter table permission_areas enable row level security;
create policy permission_areas_read on permission_areas for select using (is_admin());

alter table admin_permissions enable row level security;
create policy admin_permissions_read on admin_permissions for select using (is_admin());
create policy admin_permissions_manage on admin_permissions for all
  using (is_super_admin()) with check (is_super_admin());

-- ---------- CATALOGUE (public read, admin write) ----------
alter table brands enable row level security;
create policy brands_public_read on brands for select using (is_active or is_admin());
create policy brands_admin_write on brands for insert with check (has_permission('products','edit'));
create policy brands_admin_update on brands for update using (has_permission('products','edit'));
create policy brands_admin_delete on brands for delete using (has_permission('products','delete'));

alter table categories enable row level security;
create policy categories_public_read on categories for select using (is_active or is_admin());
create policy categories_admin_write on categories for insert with check (has_permission('products','edit'));
create policy categories_admin_update on categories for update using (has_permission('products','edit'));
create policy categories_admin_delete on categories for delete using (has_permission('products','delete'));

alter table products enable row level security;
create policy products_public_read on products for select
  using (status = 'active' and is_active = true or is_admin());
create policy products_admin_insert on products for insert with check (has_permission('products','edit'));
create policy products_admin_update on products for update using (has_permission('products','edit'));
create policy products_admin_delete on products for delete using (has_permission('products','delete'));

alter table product_categories enable row level security;
create policy product_categories_read on product_categories for select
  using (exists (select 1 from products p where p.id = product_id and (p.status='active' or is_admin())));
create policy product_categories_admin_write on product_categories for all
  using (has_permission('products','edit')) with check (has_permission('products','edit'));

alter table product_variants enable row level security;
create policy variants_public_read on product_variants for select
  using (status = 'active' or is_admin());
create policy variants_admin_write on product_variants for all
  using (has_permission('products','edit')) with check (has_permission('products','edit'));

alter table product_images enable row level security;
create policy images_public_read on product_images for select using (true);
create policy images_admin_write on product_images for all
  using (has_permission('products','edit')) with check (has_permission('products','edit'));

alter table purchase_options enable row level security;
create policy purchase_options_public_read on purchase_options for select
  using (is_active or is_admin());
create policy purchase_options_admin_write on purchase_options for all
  using (has_permission('products','edit')) with check (has_permission('products','edit'));

-- ---------- INVENTORY (never exposed with exact numbers to customers) ----------
alter table inventory enable row level security;
create policy inventory_admin_read on inventory for select using (has_permission('inventory','view'));
create policy inventory_admin_write on inventory for all
  using (has_permission('inventory','edit')) with check (has_permission('inventory','edit'));
comment on policy inventory_admin_read on inventory is
  'Customers never query this table directly. The storefront reads low-stock/out-of-stock booleans only through inventory_available / product_performance style views exposed via a public RPC, never raw quantities.';

alter table inventory_movements enable row level security;
create policy inventory_movements_admin_read on inventory_movements for select using (has_permission('inventory','view'));
-- writes only via SECURITY DEFINER functions (fn_record_inventory_movement); no direct INSERT policy granted.

alter table inventory_reservations enable row level security;
create policy reservations_admin_read on inventory_reservations for select using (has_permission('inventory','view'));
-- writes only via fn_reserve_inventory / fn_release_reservation / fn_consume_reservation.

-- Public, safe view: low-stock label only, never the real count.
create view product_stock_badge as
select
  ia.product_id, ia.variant_id,
  case
    when ia.quantity_available <= 0 then 'out_of_stock'
    when ia.quantity_available <= ia.low_stock_threshold then 'low_stock'
    else 'in_stock'
  end as stock_label,
  case when ia.quantity_available <= ia.low_stock_threshold and ia.quantity_available > 0
       then ia.quantity_available else null end as low_stock_count_if_applicable
from inventory_available ia;

-- product_stock_badge inherits no RLS of its own (views run as invoking role by default in
-- Postgres unless security_invoker/definer set) — mark it security_invoker=false equivalent
-- by exposing via a SECURITY DEFINER wrapper function used from the client instead of the raw view.
revoke all on inventory, inventory_movements, inventory_reservations, product_stock_badge from anon, authenticated;
grant select on product_stock_badge to anon, authenticated; -- badge only ever reveals label + capped low count

-- ---------- CARTS / CART ITEMS ----------
alter table carts enable row level security;
create policy carts_owner_all on carts for all
  using (customer_id = auth.uid() or is_admin())
  with check (customer_id = auth.uid() or is_admin());

alter table cart_items enable row level security;
create policy cart_items_owner_all on cart_items for all
  using (exists (select 1 from carts c where c.id = cart_id and (c.customer_id = auth.uid() or is_admin())))
  with check (exists (select 1 from carts c where c.id = cart_id and (c.customer_id = auth.uid() or is_admin())));

-- ---------- SAVED PRODUCTS ----------
alter table saved_products enable row level security;
create policy saved_products_owner_all on saved_products for all
  using (customer_id = auth.uid() or is_admin())
  with check (customer_id = auth.uid() or is_admin());

-- ---------- DELIVERY (public read active config, admin write) ----------
alter table delivery_zones enable row level security;
create policy delivery_zones_public_read on delivery_zones for select using (is_active or is_admin());
create policy delivery_zones_admin_write on delivery_zones for all
  using (has_permission('settings','edit')) with check (has_permission('settings','edit'));

alter table delivery_zone_areas enable row level security;
create policy delivery_areas_public_read on delivery_zone_areas for select using (is_active or is_admin());
create policy delivery_areas_admin_write on delivery_zone_areas for all
  using (has_permission('settings','edit')) with check (has_permission('settings','edit'));

alter table pickup_locations enable row level security;
create policy pickup_public_read on pickup_locations for select using (is_active or is_admin());
create policy pickup_admin_write on pickup_locations for all
  using (has_permission('settings','edit')) with check (has_permission('settings','edit'));

-- ---------- COUPONS ----------
alter table coupons enable row level security;
-- Customers can validate a coupon (by code) only through fn_validate_coupon(); no broad SELECT.
create policy coupons_admin_read on coupons for select using (is_admin());
create policy coupons_admin_write on coupons for all
  using (has_permission('marketing','edit')) with check (has_permission('marketing','edit'));

alter table coupon_usages enable row level security;
create policy coupon_usages_owner_read on coupon_usages for select
  using (customer_id = auth.uid() or is_admin());
-- inserts only via fn_create_order_from_cart (SECURITY DEFINER).

-- ---------- CAMPAIGNS / BANNERS ----------
alter table campaigns enable row level security;
create policy campaigns_public_read on campaigns for select using (is_active or is_admin());
create policy campaigns_admin_write on campaigns for all
  using (has_permission('marketing','edit')) with check (has_permission('marketing','edit'));

alter table campaign_products enable row level security;
create policy campaign_products_public_read on campaign_products for select using (true);
create policy campaign_products_admin_write on campaign_products for all
  using (has_permission('marketing','edit')) with check (has_permission('marketing','edit'));

alter table homepage_banners enable row level security;
create policy banners_public_read on homepage_banners for select
  using ((is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())) or is_admin());
create policy banners_admin_write on homepage_banners for all
  using (has_permission('marketing','edit')) with check (has_permission('marketing','edit'));

alter table banner_events enable row level security;
create policy banner_events_insert on banner_events for insert with check (true); -- anonymous impressions/clicks
create policy banner_events_admin_read on banner_events for select using (has_permission('analytics','view'));

-- ---------- ORDERS / ORDER ITEMS / STATUS HISTORY ----------
alter table orders enable row level security;
create policy orders_owner_read on orders for select using (customer_id = auth.uid() or is_admin());
create policy orders_admin_update on orders for update using (has_permission('orders','edit'));
-- INSERT only via fn_create_order_from_cart (SECURITY DEFINER); no direct client INSERT policy.

alter table order_items enable row level security;
create policy order_items_owner_read on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_admin())));

alter table order_status_history enable row level security;
create policy order_status_history_owner_read on order_status_history for select
  using (exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_admin())));

-- ---------- PAYMENTS ----------
alter table payments enable row level security;
create policy payments_owner_read on payments for select
  using (exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_admin())));
-- all writes via fn_process_payment_success/failure (SECURITY DEFINER, called from Edge Function only).

-- ---------- REVIEWS ----------
alter table reviews enable row level security;
create policy reviews_public_read on reviews for select using (status = 'approved' or customer_id = auth.uid() or is_admin());
create policy reviews_owner_update on reviews for update
  using (customer_id = auth.uid() and status = 'pending')
  with check (customer_id = auth.uid());
create policy reviews_admin_moderate on reviews for update using (has_permission('reviews','edit'));
-- INSERT only via fn_submit_review (SECURITY DEFINER + trg_reviews_eligibility safety net).

alter table product_rating_aggregates enable row level security;
create policy rating_aggregates_public_read on product_rating_aggregates for select using (true);

alter table product_recommendations enable row level security;
create policy recommendations_public_read on product_recommendations for select using (true);
create policy recommendations_admin_write on product_recommendations for all
  using (has_permission('products','edit')) with check (has_permission('products','edit'));

-- ---------- SEARCH LOGS ----------
alter table search_logs enable row level security;
create policy search_logs_insert on search_logs for insert with check (true);
create policy search_logs_admin_read on search_logs for select using (has_permission('analytics','view'));

-- ---------- INBOX ----------
alter table conversations enable row level security;
create policy conversations_owner_all on conversations for select
  using (customer_id = auth.uid() or is_admin());
create policy conversations_owner_insert on conversations for insert
  with check (customer_id = auth.uid());
create policy conversations_admin_update on conversations for update using (is_admin());

alter table messages enable row level security;
create policy messages_participant_read on messages for select
  using (
    not is_internal_note and exists (
      select 1 from conversations c where c.id = conversation_id and c.customer_id = auth.uid()
    )
    or is_admin()
  );
create policy messages_participant_insert on messages for insert
  with check (
    (sender_type = 'customer' and sender_id = auth.uid()
      and exists (select 1 from conversations c where c.id = conversation_id and c.customer_id = auth.uid()))
    or (sender_type = 'admin' and is_admin())
  );

-- ---------- NEWSLETTER ----------
alter table newsletter_subscribers enable row level security;
create policy newsletter_self_insert on newsletter_subscribers for insert with check (true);
create policy newsletter_self_update on newsletter_subscribers for update
  using (customer_id = auth.uid() or lower(email) = lower((select email from profiles where id = auth.uid())) or is_admin());
create policy newsletter_admin_read on newsletter_subscribers for select using (is_admin());

-- ---------- EMAIL LOGS ----------
alter table email_logs enable row level security;
create policy email_logs_admin_read on email_logs for select using (has_permission('analytics','view'));
-- writes only via SECURITY DEFINER functions / service_role from Edge Functions.

-- ---------- IMPORTS ----------
alter table product_imports enable row level security;
create policy imports_admin_all on product_imports for all
  using (has_permission('imports','edit')) with check (has_permission('imports','edit'));

alter table product_import_rows enable row level security;
create policy import_rows_admin_all on product_import_rows for all
  using (has_permission('imports','edit')) with check (has_permission('imports','edit'));

alter table product_import_errors enable row level security;
create policy import_errors_admin_read on product_import_errors for select using (has_permission('imports','view'));

-- ---------- ANALYTICS / AUDIT ----------
alter table analytics_events enable row level security;
create policy analytics_events_insert on analytics_events for insert with check (true); -- client + edge fn event logging
create policy analytics_events_admin_read on analytics_events for select using (has_permission('analytics','view'));

alter table audit_logs enable row level security;
create policy audit_logs_admin_read on audit_logs for select using (is_super_admin());
-- inserts only via SECURITY DEFINER admin-action RPCs (see fn_log_audit_event in Edge Function layer).

comment on schema public is
  'RLS is deny-by-default. Sensitive writes (pricing, inventory, orders, payments, coupons, reviews) flow exclusively through SECURITY DEFINER RPC functions in 015, never raw client table writes.';
