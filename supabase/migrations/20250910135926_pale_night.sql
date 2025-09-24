/*
  # Accounting Module Schema
  
  1. New Tables
    - `accounting_customer` - Customer/client management
    - `accounting_invoice` - Invoice management
    - `accounting_invoice_item` - Invoice line items
    - `accounting_payment` - Payment tracking
    
  2. Security
    - RLS with organization isolation
    - Financial data protection
    
  3. Features
    - Invoice generation and management
    - Payment tracking
    - Customer management
    - Basic financial reporting
*/

-- Customers/Clients
create table if not exists accounting_customer (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  tax_number text,
  payment_terms int default 30, -- days
  is_active boolean default true,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Invoices
create table if not exists accounting_invoice (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid references accounting_customer(id),
  invoice_number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date date not null default current_date,
  due_date date not null,
  subtotal_cents bigint not null default 0,
  tax_cents bigint not null default 0,
  total_cents bigint not null default 0,
  paid_amount_cents bigint not null default 0,
  balance_cents bigint generated always as (total_cents - paid_amount_cents) stored,
  currency text not null default 'EUR',
  notes text,
  terms text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, invoice_number)
);

-- Invoice line items
create table if not exists accounting_invoice_item (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invoice_id uuid not null references accounting_invoice(id) on delete cascade,
  description text not null,
  quantity numeric(10,3) not null default 1,
  unit_price_cents bigint not null,
  line_total_cents bigint generated always as (quantity::bigint * unit_price_cents) stored,
  tax_rate numeric(5,2) default 0, -- percentage
  tax_cents bigint generated always as (line_total_cents * tax_rate / 100) stored,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- Payments
create table if not exists accounting_payment (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invoice_id uuid not null references accounting_invoice(id) on delete cascade,
  amount_cents bigint not null,
  payment_date date not null default current_date,
  payment_method text, -- 'bank_transfer', 'credit_card', 'cash', 'check'
  reference text, -- transaction reference
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Enable RLS
alter table accounting_customer enable row level security;
alter table accounting_invoice enable row level security;
alter table accounting_invoice_item enable row level security;
alter table accounting_payment enable row level security;

-- RLS Policies
create policy "Users can manage org customers"
  on accounting_customer
  for all
  to authenticated
  using (organization_id = get_organization_id())
  with check (organization_id = get_organization_id());

create policy "Users can manage org invoices"
  on accounting_invoice
  for all
  to authenticated
  using (organization_id = get_organization_id())
  with check (organization_id = get_organization_id());

create policy "Users can manage org invoice items"
  on accounting_invoice_item
  for all
  to authenticated
  using (organization_id = get_organization_id())
  with check (organization_id = get_organization_id());

create policy "Users can manage org payments"
  on accounting_payment
  for all
  to authenticated
  using (organization_id = get_organization_id())
  with check (organization_id = get_organization_id());

-- Indexes
create index if not exists idx_accounting_customer_org_id on accounting_customer(organization_id);
create index if not exists idx_accounting_customer_email on accounting_customer(email);
create index if not exists idx_accounting_invoice_org_id on accounting_invoice(organization_id);
create index if not exists idx_accounting_invoice_customer on accounting_invoice(customer_id);
create index if not exists idx_accounting_invoice_status on accounting_invoice(status);
create index if not exists idx_accounting_invoice_due_date on accounting_invoice(due_date);
create index if not exists idx_accounting_invoice_item_invoice on accounting_invoice_item(invoice_id);
create index if not exists idx_accounting_payment_invoice on accounting_payment(invoice_id);

-- Update timestamps
create trigger update_accounting_customer_updated_at
  before update on accounting_customer
  for each row execute function update_updated_at_column();

create trigger update_accounting_invoice_updated_at
  before update on accounting_invoice
  for each row execute function update_updated_at_column();

-- Function to recalculate invoice totals
create or replace function recalculate_invoice_totals()
returns trigger
language plpgsql
security definer
as $$
declare
  invoice_id uuid;
  subtotal_cents bigint := 0;
  tax_cents bigint := 0;
begin
  -- Get invoice_id from the operation
  if TG_OP = 'DELETE' then
    invoice_id := old.invoice_id;
  else
    invoice_id := new.invoice_id;
  end if;
  
  -- Calculate totals
  select 
    coalesce(sum(line_total_cents), 0),
    coalesce(sum(tax_cents), 0)
  into subtotal_cents, tax_cents
  from accounting_invoice_item
  where invoice_id = recalculate_invoice_totals.invoice_id;
  
  -- Update invoice
  update accounting_invoice
  set 
    subtotal_cents = recalculate_invoice_totals.subtotal_cents,
    tax_cents = recalculate_invoice_totals.tax_cents,
    total_cents = recalculate_invoice_totals.subtotal_cents + recalculate_invoice_totals.tax_cents
  where id = recalculate_invoice_totals.invoice_id;
  
  return coalesce(new, old);
end;
$$;

create trigger recalculate_invoice_totals_trigger
  after insert or update or delete on accounting_invoice_item
  for each row execute function recalculate_invoice_totals();

-- Function to update paid amount on payment
create or replace function update_invoice_paid_amount()
returns trigger
language plpgsql
security definer
as $$
declare
  invoice_id uuid;
  total_paid bigint := 0;
begin
  if TG_OP = 'DELETE' then
    invoice_id := old.invoice_id;
  else
    invoice_id := new.invoice_id;
  end if;
  
  select coalesce(sum(amount_cents), 0)
  into total_paid
  from accounting_payment
  where invoice_id = update_invoice_paid_amount.invoice_id;
  
  update accounting_invoice
  set paid_amount_cents = total_paid
  where id = update_invoice_paid_amount.invoice_id;
  
  return coalesce(new, old);
end;
$$;

create trigger update_invoice_paid_amount_trigger
  after insert or update or delete on accounting_payment
  for each row execute function update_invoice_paid_amount();

-- Function to auto-update invoice status
create or replace function update_invoice_status()
returns trigger
language plpgsql
as $$
begin
  -- Auto-update status based on payment
  if new.balance_cents = 0 and new.total_cents > 0 then
    new.status := 'paid';
  elsif new.balance_cents < new.total_cents and new.paid_amount_cents > 0 then
    -- Partially paid, keep existing status unless it's draft
    if new.status = 'draft' then
      new.status := 'sent';
    end if;
  elsif new.due_date < current_date and new.balance_cents > 0 then
    new.status := 'overdue';
  end if;
  
  return new;
end;
$$;

create trigger update_invoice_status_trigger
  before update on accounting_invoice
  for each row execute function update_invoice_status();

-- View for invoice summary
create or replace view accounting_invoice_summary as
select 
  ai.organization_id,
  ai.id,
  ai.invoice_number,
  ai.status,
  ai.issue_date,
  ai.due_date,
  ac.name as customer_name,
  ai.total_cents,
  ai.paid_amount_cents,
  ai.balance_cents,
  ai.currency,
  case 
    when ai.due_date < current_date and ai.balance_cents > 0 then 'overdue'
    when ai.balance_cents = 0 then 'paid'
    else ai.status
  end as computed_status
from accounting_invoice ai
left join accounting_customer ac on ai.customer_id = ac.id;