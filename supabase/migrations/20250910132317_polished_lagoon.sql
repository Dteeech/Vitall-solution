/*
  # Timesheets Module Schema
  
  1. New Tables
    - `timesheet_project` - Projects for time tracking
    - `timesheet_entry` - Individual time entries
    - `timesheet_approval` - Approval workflow
    
  2. Security
    - RLS with organization isolation
    - User can only see/edit their own entries (unless admin)
    
  3. Features
    - Project-based time tracking
    - Weekly/monthly reporting
    - Approval workflow
    - Overtime calculation
*/

-- Projects for time tracking
create table if not exists timesheet_project (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  code text, -- project code for easy reference
  hourly_rate numeric(10,2),
  budget_hours numeric(10,2),
  is_active boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Time entries
create table if not exists timesheet_entry (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  project_id uuid references timesheet_project(id) on delete set null,
  date date not null,
  start_time time,
  end_time time,
  hours numeric(5,2) not null check (hours > 0),
  description text,
  status text default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  is_billable boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date, project_id, start_time) -- prevent duplicate entries
);

-- Approval workflow
create table if not exists timesheet_approval (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  entry_id uuid not null references timesheet_entry(id) on delete cascade,
  approver_id uuid not null references profiles(id),
  status text not null check (status in ('pending', 'approved', 'rejected')),
  comments text,
  approved_at timestamptz,
  created_at timestamptz default now(),
  unique(entry_id) -- one approval per entry
);

-- Enable RLS
alter table timesheet_project enable row level security;
alter table timesheet_entry enable row level security;
alter table timesheet_approval enable row level security;

-- RLS Policies

-- Projects: organization members can view, admins can manage
create policy "Users can view org projects"
  on timesheet_project
  for select
  to authenticated
  using (organization_id = get_organization_id());

create policy "Admins can manage projects"
  on timesheet_project
  for all
  to authenticated
  using (organization_id = get_organization_id() and (has_role('admin') or has_role('owner')))
  with check (organization_id = get_organization_id() and (has_role('admin') or has_role('owner')));

-- Entries: users can manage own entries, admins can see all
create policy "Users can manage own entries"
  on timesheet_entry
  for all
  to authenticated
  using (
    organization_id = get_organization_id() 
    and (user_id = auth.uid() or has_role('admin') or has_role('owner'))
  )
  with check (
    organization_id = get_organization_id() 
    and (user_id = auth.uid() or has_role('admin') or has_role('owner'))
  );

-- Approvals: admins can manage
create policy "Admins can manage approvals"
  on timesheet_approval
  for all
  to authenticated
  using (organization_id = get_organization_id() and (has_role('admin') or has_role('owner')))
  with check (organization_id = get_organization_id() and (has_role('admin') or has_role('owner')));

-- Indexes
create index if not exists idx_timesheet_project_org_id on timesheet_project(organization_id);
create index if not exists idx_timesheet_project_active on timesheet_project(is_active) where is_active = true;
create index if not exists idx_timesheet_entry_org_id on timesheet_entry(organization_id);
create index if not exists idx_timesheet_entry_user on timesheet_entry(user_id);
create index if not exists idx_timesheet_entry_date on timesheet_entry(date);
create index if not exists idx_timesheet_entry_project on timesheet_entry(project_id);
create index if not exists idx_timesheet_entry_status on timesheet_entry(status);
create index if not exists idx_timesheet_approval_entry on timesheet_approval(entry_id);

-- Update timestamps
create trigger update_timesheet_project_updated_at
  before update on timesheet_project
  for each row execute function update_updated_at_column();

create trigger update_timesheet_entry_updated_at
  before update on timesheet_entry
  for each row execute function update_updated_at_column();

-- Function to calculate hours from start/end time
create or replace function calculate_entry_hours()
returns trigger
language plpgsql
as $$
begin
  if new.start_time is not null and new.end_time is not null then
    new.hours := extract(epoch from (new.end_time - new.start_time)) / 3600;
  end if;
  return new;
end;
$$;

create trigger calculate_entry_hours_trigger
  before insert or update on timesheet_entry
  for each row execute function calculate_entry_hours();

-- Function to create approval record when entry is submitted
create or replace function create_approval_on_submit()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'submitted' and old.status != 'submitted' then
    insert into timesheet_approval (organization_id, entry_id, approver_id, status)
    values (new.organization_id, new.id, 
      (select id from profiles where organization_id = new.organization_id and role in ('admin', 'owner') limit 1),
      'pending'
    );
  end if;
  return new;
end;
$$;

create trigger create_approval_trigger
  after update on timesheet_entry
  for each row execute function create_approval_on_submit();

-- View for weekly summaries
create or replace view timesheet_weekly_summary as
select 
  te.organization_id,
  te.user_id,
  p.full_name as user_name,
  date_trunc('week', te.date) as week_start,
  tp.name as project_name,
  sum(te.hours) as total_hours,
  sum(case when te.is_billable then te.hours else 0 end) as billable_hours,
  count(*) as entry_count
from timesheet_entry te
join profiles p on te.user_id = p.id
left join timesheet_project tp on te.project_id = tp.id
group by te.organization_id, te.user_id, p.full_name, date_trunc('week', te.date), tp.name;