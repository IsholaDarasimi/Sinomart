-- =====================================================================================
-- 003_catalog_categories_products.sql
-- Brands, hierarchical categories, and the core products table.
-- =====================================================================================

-- ---------- BRANDS ----------
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_brands_updated_at
  before update on brands for each row execute function set_updated_at();

-- ---------- CATEGORIES (self-referencing: top-level + nested subcategories) ----------
create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  storage_path text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_category_not_self_parent check (id <> parent_id)
);

create index idx_categories_parent on categories(parent_id);
create index idx_categories_active on categories(is_active);
create unique index uq_categories_parent_name on categories (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), name);

create trigger trg_categories_updated_at
  before update on categories for each row execute function set_updated_at();

-- Prevent categories from nesting more than 2 levels deep (top-level -> subcategory)
create or replace function enforce_category_depth()
returns trigger
language plpgsql
as $$
declare
  parent_has_parent boolean;
begin
  if new.parent_id is not null then
    select (parent_id is not null) into parent_has_parent
    from categories where id = new.parent_id;
    if parent_has_parent then
      raise exception 'CATEGORY_DEPTH_EXCEEDED: categories only support two levels (top-level -> subcategory)';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_categories_depth
  before insert or update on categories
  for each row execute function enforce_category_depth();

comment on table categories is
  'Two-level hierarchy: parent_id IS NULL = top-level department, parent_id set = subcategory. Dynamic and admin-editable.';

-- ---------- PRODUCTS ----------
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text not null unique,
  barcode text,
  brand_id uuid references brands(id),
  short_description text,
  description text,
  status product_status not null default 'draft',
  product_type product_type not null default 'simple',

  -- structured content
  materials text,
  dimensions text,          -- e.g. "45cm x 30cm x 20cm"
  weight_kg numeric(10,3),
  care_instructions text,
  warranty_info text,
  specifications jsonb not null default '{}'::jsonb,   -- flexible spec sheet
  features text[] not null default '{}',

  -- base pricing (used directly for simple products with no variants; variant/purchase-option
  -- pricing overrides this where applicable — see 004_variants_images_purchase_options.sql)
  base_price numeric(12,2) not null check (base_price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),

  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_best_seller boolean not null default false,
  is_active boolean not null default true,   -- soft-delete / storefront visibility toggle

  search_vector tsvector,

  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_compare_at_price check (compare_at_price is null or compare_at_price >= base_price)
);

create index idx_products_status on products(status);
create index idx_products_brand on products(brand_id);
create index idx_products_active on products(is_active) where is_active = true;
create index idx_products_featured on products(is_featured) where is_featured = true;
create index idx_products_search_vector on products using gin(search_vector);
create index idx_products_name_trgm on products using gin (name gin_trgm_ops);
create index idx_products_sku_trgm on products using gin (sku gin_trgm_ops);

create trigger trg_products_updated_at
  before update on products for each row execute function set_updated_at();

-- keep full-text search vector current
create or replace function products_update_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce((select name from brands where id = new.brand_id),'')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.short_description,'')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.description,'')), 'D') ||
    setweight(to_tsvector('english', coalesce(new.sku,'')), 'B');
  return new;
end;
$$;

create trigger trg_products_search_vector
  before insert or update of name, brand_id, short_description, description, sku
  on products
  for each row execute function products_update_search_vector();

-- ---------- PRODUCT <-> CATEGORY (many-to-many, mandatory multi-category support) ----------
create table product_categories (
  product_id uuid not null references products(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  is_primary boolean not null default false,   -- one "primary" category drives canonical breadcrumb
  created_at timestamptz not null default now(),
  primary key (product_id, category_id)
);

create index idx_product_categories_category on product_categories(category_id);
create index idx_product_categories_product on product_categories(product_id);

-- Only one primary category per product
create unique index uq_product_categories_primary
  on product_categories(product_id) where is_primary = true;

comment on table product_categories is
  'A product may belong to many categories/subcategories simultaneously (e.g. a lunch box in Kitchen>Lunch Boxes AND Kids>School Essentials AND Office>School Supplies).';
