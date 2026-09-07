-- =====================================================================================
-- SINOMART SUPER STORE — SUPABASE/POSTGRES BACKEND
-- 001_extensions_enums.sql
-- Extensions, enumerated types, and generic helper functions used across the schema.
-- =====================================================================================

-- ---------- EXTENSIONS ----------
create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists pg_trgm;       -- trigram search / fuzzy matching
create extension if not exists unaccent;      -- accent-insensitive search
create extension if not exists btree_gin;     -- composite GIN indexes

-- ---------- ENUM TYPES ----------

create type user_role as enum ('customer', 'admin', 'super_admin');

create type product_status as enum ('draft', 'active', 'archived', 'out_of_stock');

create type product_type as enum ('simple', 'variant');

create type inventory_movement_type as enum (
  'initial_stock', 'restock', 'sale', 'reservation', 'reservation_release',
  'return', 'damaged', 'manual_adjustment', 'correction'
);

create type reservation_status as enum ('active', 'released', 'consumed', 'expired');

create type order_status as enum (
  'pending_payment', 'paid', 'confirmed', 'processing', 'ready_for_delivery',
  'out_for_delivery', 'delivered', 'ready_for_pickup', 'collected', 'cancelled', 'refunded'
);

create type payment_status as enum ('pending', 'successful', 'failed', 'abandoned', 'refunded');

create type payment_provider as enum ('paystack');

create type fulfillment_type as enum ('delivery', 'pickup');

create type coupon_type as enum ('percentage', 'fixed', 'free_delivery');

create type review_status as enum ('pending', 'approved', 'hidden', 'flagged');

create type conversation_status as enum ('open', 'pending', 'closed');

create type conversation_category as enum ('support', 'order', 'delivery', 'payment', 'general');

create type message_sender_type as enum ('customer', 'admin', 'system');

create type import_status as enum ('pending', 'validating', 'previewed', 'importing', 'completed', 'failed');

create type import_row_status as enum ('pending', 'valid', 'draft', 'error', 'imported');

create type banner_destination_type as enum ('category', 'campaign', 'product', 'external_url', 'none');

create type email_status as enum ('queued', 'sent', 'failed', 'bounced');

create type email_type as enum (
  'welcome', 'order_confirmation', 'payment_confirmation', 'order_processing',
  'order_dispatched', 'order_delivered', 'password_reset', 'security_alert',
  'review_reminder', 'newsletter', 'admin_alert'
);

create type discount_type as enum ('percentage', 'fixed');

create type recommendation_type as enum ('similar', 'frequently_bought_together', 'manual', 'related');

create type analytics_event_type as enum (
  'product_view', 'category_view', 'search', 'search_result_click',
  'banner_view', 'banner_click', 'add_to_cart', 'remove_from_cart',
  'save_product', 'unsave_product', 'checkout_started', 'payment_started',
  'payment_success', 'payment_failed', 'order_created', 'order_delivered', 'review_created'
);

-- ---------- GENERIC HELPER FUNCTIONS ----------

-- updated_at maintenance trigger
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Slugify helper (basic, deterministic; app layer should still guarantee uniqueness)
create or replace function slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      lower(unaccent(coalesce(input, ''))),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

-- Human readable order number generator: SM-YYYYMMDD-XXXXXX
create sequence if not exists order_number_seq;

create or replace function generate_order_number()
returns text
language sql
as $$
  select 'SM-' || to_char(now(), 'YYYYMMDD') || '-' ||
         lpad(nextval('order_number_seq')::text, 6, '0');
$$;

comment on function generate_order_number() is
  'Generates a human-readable, sequential order number. Uniqueness guaranteed by the sequence.';
