-- =====================================================================================
-- 026_storage_and_coupons.sql
-- Supabase Storage bucket setup (product images, category images, banners, avatars,
-- import files) and demo coupons.
-- =====================================================================================

-- ---------- STORAGE BUCKETS ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('category-images', 'category-images', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('banner-images', 'banner-images', true, 8388608, array['image/jpeg','image/png','image/webp']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp']),
  ('import-files', 'import-files', false, 20971520, array[
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
  ])
on conflict (id) do nothing;

-- ---------- STORAGE POLICIES ----------
-- Public, read-only buckets: anyone can view; only admins with 'products'/'marketing' edit
-- permission can upload/modify. import-files is private: admins with 'imports' access only.

create policy storage_product_images_public_read on storage.objects for select
  using (bucket_id = 'product-images');
create policy storage_product_images_admin_write on storage.objects for insert
  with check (bucket_id = 'product-images' and has_permission('products','edit'));
create policy storage_product_images_admin_update on storage.objects for update
  using (bucket_id = 'product-images' and has_permission('products','edit'));
create policy storage_product_images_admin_delete on storage.objects for delete
  using (bucket_id = 'product-images' and has_permission('products','delete'));

create policy storage_category_images_public_read on storage.objects for select
  using (bucket_id = 'category-images');
create policy storage_category_images_admin_write on storage.objects for all
  using (bucket_id = 'category-images' and has_permission('products','edit'))
  with check (bucket_id = 'category-images' and has_permission('products','edit'));

create policy storage_banner_images_public_read on storage.objects for select
  using (bucket_id = 'banner-images');
create policy storage_banner_images_admin_write on storage.objects for all
  using (bucket_id = 'banner-images' and has_permission('marketing','edit'))
  with check (bucket_id = 'banner-images' and has_permission('marketing','edit'));

create policy storage_avatars_public_read on storage.objects for select
  using (bucket_id = 'avatars');
create policy storage_avatars_owner_write on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy storage_avatars_owner_update on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy storage_import_files_admin_all on storage.objects for all
  using (bucket_id = 'import-files' and has_permission('imports','edit'))
  with check (bucket_id = 'import-files' and has_permission('imports','edit'));

-- NOTE: intentionally no `comment on table storage.buckets/objects` here — those tables
-- are owned by Supabase's internal `supabase_storage_admin` role, and COMMENT ON TABLE
-- requires ownership (unlike INSERT/CREATE POLICY, which Supabase grants to `postgres`).
-- Running it produces: ERROR 42501: must be owner of table buckets.
-- product-images/category-images/banner-images/avatars are public-read (acting as a
-- CDN-style asset host); import-files is private and admin-only.

-- ---------- DEMO COUPONS ----------
insert into coupons (code, description, coupon_type, percentage_value, minimum_order_amount, maximum_discount_amount, usage_limit, customer_usage_limit, starts_at, ends_at) values
  ('WELCOME10', '10% off your first order', 'percentage', 10, 10000, 5000, 1000, 1, now() - interval '30 days', now() + interval '335 days');

insert into coupons (code, description, coupon_type, fixed_value, minimum_order_amount, usage_limit, customer_usage_limit, starts_at, ends_at) values
  ('SAVE2000', '2,000 off orders above 25,000 naira', 'fixed', 2000, 25000, 500, 2, now() - interval '10 days', now() + interval '20 days');

insert into coupons (code, description, coupon_type, grants_free_delivery, minimum_order_amount, usage_limit, customer_usage_limit, starts_at, ends_at) values
  ('FREESHIP', 'Free delivery on any order above 15,000 naira', 'free_delivery', true, 15000, null, 3, now() - interval '5 days', now() + interval '55 days');
