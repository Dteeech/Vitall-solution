/*
  # Core multi-tenant schema initialization
  
  1. New Tables
    - `organizations` - Main tenant entities with plan management
    - `profiles` - User profiles linked to organizations (1:1 with auth.users)
    - `core_module` - Module catalog with metadata
    - `core_organization_module` - Module activation per organization
    - `audit_log` - Simple audit trail for compliance
    
  2. Security
    - Enable RLS on all tables
    - Policies based on JWT organization_id claim
    - Helper functions for organization context
    
  3. Extensions
    - UUID generation for primary keys
    - JWT handling for user context
*/

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Organizations table (main tenant entities)
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User profiles (linked to auth.users)
create table if not exists profiles (
  id uuid primary key, -- equals auth.users.id
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Module catalog
create table if not exists core_module (
  name text primary key,
  title text not null,
  description text,
  icon text,
  category text default 'business',
  enabled_by_default boolean default false,
  requires_modules text[] default '{}',
  created_at timestamptz default now()
);

-- Organization module activations
create table if not exists core_organization_module (
  organization_id uuid not null references organizations(id) on delete cascade,
  module_name text not null references core_module(name) on delete cascade,
  enabled boolean not null default true,
  config jsonb default '{}',
  installed_at timestamptz not null default now(),
  primary key (organization_id, module_name)
);

-- Audit log for compliance
create table if not exists audit_log (
  id bigserial primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id text,
  payload jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table core_module enable row level security;
alter table core_organization_module enable row level security;
alter table audit_log enable row level security;

-- Helper function to get organization ID from JWT
create or replace function get_organization_id()
returns uuid
language sql
security definer
stable
as $$
  select (auth.jwt() ->> 'organization_id')::uuid;
$$;

-- Helper function to check if user has role
create or replace function has_role(required_role text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles 
    where id = auth.uid() 
    and organization_id = get_organization_id()
    and role = required_role
  );
$$;

-- RLS Policies

-- Organizations: users can only see their own org
create policy "Users can view own organization"
  on organizations
  for select
  to authenticated
  using (id = get_organization_id());

create policy "Owners can update organization"
  on organizations
  for update
  to authenticated
  using (id = get_organization_id() and has_role('owner'))
  with check (id = get_organization_id() and has_role('owner'));

-- Profiles: users can see profiles in their org
create policy "Users can view org profiles"
  on profiles
  for select
  to authenticated
  using (organization_id = get_organization_id());

create policy "Users can update own profile"
  on profiles
  for update
  to authenticated
  using (id = auth.uid() and organization_id = get_organization_id())
  with check (id = auth.uid() and organization_id = get_organization_id());

create policy "Admins can manage profiles"
  on profiles
  for all
  to authenticated
  using (
    organization_id = get_organization_id() 
    and (has_role('admin') or has_role('owner'))
  )
  with check (
    organization_id = get_organization_id() 
    and (has_role('admin') or has_role('owner'))
  );

-- Modules: everyone can see available modules
create policy "Anyone can view modules"
  on core_module
  for select
  to authenticated
  using (true);

-- Organization modules: users can see their org's modules
create policy "Users can view org modules"
  on core_organization_module
  for select
  to authenticated
  using (organization_id = get_organization_id());

create policy "Admins can manage org modules"
  on core_organization_module
  for all
  to authenticated
  using (
    organization_id = get_organization_id() 
    and (has_role('admin') or has_role('owner'))
  )
  with check (
    organization_id = get_organization_id() 
    and (has_role('admin') or has_role('owner'))
  );

-- Audit log: users can only see their org's logs
create policy "Users can view org audit logs"
  on audit_log
  for select
  to authenticated
  using (organization_id = get_organization_id());

-- Indexes for performance
create index if not exists idx_profiles_organization_id on profiles(organization_id);
create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_org_modules_org_id on core_organization_module(organization_id);
create index if not exists idx_org_modules_enabled on core_organization_module(organization_id, enabled) where enabled = true;
create index if not exists idx_audit_log_org_id on audit_log(organization_id);
create index if not exists idx_audit_log_created_at on audit_log(created_at desc);

-- Update timestamps trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_organizations_updated_at
  before update on organizations
  for each row execute function update_updated_at_column();

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();