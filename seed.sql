-- =========================
-- EXTENSIONS
-- =========================
create extension if not exists "uuid-ossp";

-- =========================
-- ORGANIZATIONS
-- =========================
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan text default 'free',
  created_at timestamp default now()
);

alter table organizations enable row level security;

-- Chaque org ne peut voir que ses propres données
create policy "Org members can view their org"
on organizations for select
using ( id = auth.jwt() ->> 'organization_id' );

-- =========================
-- PROFILES (extension de auth.users)
-- =========================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  role text default 'member',
  created_at timestamp default now()
);

alter table profiles enable row level security;

-- RLS sur profiles
create policy "Users can view own profile"
on profiles for select
using ( id = auth.uid() );

create policy "Users can update own profile"
on profiles for update
using ( id = auth.uid() );

create policy "Org members only see same org profiles"
on profiles for all
using ( organization_id = auth.jwt() ->> 'organization_id' );

-- =========================
-- MODULE DEF (catalogue ouvert)
-- =========================
create table if not exists module_def (
  key text primary key,         -- ex: 'recruitment', 'ged', 'inventory'
  name text not null,           -- Nom affiché
  version text default '1.0.0',
  is_core boolean default false,
  created_at timestamp default now()
);

-- Pas de RLS sur module_def (catalogue global)

-- =========================
-- TENANT MODULES (activation par orga)
-- =========================
create table if not exists tenant_module (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  module_key text not null references module_def(key) on delete cascade,
  enabled boolean default true,
  config jsonb default '{}'::jsonb,
  created_at timestamp default now(),
  unique(organization_id, module_key)
);

alter table tenant_module enable row level security;

-- RLS : isolation par organisation
create policy "Tenant modules isolation"
on tenant_module for all
using ( organization_id = auth.jwt() ->> 'organization_id' );

-- =========================
-- MODULE RECRUITMENT (exemple)
-- =========================
create table if not exists candidates (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  email text not null,
  cv_url text,
  status text default 'pending',
  created_at timestamp default now()
);

alter table candidates enable row level security;

create policy "Candidates isolation"
on candidates for all
using ( organization_id = auth.jwt() ->> 'organization_id'::uuid );

-- =========================
-- MODULE GED (exemple)
-- =========================
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  file_url text not null,
  created_at timestamp default now()
);

alter table documents enable row level security;

create policy "Documents isolation"
on documents for all
using ( organization_id = auth.jwt() ->> 'organization_id' );
