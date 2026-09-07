-- =====================================================================================
-- 006_cart_saved.sql
-- Carts, cart items, and saved-for-later products. All pricing is recomputed server-side
-- at read/checkout time — client-submitted prices/discounts are never trusted.
-- =====================================================================================

create table carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id) on delete cascade,   -- null for guest/session carts
  session_id text,                                               -- anonymous/guest identifier
  status text not null default 'active' check (status in ('active','converted','abandoned')),
  converted_order_id uuid,             -- FK added in 009
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_cart_owner check (customer_id is not null or session_id is not null)
);

create index idx_carts_customer on carts(customer_id) where customer_id is not null;
create index idx_carts_session on carts(session_id) where session_id is not null;
create index idx_carts_status on carts(status);

create trigger trg_carts_updated_at
  before update on carts for each row execute function set_updated_at();

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid references product_variants(id),
  purchase_option_id uuid not null references purchase_options(id),
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_cart_item_combo unique (cart_id, product_id, variant_id, purchase_option_id)
);

create index idx_cart_items_cart on cart_items(cart_id);
create index idx_cart_items_product on cart_items(product_id);

create trigger trg_cart_items_updated_at
  before update on cart_items for each row execute function set_updated_at();

comment on table cart_items is
  'Prevents duplicate (product,variant,purchase_option) rows per cart via unique constraint; quantity is simply incremented instead.';

-- ---------- SAVED PRODUCTS (wishlist) ----------
create table saved_products (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint uq_saved_products unique (customer_id, product_id)
);

create index idx_saved_products_customer on saved_products(customer_id, created_at desc);
create index idx_saved_products_product on saved_products(product_id);
