-- =====================================================================================
-- 015_functions_business_logic.sql
-- The transactional core: stock enforcement, reservations, checkout, Paystack
-- verification, coupon validation, delivery fee calculation, and review submission.
-- These are the functions Edge Functions call via supabase.rpc(...) — never raw
-- table writes from the client for anything security- or money-sensitive.
-- =====================================================================================

-- ---------- ERROR HELPER ----------
create or replace function raise_app_error(code text, message text)
returns void
language plpgsql
as $$
begin
  raise exception '%: %', code, message using errcode = 'P0001';
end;
$$;

-- ---------- PRODUCT ACTIVATION GUARD ----------
-- A product cannot be status='active' without: >=1 image, >=1 category, a valid price,
-- an inventory row, and >=1 purchase option. Enforced at the DB layer, not just the UI.
create or replace function enforce_product_activation_requirements()
returns trigger
language plpgsql
as $$
declare
  has_image boolean;
  has_category boolean;
  has_purchase_option boolean;
  has_inventory boolean;
begin
  if new.status = 'active' then
    select exists(select 1 from product_images where product_id = new.id) into has_image;
    select exists(select 1 from product_categories where product_id = new.id) into has_category;
    select exists(select 1 from purchase_options where product_id = new.id and is_active) into has_purchase_option;
    select exists(select 1 from inventory where product_id = new.id) into has_inventory;

    if not has_image then
      raise exception 'PRODUCT_MISSING_IMAGE: product % cannot be active without at least one image', new.id;
    end if;
    if not has_category then
      raise exception 'PRODUCT_MISSING_CATEGORY: product % cannot be active without a category', new.id;
    end if;
    if new.base_price is null or new.base_price < 0 then
      raise exception 'PRODUCT_INVALID_PRICE: product % has an invalid price', new.id;
    end if;
    if not has_purchase_option then
      raise exception 'PRODUCT_MISSING_PURCHASE_OPTION: product % cannot be active without a purchase option', new.id;
    end if;
    if not has_inventory then
      raise exception 'PRODUCT_MISSING_INVENTORY: product % cannot be active without an inventory row', new.id;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_products_activation_guard
  before insert or update of status on products
  for each row execute function enforce_product_activation_requirements();

-- ---------- STOCK / RESERVATION HELPERS ----------

-- Physical units required for a given purchase_option + selected quantity
create or replace function fn_units_required(p_purchase_option_id uuid, p_quantity int)
returns int
language sql
stable
as $$
  select units_per_purchase * p_quantity
  from purchase_options where id = p_purchase_option_id;
$$;

-- Available (unreserved) physical stock for a product/variant
create or replace function fn_available_stock(p_product_id uuid, p_variant_id uuid)
returns int
language sql
stable
as $$
  select coalesce(quantity_on_hand - quantity_reserved, 0)
  from inventory
  where product_id = p_product_id
    and variant_id is not distinct from p_variant_id;
$$;

-- Validates a requested purchase quantity against purchase-option rules AND live stock.
-- Raises INVALID_PURCHASE_QUANTITY or INSUFFICIENT_STOCK on failure.
create or replace function fn_validate_purchase_quantity(
  p_purchase_option_id uuid, p_quantity int
) returns void
language plpgsql
as $$
declare
  po purchase_options%rowtype;
  units_needed int;
  available int;
begin
  select * into po from purchase_options where id = p_purchase_option_id and is_active for update;
  if not found then
    perform raise_app_error('PRODUCT_UNAVAILABLE', 'purchase option not found or inactive');
  end if;

  if p_quantity < po.minimum_quantity
     or (po.maximum_quantity is not null and p_quantity > po.maximum_quantity)
     or (p_quantity - po.minimum_quantity) % po.quantity_step <> 0 then
    perform raise_app_error('INVALID_PURCHASE_QUANTITY', 'quantity does not satisfy min/max/step rules for this purchase option');
  end if;

  units_needed := po.units_per_purchase * p_quantity;
  available := fn_available_stock(po.product_id, po.variant_id);

  if units_needed > available then
    perform raise_app_error('INSUFFICIENT_STOCK', format('requested %s physical units, only %s available', units_needed, available));
  end if;
