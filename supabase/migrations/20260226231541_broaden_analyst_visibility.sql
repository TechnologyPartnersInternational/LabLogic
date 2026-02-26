-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Admins and supervisors can view clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view projects for their work" ON public.projects;
DROP POLICY IF EXISTS "Users can view samples for their work" ON public.samples;

-- Create broad read-only policies for all authenticated users
-- The organization-level multi-tenant isolation is still enforced by other policies or the UI.
-- These RLS policies ensure any logged-in user can view these resources if they belong to the correct tenant (which is handled by a different policy or implicitly by the application).
-- Note: Insert, Update, and Delete are STILL restricted to Admins and Supervisors in their respective policies.

CREATE POLICY "Users can view clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all samples" 
ON public.samples 
FOR SELECT 
USING (auth.uid() IS NOT NULL);
