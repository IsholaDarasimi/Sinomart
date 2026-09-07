-- =====================================================================================
-- 005_inventory.sql
-- Physical inventory (in base units), reservations, and full movement history.
-- Stock is ALWAYS tracked in physical base units, never in "purchase option" units.
-- =====================================================================================

create table inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  quantity_on_hand int not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved int not null default 0 check (quantity_reserved >= 0),
  low_stock_threshold int not null default 10 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now(),
  constraint chk_reserved_not_exceed_on_hand check (quantity_reserved <= quantity_on_hand),
  constraint uq_inventory_product_variant unique (product_id, variant_id)
);

-- Partial unique index to correctly treat variant_id IS NULL as a distinct single row per product
create unique index uq_inventory_product_only
  on inventory(product_id) where variant_id is null;

create index idx_inventory_product on inventory(product_id);
create index idx_inventory_low_stock
  on inventory(product_id) where quantity_on_hand - quantity_reserved <= low_stock_threshold;

create trigger trg_inventory_updated_at
  before update on inventory for each row execute function set_updated_at();

comment on table inventory is
  'One row per sellable unit (product, or product+variant). available = quantity_on_hand - quantity_reserved.';

-- Convenience generated view of available stock (not a stored column, always live)
create view inventory_available as
  select
    id, product_id, variant_id,
    quantity_on_hand,
    quantity_reserved,
    (quantity_on_hand - quantity_reserved) as quantity_available,
    low_stock_threshold,
    (quantity_on_hand - quantity_reserved) <= low_stock_threshold as is_low_stock,
    (quantity_on_hand - quantity_reserved) <= 0 as is_out_of_stock
  from inventory;

-- ---------- INVENTORY MOVEMENTS (immutable audit trail of every stock change) ----------
create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references inventory(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid references product_variants(id),
  purchase_option_id uuid references purchase_options(id),
  movement_type inventory_movement_type not null,
  previous_quantity int not null,
  quantity_change int not null,        -- signed: positive = increase, negative = decrease
  resulting_quantity int not null,
  reason text,
  order_id uuid,                       -- FK added in 009 after orders table exists
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_inventory_movements_inventory on inventory_movements(inventory_id);
create index idx_inventory_movements_product on inventory_movements(product_id);
create index idx_inventory_movements_order on inventory_movements(order_id);
create index idx_inventory_movements_created on inventory_movements(created_at desc);

comment on table inventory_movements is
  'Append-only ledger. Every stock change (sale, restock, reservation, release, damage, correction) is recorded here for full traceability.';

-- ---------- INVENTORY RESERVATIONS (checkout-time holds) ----------
create table inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references inventory(id) on delete cascade,
  cart_id uuid,                         -- FK added in 006
  order_id uuid,                        -- FK added in 009 once order confirmed/consumed
  quantity int not null check (quantity > 0),
  status reservation_status not null default 'active',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_reservations_inventory on inventory_reservations(inventory_id);
create index idx_reservations_status_expiry on inventory_reservations(status, expires_at);
create index idx_reservations_cart on inventory_reservations(cart_id);
create index idx_reservations_order on inventory_reservations(order_id);

create trigger trg_reservations_updated_at
  before update on inventory_reservations for each row execute function set_updated_at();

comment on table inventory_reservations is
  'Short-lived holds created at checkout start. Released automatically on expiry or cancellation, consumed on successful payment. See fn_reserve_inventory / fn_release_reservation / fn_consume_reservation in 015.';
