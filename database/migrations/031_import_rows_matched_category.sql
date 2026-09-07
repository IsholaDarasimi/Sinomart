-- =====================================================================================
-- 031_import_rows_matched_category.sql
-- Adds a dedicated column to hold the category resolved during validation, instead of
-- overloading `raw_data` (which must remain the verbatim original spreadsheet row for
-- audit/debugging purposes). Used by product-import-validate and product-import-commit.
-- =====================================================================================

alter table product_import_rows
  add column matched_category_id uuid references categories(id);

create index idx_import_rows_matched_category on product_import_rows(matched_category_id);
