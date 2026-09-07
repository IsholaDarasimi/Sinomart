-- =====================================================================================
-- 019_seed_helper_functions.sql
-- Convenience functions used ONLY by the seed data (020) to create fully-valid,
-- immediately-active demo products in one call each: product + primary image +
-- category link(s) + default purchase option + inventory row, in the correct
-- dependency order so the activation guard trigger (015) passes cleanly.
--
-- NOTE ON IMAGES: demo product photography is not available at seed time, and this
-- schema explicitly forbids fabricating URLs that do not resolve. Seed images therefore
-- use https://picsum.photos/seed/<slug>/<w>/<h> — a real, stable, publicly reachable
-- placeholder-photo service — clearly labelled via alt_text as a placeholder. Real
-- product photography should be uploaded to Supabase Storage via the admin panel or
-- the bulk-import pipeline (013), which will replace these rows.
-- =====================================================================================

create or replace function admin_seed_product(
  p_name text,
  p_sku text,
  p_brand_slug text,
  p_category_slugs text[],
  p_primary_category_slug text,
  p_short_description text,
  p_description text,
  p_price numeric,
  p_compare_at_price numeric,
  p_stock int,
  p_low_stock_threshold int,
  p_purchase_unit_name text,
  p_unit_type text,
  p_units_per_purchase int,
  p_image_seed text,
  p_is_featured boolean default false,
  p_is_new boolean default false,
  p_is_best_seller boolean default false
) returns uuid
language plpgsql
as $$
declare
  v_product_id uuid;
  v_brand_id uuid;
  v_slug text;
  v_cat_slug text;
begin
  select id into v_brand_id from brands where slug = p_brand_slug;

  v_slug := slugify(p_name) || '-' || lower(p_sku);

  insert into products (
    name, slug, sku, brand_id, short_description, description,
    base_price, compare_at_price, status, product_type,
    is_featured, is_new, is_best_seller
  ) values (
    p_name, v_slug, p_sku, v_brand_id, p_short_description, p_description,
    p_price, p_compare_at_price, 'draft', 'simple',
    p_is_featured, p_is_new, p_is_best_seller
  ) returning id into v_product_id;

  insert into product_images (product_id, image_url, alt_text, is_primary, sort_order)
  values (v_product_id, 'https://picsum.photos/seed/' || p_image_seed || '/800/800',
          '[Placeholder demo image] ' || p_name, true, 0);

  foreach v_cat_slug in array p_category_slugs loop
    insert into product_categories (product_id, category_id, is_primary)
    select v_product_id, c.id, (v_cat_slug = p_primary_category_slug)
    from categories c where c.slug = v_cat_slug;
  end loop;

  insert into purchase_options (
    product_id, name, unit_type, units_per_purchase, price, compare_at_price, is_default, is_active
  ) values (
    v_product_id, p_purchase_unit_name, p_unit_type, p_units_per_purchase, p_price, p_compare_at_price, true, true
  );

  insert into inventory (product_id, quantity_on_hand, quantity_reserved, low_stock_threshold)
  values (v_product_id, p_stock, 0, p_low_stock_threshold);

  insert into inventory_movements (
    inventory_id, product_id, movement_type, previous_quantity, quantity_change, resulting_quantity, reason
  )
  select id, v_product_id, 'initial_stock', 0, p_stock, p_stock, 'seed data initial stock'
  from inventory where product_id = v_product_id and variant_id is null;

  update products set status = 'active' where id = v_product_id;

  return v_product_id;
end;
$$;

-- Adds an ADDITIONAL purchase option (e.g. a bulk "1 Dozen" option) beyond a product's default.
create or replace function admin_add_purchase_option(
  p_product_id uuid, p_name text, p_unit_type text, p_units_per_purchase int,
  p_price numeric, p_compare_at_price numeric default null,
  p_min_qty int default 1, p_max_qty int default null, p_step int default 1
) returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into purchase_options (
    product_id, name, unit_type, units_per_purchase, price, compare_at_price,
    minimum_quantity, maximum_quantity, quantity_step, is_default, is_active
  ) values (
    p_product_id, p_name, p_unit_type, p_units_per_purchase, p_price, p_compare_at_price,
    p_min_qty, p_max_qty, p_step, false, true
  ) returning id into v_id;
  return v_id;
end;
$$;

comment on function admin_seed_product is
  'Seed-only convenience wrapper. Production admin product creation should go through the same underlying tables via the admin UI / Edge Functions, following identical validation order.';
