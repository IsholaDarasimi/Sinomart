-- =====================================================================================
-- 007_delivery.sql
-- Delivery zones, serviceable areas, pickup locations. All fee data is admin-editable
-- and demonstration-only (see seed file 018 for illustrative Lagos values).
-- =====================================================================================

create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,             -- 'Zone A', 'Zone B', ...
  description text,
  fee numeric(12,2) not null check (fee >= 0),
  free_delivery_threshold numeric(12,2),  -- NULL = no automatic free-delivery threshold
  minimum_order_amount numeric(12,2) not null default 0,
  estimated_min_days int not null default 1,
  estimated_max_days int not null default 3,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_delivery_zones_updated_at
  before update on delivery_zones for each row execute function set_updated_at();

create table delivery_zone_areas (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references delivery_zones(id) on delete cascade,
  area_name text not null,               -- 'Victoria Island', 'Ikeja', ...
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_area_name unique (area_name)   -- an area belongs to exactly one zone at a time
);

create index idx_delivery_areas_zone on delivery_zone_areas(zone_id);

create trigger trg_delivery_areas_updated_at
  before update on delivery_zone_areas for each row execute function set_updated_at();

comment on table delivery_zone_areas is
  'Admins can move an area between zones simply by updating zone_id; uq_area_name keeps assignment unambiguous.';

create table pickup_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null default 'Lagos',
  contact_phone text,
  opening_hours text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_pickup_locations_updated_at
  before update on pickup_locations for each row execute function set_updated_at();
