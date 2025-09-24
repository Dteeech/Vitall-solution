/*
  # Inventory Module Schema
  
  1. New Tables
    - `inventory_location` - Storage locations/warehouses
    - `inventory_item` - Items with SKU and stock management
    - `inventory_movement` - Stock movements (in/out/transfer)
    - `inventory_adjustment` - Stock adjustments and reasons
    
  2. Security
    - RLS with organization isolation
    - Track all stock movements for audit
    
  3. Features
    - Multi-location inventory
    - Low stock alerts
    - Movement tracking
    - Stock adjustments with reasons
*/

-- Storage locations
create table if not exists inventory_location (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text,
  description text,
  address text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, code)
);

-- Inventory items
create table if not exists inventory_item (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  sku text not null,
  name text not null,
  description text,
  category text,
  unit text default 'ea',
  unit_cost numeric(10,2),
  selling_price numeric(10,2),
  current_stock int not null default 0,
  reserved_stock int not null default 0,
  available_stock int generated always as (current_stock - reserved_stock) stored,
  reorder_point int default 0,
  max_stock int,
  is_active boolean default true,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, sku)
);

-- Stock movements
create table if not exists inventory_movement (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  item_id uuid not null references inventory_item(id) on delete cascade,
  location_id uuid references inventory_location(id),
  movement_type text not null check (movement_type in ('in', 'out', 'transfer', 'adjustment')),
  quantity int not null,
  unit_cost numeric(10,2),
  reference_type text, -- 'purchase', 'sale', 'transfer', 'adjustment'
  reference_id text, -- ID of the related document
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Stock adjustments
create table if not exists inventory_adjustment (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  item_id uuid not null references inventory_item(id) on delete cascade,
  location_id uuid references inventory_location(id),
  old_quantity int not null,
  new_quantity int not null,
  adjustment_quantity int generated always as (new_quantity - old_quantity) stored,
  reason text not null,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Enable RLS
alter table inventory_location enable row level security;
alter table inventory_item enable row level security;
alter table inventory_movement enable row level security;
alter table inventory_adjustment enable row level security;

-- RLS Policies
create policy "Users can manage org locations"
  on inventory_location
  for all
  to authenticated
  using (organization_id = get_organization_id())
  with check (organization_id = get_organization_id());

create policy "Users can manage org items"
  on inventory_item
  for all
  to authenticated
  using (organization_id = get_organization_id())
  with check (organization_id = get_organization_id());

create policy "Users can view org movements"
  on inventory_movement
  for select
  to authenticated
  using (organization_id = get_organization_id());

create policy "Users can create movements"
  on inventory_movement
  for insert
  to authenticated
  with check (organization_id = get_organization_id());

create policy "Users can manage org adjustments"
  on inventory_adjustment
  for all
  to authenticated
  using (organization_id = get_organization_id())
  with check (organization_id = get_organization_id());

-- Indexes
create index if not exists idx_inventory_location_org_id on inventory_location(organization_id);
create index if not exists idx_inventory_item_org_id on inventory_item(organization_id);
create index if not exists idx_inventory_item_sku on inventory_item(sku);
create index if not exists idx_inventory_item_category on inventory_item(category);
create index if not exists idx_inventory_item_low_stock on inventory_item(organization_id, current_stock, reorder_point) 
  where current_stock <= reorder_point;
create index if not exists idx_inventory_movement_org_id on inventory_movement(organization_id);
create index if not exists idx_inventory_movement_item on inventory_movement(item_id);
create index if not exists idx_inventory_movement_created_at on inventory_movement(created_at desc);
create index if not exists idx_inventory_adjustment_org_id on inventory_adjustment(organization_id);
create index if not exists idx_inventory_adjustment_item on inventory_adjustment(item_id);

-- Update timestamps
create trigger update_inventory_location_updated_at
  before update on inventory_location
  for each row execute function update_updated_at_column();

create trigger update_inventory_item_updated_at
  before update on inventory_item
  for each row execute function update_updated_at_column();

-- Function to update stock on movement
create or replace function update_stock_on_movement()
returns trigger
language plpgsql
security definer
as $$
begin
  case new.movement_type
    when 'in' then
      update inventory_item 
      set current_stock = current_stock + new.quantity
      where id = new.item_id;
    when 'out' then
      update inventory_item 
      set current_stock = current_stock - new.quantity
      where id = new.item_id;
    when 'adjustment' then
      -- For adjustments, the quantity is the delta
      update inventory_item 
      set current_stock = current_stock + new.quantity
      where id = new.item_id;
  end case;
  
  return new;
end;
$$;

create trigger update_stock_trigger
  after insert on inventory_movement
  for each row execute function update_stock_on_movement();

-- Function to create movement on adjustment
create or replace function create_movement_on_adjustment()
returns trigger
language plpgsql
as $$
begin
  insert into inventory_movement (
    organization_id, item_id, location_id, movement_type, quantity,
    reference_type, reference_id, notes, created_by
  ) values (
    new.organization_id, new.item_id, new.location_id, 'adjustment', 
    new.adjustment_quantity, 'adjustment', new.id::text, 
    new.reason, new.created_by
  );
  
  return new;
end;
$$;

create trigger create_movement_on_adjustment_trigger
  after insert on inventory_adjustment
  for each row execute function create_movement_on_adjustment();

-- View for low stock items
create or replace view inventory_low_stock as
select 
  ii.*,
  il.name as location_name
from inventory_item ii
left join inventory_location il on true -- items without specific location
where ii.current_stock <= ii.reorder_point
and ii.is_active = true
order by ii.current_stock asc;

-- View for stock valuation
create or replace view inventory_valuation as
select 
  ii.organization_id,
  ii.id,
  ii.sku,
  ii.name,
  ii.current_stock,
  ii.unit_cost,
  (ii.current_stock * coalesce(ii.unit_cost, 0)) as stock_value
from inventory_item ii
where ii.is_active = true;