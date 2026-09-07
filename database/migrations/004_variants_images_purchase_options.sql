-- =====================================================================================
-- 004_variants_images_purchase_options.sql
-- Product variants, multi-image gallery, and the purchase-unit / bulk-buying model.
-- =====================================================================================

-- ---------- PRODUCT VARIANTS ----------
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text not null unique,
  name text not null,                          -- e.g. "Black / Medium"
  attributes jsonb not null default '{}'::jsonb, -- e.g. {"color":"Black","size":"Medium"}
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= price),
  status product_status not null default 'active',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_variants_product on product_variants(product_id);
create index idx_variants_attributes on product_variants using gin(attributes);

create trigger trg_variants_updated_at
  before update on product_variants for each row execute function set_updated_at();

-- ---------- PRODUCT IMAGES ----------
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  storage_path text,           -- Supabase Storage object path, e.g. 'products/<product_id>/01.jpg'
  image_url text,              -- resolved public/signed URL (derived, cached at read time or on upload)
  alt_text text,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_image_has_source check (storage_path is not null or image_url is not null)
);

create index idx_images_product on product_images(product_id);
create index idx_images_variant on product_images(variant_id);
create unique index uq_images_primary_per_product
  on product_images(product_id) where is_primary = true and variant_id is null;

create trigger trg_images_updated_at
  before update on product_images for each row execute function set_updated_at();

comment on table product_images is
  'Images live in Supabase Storage, never as bytes in Postgres. A product cannot be status=active without at least one row here (enforced by trigger in 015).';

-- ---------- PURCHASE OPTIONS (unit-of-sale / bulk purchasing) ----------
-- This is the mechanism that lets a customer buy "1 Dozen" and receive 12 physical units,
-- while inventory itself is always tracked in physical base units (see 005_inventory.sql).
create table purchase_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  name text not null,                 -- '1 Piece','1 Pair','1 Pack','1 Dozen','1 Box'...
  unit_type text not null,            -- 'piece','pair','pack','set','dozen','box'
  units_per_purchase int not null check (units_per_purchase > 0),
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= price),
  minimum_quantity int not null default 1 check (minimum_quantity > 0),
  maximum_quantity int check (maximum_quantity is null or maximum_quantity >= minimum_quantity),
  quantity_step int not null default 1 check (quantity_step > 0),
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CHECK constraints cannot contain subqueries, so this cross-table integrity rule
-- (a purchase option's variant, if set, must belong to the same product) is enforced
-- via trigger instead.
create or replace function enforce_purchase_option_variant_matches_product()
returns trigger
language plpgsql
as $$
begin
  if new.variant_id is not null and not exists (
    select 1 from product_variants v where v.id = new.variant_id and v.product_id = new.product_id
  ) then
    raise exception 'PURCHASE_OPTION_VARIANT_MISMATCH: variant % does not belong to product %', new.variant_id, new.product_id;
  end if;
  return new;
end;
$$;

create trigger trg_purchase_options_variant_match
  before insert or update of variant_id, product_id on purchase_options
  for each row execute function enforce_purchase_option_variant_matches_product();

create index idx_purchase_options_product on purchase_options(product_id);
create index idx_purchase_options_variant on purchase_options(variant_id);
create unique index uq_purchase_options_default
  on purchase_options(product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where is_default = true;

create trigger trg_purchase_options_updated_at
  before update on purchase_options for each row execute function set_updated_at();

comment on column purchase_options.units_per_purchase is
  'Number of PHYSICAL base units consumed for every 1 unit of "quantity" a customer selects. E.g. "1 Dozen" => 12.';
comment on table purchase_options is
  'Example: Ceramic Mug, option "1 Dozen", units_per_purchase=12, price=15000. Customer quantity=3 => 36 physical units deducted, price=45000.';