end;
$$;

-- Records a movement AND applies the corresponding on_hand/reserved delta atomically.
create or replace function fn_record_inventory_movement(
  p_product_id uuid, p_variant_id uuid, p_purchase_option_id uuid,
  p_movement_type inventory_movement_type, p_delta_on_hand int, p_delta_reserved int,
  p_reason text, p_order_id uuid, p_actor_id uuid
) returns uuid
language plpgsql
as $$
declare
  inv_id uuid;
  prev_qty int;
  new_qty int;
begin
  -- lock the inventory row for the duration of this transaction (prevents oversell races)
  select id, quantity_on_hand into inv_id, prev_qty
  from inventory
  where product_id = p_product_id and variant_id is not distinct from p_variant_id
  for update;

  if not found then
    perform raise_app_error('PRODUCT_UNAVAILABLE', 'no inventory row for this product/variant');
  end if;

  update inventory
  set quantity_on_hand = quantity_on_hand + p_delta_on_hand,
      quantity_reserved = quantity_reserved + p_delta_reserved
  where id = inv_id
  returning quantity_on_hand into new_qty;

  insert into inventory_movements (
    inventory_id, product_id, variant_id, purchase_option_id, movement_type,
    previous_quantity, quantity_change, resulting_quantity, reason, order_id, actor_id
  ) values (
    inv_id, p_product_id, p_variant_id, p_purchase_option_id, p_movement_type,
    prev_qty, p_delta_on_hand, new_qty, p_reason, p_order_id, p_actor_id
  );

  return inv_id;
end;
$$;

-- Reserve stock for checkout. Row-locked via fn_record_inventory_movement's FOR UPDATE.
create or replace function fn_reserve_inventory(
  p_cart_id uuid, p_product_id uuid, p_variant_id uuid, p_purchase_option_id uuid,
  p_quantity int, p_ttl_minutes int default 15
) returns uuid
language plpgsql
as $$
declare
  units_needed int;
  inv_id uuid;
  reservation_id uuid;
begin
  perform fn_validate_purchase_quantity(p_purchase_option_id, p_quantity);
  units_needed := fn_units_required(p_purchase_option_id, p_quantity);

  inv_id := fn_record_inventory_movement(
    p_product_id, p_variant_id, p_purchase_option_id, 'reservation',
    0, units_needed, 'checkout reservation', null, auth.uid()
  );

  insert into inventory_reservations (inventory_id, cart_id, quantity, status, expires_at)
  values (inv_id, p_cart_id, units_needed, 'active', now() + make_interval(mins => p_ttl_minutes))
  returning id into reservation_id;

  return reservation_id;
end;
$$;

create or replace function fn_release_reservation(p_reservation_id uuid, p_reason text default 'released')
returns void
language plpgsql
as $$
declare
  r inventory_reservations%rowtype;
  inv inventory%rowtype;
begin
  select * into r from inventory_reservations where id = p_reservation_id and status = 'active' for update;
  if not found then
    return; -- already released/consumed/expired: idempotent no-op
  end if;

  select * into inv from inventory where id = r.inventory_id for update;

  perform fn_record_inventory_movement(
    inv.product_id, inv.variant_id, null, 'reservation_release',
    0, -r.quantity, p_reason, r.order_id, auth.uid()
  );

  update inventory_reservations set status = 'released', updated_at = now() where id = p_reservation_id;
end;
$$;

-- Called on successful payment: converts a reservation into a real (permanent) stock deduction.
create or replace function fn_consume_reservation(p_reservation_id uuid, p_order_id uuid)
returns void
language plpgsql
as $$
declare
  r inventory_reservations%rowtype;
  inv inventory%rowtype;
