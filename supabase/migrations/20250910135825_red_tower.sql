/*
  # GED (Document Management) Module Schema
  
  1. New Tables
    - `ged_document` - Document metadata and versioning
    - `ged_folder` - Folder structure for organization
    - `ged_document_share` - Document sharing and permissions
    
  2. Security  
    - RLS with organization isolation
    - Integration with Supabase Storage bucket 'ged'
    - Fine-grained access control
    
  3. Features
    - Document versioning
    - Folder hierarchy
    - Tag-based categorization
    - Share permissions (read/write)
*/

-- Folders for document organization
create table if not exists ged_folder (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  parent_id uuid references ged_folder(id) on delete cascade,
  name text not null,
  description text,
  path text not null, -- computed path for hierarchy
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, parent_id, name)
);

-- Documents metadata
create table if not exists ged_document (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  folder_id uuid references ged_folder(id) on delete set null,
  name text not null,
  description text,
  file_path text not null, -- path in storage bucket
  file_size bigint not null default 0,
  mime_type text not null,
  version int not null default 1,
  is_current_version boolean not null default true,
  parent_document_id uuid references ged_document(id), -- for versions
  tags text[] default '{}',
  metadata jsonb default '{}',
  checksum text, -- for deduplication
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Document sharing and permissions
create table if not exists ged_document_share (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  document_id uuid not null references ged_document(id) on delete cascade,
  shared_with uuid references profiles(id) on delete cascade,
  permission text not null default 'read' check (permission in ('read', 'write', 'admin')),
  expires_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique(document_id, shared_with)
);

-- Enable RLS
alter table ged_folder enable row level security;
alter table ged_document enable row level security;
alter table ged_document_share enable row level security;

-- RLS Policies

-- Folders: organization members can manage
create policy "Users can manage org folders"
  on ged_folder
  for all
  to authenticated
  using (organization_id = get_organization_id())
  with check (organization_id = get_organization_id());

-- Documents: organization members + shared access
create policy "Users can manage org documents"
  on ged_document
  for all
  to authenticated
  using (
    organization_id = get_organization_id()
    or exists (
      select 1 from ged_document_share gds
      where gds.document_id = ged_document.id
      and gds.shared_with = auth.uid()
      and (gds.expires_at is null or gds.expires_at > now())
    )
  )
  with check (organization_id = get_organization_id());

-- Document shares: only document owners and admins
create policy "Document owners can manage shares"
  on ged_document_share
  for all
  to authenticated
  using (
    organization_id = get_organization_id()
    and (
      created_by = auth.uid()
      or exists (
        select 1 from ged_document gd
        where gd.id = document_id and gd.created_by = auth.uid()
      )
      or has_role('admin')
      or has_role('owner')
    )
  )
  with check (
    organization_id = get_organization_id()
    and (
      created_by = auth.uid()
      or exists (
        select 1 from ged_document gd
        where gd.id = document_id and gd.created_by = auth.uid()
      )
      or has_role('admin')
      or has_role('owner')
    )
  );

-- Indexes
create index if not exists idx_ged_folder_org_id on ged_folder(organization_id);
create index if not exists idx_ged_folder_parent on ged_folder(parent_id);
create index if not exists idx_ged_document_org_id on ged_document(organization_id);
create index if not exists idx_ged_document_folder on ged_document(folder_id);
create index if not exists idx_ged_document_tags on ged_document using gin(tags);
create index if not exists idx_ged_document_current on ged_document(is_current_version) where is_current_version = true;
create index if not exists idx_ged_document_share_doc on ged_document_share(document_id);
create index if not exists idx_ged_document_share_user on ged_document_share(shared_with);

-- Update timestamps
create trigger update_ged_folder_updated_at
  before update on ged_folder
  for each row execute function update_updated_at_column();

create trigger update_ged_document_updated_at
  before update on ged_document
  for each row execute function update_updated_at_column();

-- Function to update folder path
create or replace function update_folder_path()
returns trigger
language plpgsql
as $$
begin
  if new.parent_id is null then
    new.path := new.name;
  else
    select path || '/' || new.name into new.path
    from ged_folder where id = new.parent_id;
  end if;
  return new;
end;
$$;

create trigger update_folder_path_trigger
  before insert or update on ged_folder
  for each row execute function update_folder_path();

-- Function to ensure only one current version per document group
create or replace function ensure_single_current_version()
returns trigger
language plpgsql
as $$
begin
  if new.is_current_version then
    -- Set all other versions to false
    update ged_document 
    set is_current_version = false
    where (parent_document_id = new.parent_document_id or id = new.parent_document_id)
    and id != new.id;
  end if;
  return new;
end;
$$;

create trigger ensure_single_current_version_trigger
  before insert or update on ged_document
  for each row execute function ensure_single_current_version();