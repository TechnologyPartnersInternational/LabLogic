
-- ============================================
-- Phase 1: Create departments table + seed + migrate
-- ============================================

-- 1a. Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'beaker',
  analyte_groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active departments"
ON public.departments FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert departments"
ON public.departments FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update departments"
ON public.departments FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete departments"
ON public.departments FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- 1b. Seed existing lab sections as departments (fixed UUIDs for data migration)
INSERT INTO public.departments (id, name, slug, icon, analyte_groups, sort_order) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Wet Chemistry', 'wet-chemistry', 'beaker', '[{"key":"physico_chemical","label":"Physico-Chemical"},{"key":"cations_anions","label":"Ions"}]'::jsonb, 1),
  ('d0000002-0000-0000-0000-000000000002', 'Instrumentation', 'instrumentation', 'activity', '[{"key":"heavy_metals","label":"Heavy Metals"},{"key":"hydrocarbons","label":"Hydrocarbons"}]'::jsonb, 2),
  ('d0000003-0000-0000-0000-000000000003', 'Microbiology', 'microbiology', 'microscope', '[{"key":"microbiology","label":"Microbiology"}]'::jsonb, 3);

-- 1c. Add department_id FK to parameters, test_packages, user_roles
ALTER TABLE public.parameters ADD COLUMN department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.test_packages ADD COLUMN department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.user_roles ADD COLUMN department_id UUID REFERENCES public.departments(id);

-- Migrate existing data based on lab_section enum values
UPDATE public.parameters SET department_id = 'd0000001-0000-0000-0000-000000000001' WHERE lab_section = 'wet_chemistry';
UPDATE public.parameters SET department_id = 'd0000002-0000-0000-0000-000000000002' WHERE lab_section = 'instrumentation';
UPDATE public.parameters SET department_id = 'd0000003-0000-0000-0000-000000000003' WHERE lab_section = 'microbiology';

UPDATE public.test_packages SET department_id = 'd0000001-0000-0000-0000-000000000001' WHERE lab_section = 'wet_chemistry';
UPDATE public.test_packages SET department_id = 'd0000002-0000-0000-0000-000000000002' WHERE lab_section = 'instrumentation';
UPDATE public.test_packages SET department_id = 'd0000003-0000-0000-0000-000000000003' WHERE lab_section = 'microbiology';

UPDATE public.user_roles SET department_id = 'd0000001-0000-0000-0000-000000000001' WHERE lab_section = 'wet_chemistry';
UPDATE public.user_roles SET department_id = 'd0000002-0000-0000-0000-000000000002' WHERE lab_section = 'instrumentation';
UPDATE public.user_roles SET department_id = 'd0000003-0000-0000-0000-000000000003' WHERE lab_section = 'microbiology';

-- 1d. Keep lab_section columns for now (nullable, deprecated) -- will drop in Phase 7 cleanup
-- Don't modify the lab_role enum in a transaction; instead handle at app level:
-- Any role with a department_id is treated as an analyst for that department.

-- 1e. Create new database functions for department-based access

CREATE OR REPLACE FUNCTION public.is_analyst_for_department(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND department_id = _department_id
    AND role IN ('wet_chemistry_analyst', 'instrumentation_analyst', 'microbiology_analyst', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_departments(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT department_id FROM public.user_roles
  WHERE user_id = _user_id AND department_id IS NOT NULL
$$;

-- Also create a function to check if user is analyst for any department (for generic checks)
CREATE OR REPLACE FUNCTION public.is_analyst(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('wet_chemistry_analyst', 'instrumentation_analyst', 'microbiology_analyst')
  )
$$;

-- Add unique constraint for department-based role assignment
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_unique_department 
  UNIQUE (user_id, role, department_id);