begin
  select * into r from inventory_reservations where id = p_reservation_id and status = 'active' for update;
  if not found then
    return; -- idempotent
  end if;

  select * into inv from inventory where id = r.inventory_id for update;

  -- permanently remove from on_hand AND clear the reservation hold
  perform fn_record_inventory_movement(
    inv.product_id, inv.variant_id, null, 'sale',
    -r.quantity, -r.quantity, 'order fulfilled', p_order_id, auth.uid()
  );

  update inventory_reservations set status = 'consumed', order_id = p_order_id, updated_at = now()
  where id = p_reservation_id;
end;
$$;

-- Background job (pg_cron / Edge Function on schedule) releases expired reservations.
create or replace function fn_release_expired_reservations()
returns int
language plpgsql
as $$
declare
  cnt int := 0;
  rec record;
begin
  for rec in select id from inventory_reservations where status = 'active' and expires_at < now()
  loop
    perform fn_release_reservation(rec.id, 'expired');
    cnt := cnt + 1;
  end loop;
  return cnt;
end;
$$;

-- ---------- DELIVERY FEE CALCULATION ----------
create or replace function fn_calculate_delivery_fee(
  p_zone_id uuid, p_subtotal numeric, p_fulfillment fulfillment_type, p_free_delivery_override boolean default false
) returns numeric
language plpgsql
stable
as $$
declare
  z delivery_zones%rowtype;
begin
  if p_fulfillment = 'pickup' then
    return 0;
  end if;

  if p_free_delivery_override then
    return 0;
  end if;

  select * into z from delivery_zones where id = p_zone_id and is_active;
  if not found then
    perform raise_app_error('DELIVERY_AREA_UNAVAILABLE', 'selected delivery zone is not available');
  end if;

  if z.free_delivery_threshold is not null and p_subtotal >= z.free_delivery_threshold then
    return 0;
  end if;

  return z.fee;
end;
$$;

-- ---------- COUPON VALIDATION ----------
create or replace function fn_validate_coupon(p_code text, p_customer_id uuid, p_subtotal numeric)
returns coupons
language plpgsql
as $$
declare
  c coupons%rowtype;
  usage_count int;
begin
  select * into c from coupons where upper(code) = upper(p_code) for update;

  if not found or not c.is_active then
    perform raise_app_error('INVALID_COUPON', 'coupon code not found or inactive');
  end if;

  if now() < c.starts_at or (c.ends_at is not null and now() > c.ends_at) then
    perform raise_app_error('COUPON_EXPIRED', 'coupon is not within its valid date range');
  end if;

  if p_subtotal < c.minimum_order_amount then
    perform raise_app_error('INVALID_COUPON', format('order subtotal below coupon minimum of %s', c.minimum_order_amount));
  end if;

  if c.usage_limit is not null and c.times_used >= c.usage_limit then
    perform raise_app_error('INVALID_COUPON', 'coupon usage limit reached');
  end if;

  select count(*) into usage_count from coupon_usages where coupon_id = c.id and customer_id = p_customer_id;
  if usage_count >= c.customer_usage_limit then
    perform raise_app_error('INVALID_COUPON', 'you have already used this coupon');
  end if;

  return c;
end;
$$;

create or replace function fn_compute_coupon_discount(c coupons, p_subtotal numeric)
returns numeric
language plpgsql
immutable
as $$
declare
  discount numeric;
begin
  if c.coupon_type = 'percentage' then
    discount := p_subtotal * (c.percentage_value / 100.0);
  elsif c.coupon_type = 'fixed' then
    discount := c.fixed_value;
  else
    discount := 0; -- free_delivery type discounts delivery, not subtotal
  end if;

  if c.maximum_discount_amount is not null then
    discount := least(discount, c.maximum_discount_amount);
  end if;

  return least(discount, p_subtotal);
end;
$$;

