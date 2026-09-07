-- =====================================================================================
-- 013_imports.sql
-- Bulk CSV/XLSX product import pipeline: validate -> preview -> import.
-- Rows never insert directly into `products`; they land here first, get validated,
-- and only rows that pass all requirements become active products (others => draft/error).
-- =====================================================================================

create table product_imports (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  storage_path text not null,          -- original uploaded file in Supabase Storage
  uploaded_by uuid not null references profiles(id),
  status import_status not null default 'pending',
  total_rows int not null default 0,
  valid_rows int not null default 0,
  invalid_rows int not null default 0,
  draft_rows int not null default 0,
  imported_rows int not null default 0,
  failed_rows int not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_product_imports_status on product_imports(status);
create index idx_product_imports_uploaded_by on product_imports(uploaded_by);

create trigger trg_product_imports_updated_at
  before update on product_imports for each row execute function set_updated_at();

-- One row per spreadsheet row, holding raw + parsed data and validation outcome.
create table product_import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references product_imports(id) on delete cascade,
  row_number int not null,
  raw_data jsonb not null,             -- verbatim spreadsheet row as submitted
  parsed_name text,
  parsed_sku text,
  parsed_slug text,
  parsed_brand text,
  parsed_category_path text,           -- e.g. "Kitchen & Dining > Lunch Boxes & Flasks"
  parsed_price numeric(12,2),
  parsed_compare_at_price numeric(12,2),
  parsed_stock_quantity int,
  parsed_description text,
  parsed_short_description text,
  primary_image_url text,
  additional_image_urls text[] not null default '{}',
  row_status import_row_status not null default 'pending',
  resulting_product_id uuid references products(id),
  created_at timestamptz not null default now(),
  constraint uq_import_row unique (import_id, row_number)
);

create index idx_import_rows_import on product_import_rows(import_id, row_status);

create table product_import_errors (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references product_imports(id) on delete cascade,
  row_id uuid references product_import_rows(id) on delete cascade,
  row_number int,
  field_name text,
  error_code text not null,        -- 'MISSING_IMAGE','INVALID_PRICE','DUPLICATE_SKU','DUPLICATE_SLUG','INVALID_CATEGORY','MISSING_DESCRIPTION','INVALID_INVENTORY'
  error_message text not null,
  created_at timestamptz not null default now()
);

create index idx_import_errors_import on product_import_errors(import_id);
create index idx_import_errors_code on product_import_errors(error_code);

comment on table product_import_rows is
  'Populated by an Edge Function that parses the uploaded CSV/XLSX. fn_validate_import_row (015) runs per-row validation and writes row_status + product_import_errors. Only rows with row_status=valid AND a usable primary image become status=active products; rows missing an image become row_status=draft and the resulting product is created as status=draft.';
