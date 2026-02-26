
-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "View clients in org" ON public.clients;
DROP POLICY IF EXISTS "View projects in org" ON public.projects;
DROP POLICY IF EXISTS "View samples in org" ON public.samples;

-- Broad org-scoped read for clients (all authenticated users in same org)
CREATE POLICY "View clients in org"
ON public.clients
FOR SELECT
USING (organization_id = get_my_org_id());

-- Broad org-scoped read for projects
CREATE POLICY "View projects in org"
ON public.projects
FOR SELECT
USING (organization_id = get_my_org_id());

-- Broad org-scoped read for samples
CREATE POLICY "View samples in org"
ON public.samples
FOR SELECT
USING (organization_id = get_my_org_id());