-- ---------- REVIEW SUBMISSION (only sanctioned path to insert into reviews) ----------
create or replace function fn_submit_review(
  p_product_id uuid, p_order_id uuid, p_order_item_id uuid, p_rating int, p_title text, p_body text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  review_id uuid;
begin
  if auth.uid() is null then
    perform raise_app_error('UNAUTHENTICATED', 'must be signed in to submit a review');
  end if;

  insert into reviews (product_id, customer_id, order_id, order_item_id, rating, title, body)
  values (p_product_id, auth.uid(), p_order_id, p_order_item_id, p_rating, p_title, p_body)
  returning id into review_id;
  -- trg_reviews_eligibility (010) re-validates ownership/delivery-status at insert time

  return review_id;
end;
$$;

comment on function fn_submit_review is
  'The only INSERT path into reviews for customers (RLS blocks direct table inserts). Eligibility is re-checked by trg_reviews_eligibility regardless of caller.';

-- ---------- TRANSACTIONAL ORDER CREATION (checkout) ----------
-- Called by the "create-order" Edge Function AFTER cart + reservations already exist.
-- Coordinates: pricing recomputation, coupon, delivery fee, order + order_items creation,
-- and reservation-to-order linkage. Payment confirmation (fn_process_payment_success)
-- is a SEPARATE step triggered by the Paystack webhook/verification call.
create or replace function fn_create_order_from_cart(
  p_cart_id uuid,
  p_customer_id uuid,
  p_fulfillment fulfillment_type,
  p_delivery_zone_id uuid,
  p_pickup_location_id uuid,
  p_address_snapshot jsonb,
  p_contact_snapshot jsonb,
  p_coupon_code text,
  p_idempotency_key text,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_order_id uuid;
  item record;
  subtotal numeric := 0;
  line_total numeric;
  discount_amount numeric := 0;
  delivery_fee numeric := 0;
  total numeric;
  new_order_id uuid;
  coupon_row coupons;
  free_delivery boolean := false;
  reservation_id uuid;
  zone_name text;
begin
  -- idempotency: if a request with this key already produced an order, return it
  if p_idempotency_key is not null then
    select id into existing_order_id from orders where idempotency_key = p_idempotency_key;
    if found then
      return existing_order_id;
    end if;
  end if;

  if not exists (select 1 from cart_items where cart_id = p_cart_id) then
    perform raise_app_error('PRODUCT_UNAVAILABLE', 'cart is empty');
  end if;

  -- compute authoritative subtotal from CURRENT catalogue prices (never trust client totals)
  select coalesce(sum(po.price * ci.quantity), 0) into subtotal
  from cart_items ci
  join purchase_options po on po.id = ci.purchase_option_id
  where ci.cart_id = p_cart_id;

  if p_coupon_code is not null then
    coupon_row := fn_validate_coupon(p_coupon_code, p_customer_id, subtotal);
    if coupon_row.coupon_type = 'free_delivery' then
      free_delivery := true;
    else
      discount_amount := fn_compute_coupon_discount(coupon_row, subtotal);
    end if;
  end if;

  delivery_fee := fn_calculate_delivery_fee(p_delivery_zone_id, subtotal - discount_amount, p_fulfillment, free_delivery);
  total := subtotal - discount_amount + delivery_fee;

  if p_delivery_zone_id is not null then
    select name into zone_name from delivery_zones where id = p_delivery_zone_id;
  end if;

  insert into orders (
    customer_id, subtotal, discount_amount, delivery_fee, total,
    fulfillment_type, delivery_zone_id, delivery_zone_name_snapshot, pickup_location_id,
    delivery_address_snapshot, customer_contact_snapshot,
    coupon_id, coupon_code_snapshot, coupon_discount_snapshot,
    idempotency_key, utm_source, utm_medium, utm_campaign
  ) values (
    p_customer_id, subtotal, discount_amount, delivery_fee, total,
    p_fulfillment, p_delivery_zone_id, zone_name, p_pickup_location_id,
    p_address_snapshot, p_contact_snapshot,
    coupon_row.id, coupon_row.code, discount_amount,
    p_idempotency_key, p_utm_source, p_utm_medium, p_utm_campaign
  ) returning id into new_order_id;

  -- snapshot each cart item into order_items, and link the reservation created at
  -- checkout-start to this order (so payment success can consume it).
  for item in
    select ci.*, p.name as product_name, p.sku as sku, v.name as variant_name,
           po.name as po_name, po.units_per_purchase, po.price as unit_price
    from cart_items ci
    join products p on p.id = ci.product_id
    left join product_variants v on v.id = ci.variant_id
    join purchase_options po on po.id = ci.purchase_option_id
    where ci.cart_id = p_cart_id
  loop
    line_total := item.unit_price * item.quantity;

    insert into order_items (
      order_id, product_id, variant_id, purchase_option_id,
      product_name_snapshot, sku_snapshot, variant_name_snapshot, purchase_option_name_snapshot,
      units_per_purchase_snapshot, quantity, unit_price_snapshot, line_total
    ) values (
      new_order_id, item.product_id, item.variant_id, item.purchase_option_id,
      item.product_name, item.sku, item.variant_name, item.po_name,
      item.units_per_purchase, item.quantity, item.unit_price, line_total
    );

    -- link any active reservation for this cart+product+variant+option to the new order
    update inventory_reservations
    set order_id = new_order_id
    where cart_id = p_cart_id and status = 'active'
      and inventory_id = (
        select id from inventory where product_id = item.product_id
        and variant_id is not distinct from item.variant_id
      );
  end loop;

  if coupon_row.id is not null then
    insert into coupon_usages (coupon_id, customer_id, order_id, discount_amount)
    values (coupon_row.id, p_customer_id, new_order_id, discount_amount);
    update coupons set times_used = times_used + 1 where id = coupon_row.id;
  end if;

  update carts set status = 'converted', converted_order_id = new_order_id where id = p_cart_id;

  return new_order_id;
end;
$$;

-- ---------- PAYMENT PROCESSING (idempotent Paystack webhook/verification handler) ----------
create or replace function fn_process_payment_success(
  p_reference text, p_order_id uuid, p_amount numeric, p_channel text, p_gateway_response text, p_metadata jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing payments%rowtype;
  o orders%rowtype;
  res record;
begin
  -- idempotency anchor: `reference` is UNIQUE. If we've already processed this exact
  -- Paystack reference, do nothing further (duplicate webhook delivery).
  select * into existing from payments where reference = p_reference;

  if found and existing.status = 'successful' then
    return; -- already processed
  end if;

  select * into o from orders where id = p_order_id for update;
  if not found then
    perform raise_app_error('PRODUCT_UNAVAILABLE', 'order not found for payment reference');
  end if;

  if o.payment_status = 'successful' then
    perform raise_app_error('PAYMENT_ALREADY_PROCESSED', 'this order has already been marked as paid');
  end if;

  if existing.id is null then
    insert into payments (order_id, reference, amount, status, channel, gateway_response, metadata, paid_at, verified_at)
    values (p_order_id, p_reference, p_amount, 'successful', p_channel, p_gateway_response, p_metadata, now(), now());
  else
    update payments
    set status = 'successful', channel = p_channel, gateway_response = p_gateway_response,
        metadata = p_metadata, paid_at = now(), verified_at = now(), updated_at = now()
    where id = existing.id;
  end if;

  update orders
  set payment_status = 'successful', status = 'paid'
  where id = p_order_id;

  -- consume every reservation tied to this order (permanent stock deduction)
  for res in select id from inventory_reservations where order_id = p_order_id and status = 'active'
  loop
    perform fn_consume_reservation(res.id, p_order_id);
  end loop;

  insert into email_logs (recipient_email, customer_id, email_type, related_order_id, status)
  select p_email, o.customer_id, 'payment_confirmation', p_order_id, 'queued'
  from (select coalesce(o.customer_contact_snapshot->>'email', (select email from profiles where id = o.customer_id)) as p_email) x;
end;
$$;

create or replace function fn_process_payment_failure(p_reference text, p_order_id uuid, p_gateway_response text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into payments (order_id, reference, amount, status, gateway_response)
  select p_order_id, p_reference, total, 'failed', p_gateway_response from orders where id = p_order_id
  on conflict (reference) do update set status = 'failed', gateway_response = excluded.gateway_response, updated_at = now();

  update orders set payment_status = 'failed' where id = p_order_id and payment_status = 'pending';
end;
$$;
