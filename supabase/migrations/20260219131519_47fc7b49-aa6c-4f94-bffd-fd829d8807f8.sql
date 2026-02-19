-- Fix: Make department slug unique per organization, not globally
ALTER TABLE public.departments DROP CONSTRAINT departments_slug_key;
ALTER TABLE public.departments ADD CONSTRAINT departments_org_slug_unique UNIQUE (organization_id, slug);
