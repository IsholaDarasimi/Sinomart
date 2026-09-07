-- =====================================================================================
-- 009_orders_payments.sql
-- Orders, immutable order-item snapshots, status history, and Paystack payments.
-- =====================================================================================

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default generate_order_number(),
  customer_id uuid not null references profiles(id),

  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  currency text not null default 'NGN',

  status order_status not null default 'pending_payment',
  payment_status payment_status not null default 'pending',
  fulfillment_type fulfillment_type not null default 'delivery',

  -- delivery snapshot: fee/zone captured at order time and never mutated by later admin edits
  delivery_zone_id uuid references delivery_zones(id),
  delivery_zone_name_snapshot text,
  pickup_location_id uuid references pickup_locations(id),
  delivery_address_snapshot jsonb,     -- {full_name,phone,address_line,city,state,area,landmark,instructions}
  customer_contact_snapshot jsonb,     -- {full_name,email,phone}

  coupon_id uuid references coupons(id),
  coupon_code_snapshot text,
  coupon_discount_snapshot numeric(12,2),

  -- delivery tracking
  delivery_provider text,
  tracking_number text,
  dispatched_at timestamptz,
  estimated_delivery_date date,
  delivered_at timestamptz,
  delivery_notes text,

  utm_source text,
  utm_medium text,
  utm_campaign text,

  notes text,
  idempotency_key text unique,          -- prevents duplicate order creation from repeated client requests

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_order_total check (total = subtotal - discount_amount + delivery_fee)
);

create index idx_orders_customer on orders(customer_id, created_at desc);
create index idx_orders_status on orders(status);
create index idx_orders_payment_status on orders(payment_status);
create index idx_orders_created on orders(created_at desc);
create index idx_orders_number on orders(order_number);

create trigger trg_orders_updated_at
  before update on orders for each row execute function set_updated_at();

-- Now that orders exists, wire up the deferred FKs from earlier migrations.
alter table carts add constraint fk_carts_converted_order foreign key (converted_order_id) references orders(id);
alter table inventory_movements add constraint fk_inventory_movements_order foreign key (order_id) references orders(id);
alter table inventory_reservations add constraint fk_reservations_order foreign key (order_id) references orders(id);
alter table inventory_reservations add constraint fk_reservations_cart foreign key (cart_id) references carts(id);
alter table coupon_usages add constraint fk_coupon_usages_order foreign key (order_id) references orders(id);

-- ---------- ORDER ITEMS (immutable historical snapshot) ----------
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),          -- kept for analytics joins; nullable in case product later hard-deleted
  variant_id uuid references product_variants(id),
  purchase_option_id uuid references purchase_options(id),

  -- SNAPSHOT fields: authoritative for what the customer actually bought/paid, regardless
  -- of later catalogue changes.
  product_name_snapshot text not null,
  sku_snapshot text not null,
  variant_name_snapshot text,
  purchase_option_name_snapshot text not null,
  units_per_purchase_snapshot int not null,
  quantity int not null check (quantity > 0),
  unit_price_snapshot numeric(12,2) not null check (unit_price_snapshot >= 0),
  discount_snapshot numeric(12,2) not null default 0,
  line_total numeric(12,2) not null check (line_total >= 0),
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index idx_order_items_order on order_items(order_id);
create index idx_order_items_product on order_items(product_id);

comment on table order_items is
  'Fully denormalized snapshot. If a product name, price, or SKU changes later, historical orders remain unaffected.';

-- ---------- ORDER STATUS HISTORY ----------
create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  changed_by uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create index idx_order_status_history_order on order_status_history(order_id, created_at);

create or replace function log_order_status_change()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') or (old.status is distinct from new.status) then
    insert into order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, case when tg_op = 'INSERT' then null else old.status end, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_orders_status_history
  after insert or update of status on orders
  for each row execute function log_order_status_change();

-- ---------- PAYMENTS (Paystack) ----------
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider payment_provider not null default 'paystack',
  reference text not null unique,       -- Paystack transaction reference; unique => idempotency anchor
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'NGN',
  status payment_status not null default 'pending',
  channel text,                          -- card, bank_transfer, ussd, etc. (from Paystack response)
  gateway_response text,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_order on payments(order_id);
create index idx_payments_status on payments(status);
create index idx_payments_reference on payments(reference);

create trigger trg_payments_updated_at
  before update on payments for each row execute function set_updated_at();

comment on table payments is
  'Server-verified only. reference is UNIQUE so duplicate Paystack webhook deliveries cannot create duplicate payment rows — see fn_process_payment_success in 015.';
