/*
  # Recruitment Module Schema
  
  1. New Tables
    - `recruitment_candidate` - Job candidates with scoring and status tracking
    - `recruitment_job` - Job postings management
    - `recruitment_application` - Link between candidates and jobs
    
  2. Security
    - Enable RLS with organization-based policies
    - File upload integration with Supabase Storage
    
  3. Features
    - Automatic scoring system
    - Status workflow (pending → interview → hired/rejected)
    - CV file management
*/

-- Candidates table
create table if not exists recruitment_candidate (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  cv_url text,
  linkedin_url text,
  status text not null default 'pending' check (status in ('pending', 'interview', 'hired', 'rejected')),
  score int default 0 check (score >= 0 and score <= 100),
  notes text,
  tags text[] default '{}',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Job postings
create table if not exists recruitment_job (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  requirements text,
  location text,
  salary_min int,
  salary_max int,
  status text not null default 'open' check (status in ('draft', 'open', 'closed')),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Applications (link candidates to jobs)
create table if not exists recruitment_application (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  candidate_id uuid not null references recruitment_candidate(id) on delete cascade,
  job_id uuid not null references recruitment_job(id) on delete cascade,
  status text not null default 'applied' check (status in ('applied', 'reviewing', 'interview', 'offer', 'hired', 'rejected')),
  applied_at timestamptz default now(),
  notes text,
  unique(candidate_id, job_id)
);

-- Enable RLS
alter table recruitment_candidate enable row level security;
alter table recruitment_job enable row level security;
alter table recruitment_application enable row level security;

-- RLS Policies
create policy "Users can manage org candidates"
  on recruitment_candidate
  for all
  to authenticated
  using (organization_id = get_organization_id())
  with check (organization_id = get_organization_id());

create policy "Users can manage org jobs"
  on recruitment_job
  for all
  to authenticated
  using (organization_id = get_organization_id())
  with check (organization_id = get_organization_id());

create policy "Users can manage org applications"
  on recruitment_application
  for all
  to authenticated
  using (organization_id = get_organization_id())
  with check (organization_id = get_organization_id());

-- Indexes
create index if not exists idx_recruitment_candidate_org_id on recruitment_candidate(organization_id);
create index if not exists idx_recruitment_candidate_status on recruitment_candidate(status);
create index if not exists idx_recruitment_candidate_email on recruitment_candidate(email);
create index if not exists idx_recruitment_job_org_id on recruitment_job(organization_id);
create index if not exists idx_recruitment_job_status on recruitment_job(status);
create index if not exists idx_recruitment_application_org_id on recruitment_application(organization_id);
create index if not exists idx_recruitment_application_candidate on recruitment_application(candidate_id);
create index if not exists idx_recruitment_application_job on recruitment_application(job_id);

-- Update timestamps
create trigger update_recruitment_candidate_updated_at
  before update on recruitment_candidate
  for each row execute function update_updated_at_column();

create trigger update_recruitment_job_updated_at
  before update on recruitment_job
  for each row execute function update_updated_at_column();

-- Auto-scoring function (simple example)
create or replace function calculate_candidate_score(candidate_id uuid)
returns int
language plpgsql
security definer
as $$
declare
  score int := 0;
  candidate recruitment_candidate%rowtype;
begin
  select * into candidate from recruitment_candidate where id = candidate_id;
  
  -- Base score
  score := 20;
  
  -- Has CV file
  if candidate.cv_url is not null then
    score := score + 25;
  end if;
  
  -- Has LinkedIn
  if candidate.linkedin_url is not null then
    score := score + 15;
  end if;
  
  -- Has phone
  if candidate.phone is not null then
    score := score + 10;
  end if;
  
  -- Email domain scoring (simple example)
  if candidate.email like '%@gmail.com' then
    score := score + 5;
  elsif candidate.email like '%@linkedin.com' or candidate.email like '%@microsoft.com' then
    score := score + 20;
  end if;
  
  -- Has tags (skills, experience)
  score := score + (array_length(candidate.tags, 1) * 2);
  
  return least(score, 100);
end;
$$;

-- Trigger to auto-calculate score on insert/update
create or replace function trigger_calculate_score()
returns trigger
language plpgsql
as $$
begin
  new.score := calculate_candidate_score(new.id);
  return new;
end;
$$;

create trigger auto_calculate_candidate_score
  before insert or update on recruitment_candidate
  for each row execute function trigger_calculate_score();