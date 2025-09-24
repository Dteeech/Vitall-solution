/*
  # Seed Data for Development and Demo
  
  This file contains initial data for:
  1. Core modules catalog
  2. Demo organization and users
  3. Sample data for each module
  
  Run this after the main schema migrations.
*/

-- Insert core modules
insert into core_module (name, title, description, icon, category, enabled_by_default) values
  ('recruitment', 'Recruitment', 'Manage job postings, candidates, and hiring process', 'Users', 'hr', true),
  ('ged', 'Document Management', 'Store, organize and share documents securely', 'FileText', 'productivity', true),
  ('timesheets', 'Time Tracking', 'Track time spent on projects and generate reports', 'Clock', 'productivity', false),
  ('inventory', 'Inventory Management', 'Manage stock, locations and movements', 'Package', 'operations', false),
  ('accounting', 'Accounting', 'Invoicing, payments and financial reporting', 'Calculator', 'finance', false)
on conflict (name) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  category = excluded.category;

-- Create demo organization
insert into organizations (id, name, slug, plan, settings) values
  ('550e8400-e29b-41d4-a716-446655440000', 'Acme Corp', 'acme-corp', 'pro', '{"theme": "light", "language": "en"}')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  plan = excluded.plan;

-- Note: In a real setup, profiles would be created via Supabase Auth triggers
-- This is just for demo purposes - you'll need to create the auth user first
-- and then update the user_metadata with organization_id

-- Enable modules for demo org
insert into core_organization_module (organization_id, module_name, enabled, config) values
  ('550e8400-e29b-41d4-a716-446655440000', 'recruitment', true, '{}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'ged', true, '{}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'timesheets', true, '{}')
on conflict (organization_id, module_name) do update set
  enabled = excluded.enabled;

-- Sample recruitment data
insert into recruitment_job (id, organization_id, title, description, location, status, created_by) values
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Senior Frontend Developer', 'Looking for an experienced React developer', 'Remote', 'open', null),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Product Manager', 'Lead our product development efforts', 'Paris, France', 'open', null)
on conflict (id) do nothing;

insert into recruitment_candidate (id, organization_id, name, email, status, score, tags) values
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Alice Johnson', 'alice@example.com', 'interview', 85, '{"javascript", "react", "typescript"}'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Bob Smith', 'bob@example.com', 'pending', 72, '{"product management", "agile", "scrum"}'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Carol Davis', 'carol@example.com', 'hired', 92, '{"senior", "leadership", "react", "nodejs"}')
on conflict (id) do nothing;

-- Sample GED data
insert into ged_folder (id, organization_id, name, description, path) values
  ('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'HR Documents', 'Human Resources documentation', 'HR Documents'),
  ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Contracts', 'Legal contracts and agreements', 'Contracts'),
  ('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Policies', 'Company policies and procedures', 'Policies')
on conflict (id) do nothing;

-- Sample timesheet data
insert into timesheet_project (id, organization_id, name, description, code, hourly_rate, is_active) values
  ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Website Redesign', 'Company website overhaul project', 'WEB-001', 85.00, true),
  ('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Mobile App Development', 'New mobile application', 'MOB-001', 95.00, true),
  ('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Infrastructure Upgrade', 'Server and infrastructure improvements', 'INF-001', 120.00, true)
on conflict (id) do nothing;

-- Sample inventory data
insert into inventory_location (id, organization_id, name, code, description) values
  ('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Main Warehouse', 'WH-01', 'Primary storage location'),
  ('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Office Storage', 'OF-01', 'Office supplies and equipment')
on conflict (id) do nothing;

insert into inventory_item (id, organization_id, sku, name, description, category, current_stock, reorder_point, unit_cost) values
  ('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'LAPTOP-001', 'MacBook Pro 14"', 'Apple MacBook Pro 14-inch M2', 'Electronics', 5, 2, 2499.00),
  ('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'DESK-001', 'Standing Desk', 'Adjustable height desk', 'Furniture', 1, 5, 599.00),
  ('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'CHAIR-001', 'Ergonomic Chair', 'Herman Miller Aeron chair', 'Furniture', 8, 3, 1200.00)
on conflict (id) do nothing;

-- Sample accounting data
insert into accounting_customer (id, organization_id, name, email, payment_terms) values
  ('cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Tech Solutions Ltd', 'billing@techsolutions.com', 30),
  ('cc0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'StartupXYZ', 'accounts@startupxyz.com', 15),
  ('cc0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Enterprise Corp', 'finance@enterprise.com', 45)
on conflict (id) do nothing;

insert into accounting_invoice (id, organization_id, customer_id, invoice_number, status, issue_date, due_date, total_cents) values
  ('dd0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440001', 'INV-2024-001', 'sent', '2024-01-15', '2024-02-14', 500000),
  ('dd0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440002', 'INV-2024-002', 'paid', '2024-01-20', '2024-02-04', 250000),
  ('dd0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440003', 'INV-2024-003', 'draft', '2024-01-25', '2024-03-11', 750000)
on conflict (id) do nothing;

-- Sample invoice items
insert into accounting_invoice_item (organization_id, invoice_id, description, quantity, unit_price_cents, sort_order) values
  ('550e8400-e29b-41d4-a716-446655440000', 'dd0e8400-e29b-41d4-a716-446655440001', 'Website Development', 1, 300000, 1),
  ('550e8400-e29b-41d4-a716-446655440000', 'dd0e8400-e29b-41d4-a716-446655440001', 'SEO Optimization', 1, 150000, 2),
  ('550e8400-e29b-41d4-a716-446655440000', 'dd0e8400-e29b-41d4-a716-446655440001', 'Hosting Setup', 1, 50000, 3),
  ('550e8400-e29b-41d4-a716-446655440000', 'dd0e8400-e29b-41d4-a716-446655440002', 'Consulting Services', 10, 25000, 1),
  ('550e8400-e29b-41d4-a716-446655440000', 'dd0e8400-e29b-41d4-a716-446655440003', 'Mobile App Development', 1, 600000, 1),
  ('550e8400-e29b-41d4-a716-446655440000', 'dd0e8400-e29b-41d4-a716-446655440003', 'Testing & QA', 1, 150000, 2)
on conflict do nothing;