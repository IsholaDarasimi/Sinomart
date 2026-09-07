-- =====================================================================================
-- 002_profiles_addresses.sql
-- User profiles (extends auth.users), admin permission model, addresses, security state.
-- =====================================================================================

-- ---------- PROFILES ----------
-- Supabase Auth (auth.users) owns credentials, password hashes, and MFA factors
-- (auth.mfa_factors / auth.mfa_amr_claims). We never duplicate secrets here.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  role user_role not null default 'customer',
  is_active boolean not null default true,
  -- app-level security posture (actual TOTP secrets live in Supabase Auth, not here)
  requires_2fa boolean not null default false,
  two_factor_enabled boolean not null default false,
  marketing_opt_in boolean not null default true,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'Extends auth.users. Role changes must go through privileged RPC, never direct client update.';
comment on column profiles.requires_2fa is 'Set true for all admin/super_admin accounts; enforced at login by app logic.';

create index idx_profiles_role on profiles(role);
create index idx_profiles_is_active on profiles(is_active);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-provision a profile row whenever a new auth user is created.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ---------- AUTH HELPER FUNCTIONS (used throughout RLS policies) ----------

create or replace function current_role_is(target_role user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = target_role and is_active = true
  );
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'super_admin') and is_active = true
  );
$$;

create or replace function is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'super_admin' and is_active = true
  );
$$;

comment on function is_admin() is 'security definer so it can read profiles.role even under callers own restrictive RLS context.';

-- ---------- ADMIN PERMISSION MODEL ----------
-- Fine-grained permission areas so "admin" is not automatically all-powerful.
-- Super admins implicitly bypass this table (checked via is_super_admin()).

create table permission_areas (
  key text primary key,          -- 'products','inventory','orders','customers','marketing','reviews','analytics','settings','imports'
  label text not null
);

insert into permission_areas (key, label) values
  ('products', 'Product Management'),
  ('inventory', 'Inventory Management'),
  ('orders', 'Order Management'),
  ('customers', 'Customer Management'),
  ('marketing', 'Marketing (Campaigns, Coupons, Banners)'),
  ('reviews', 'Review Moderation'),
  ('analytics', 'Analytics & Reporting'),
  ('settings', 'Store Settings'),
  ('imports', 'Bulk Imports');

create table admin_permissions (
  admin_id uuid not null references profiles(id) on delete cascade,
  area_key text not null references permission_areas(key) on delete cascade,
  can_view boolean not null default true,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  granted_by uuid references profiles(id),
  granted_at timestamptz not null default now(),
  primary key (admin_id, area_key)
);

create or replace function has_permission(area text, level text default 'view')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    is_super_admin()
    or exists (
      select 1 from admin_permissions ap
      join profiles p on p.id = ap.admin_id
      where ap.admin_id = auth.uid()
        and ap.area_key = area
        and p.role in ('admin','super_admin')
        and p.is_active = true
        and (
          (level = 'view' and ap.can_view) or
          (level = 'edit' and ap.can_edit) or
          (level = 'delete' and ap.can_delete)
        )
    );
$$;

-- ---------- ADDRESSES ----------
create table addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  state text not null default 'Lagos',
  area text,                     -- maps loosely to delivery_zone_areas.name for fee lookup
  landmark text,
  delivery_instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_addresses_customer on addresses(customer_id);

create trigger trg_addresses_updated_at
  before update on addresses
  for each row execute function set_updated_at();

-- Ensure only one default address per customer
create or replace function enforce_single_default_address()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update addresses set is_default = false
    where customer_id = new.customer_id and id <> new.id and is_default = true;
  end if;
  return new;
end;
$$;

create trigger trg_addresses_single_default
  before insert or update on addresses
  for each row execute function enforce_single_default_address();
