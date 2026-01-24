-- Drop existing permissive policies on projects table
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;

-- Create role-scoped SELECT policy
-- Admins and supervisors can see all projects
-- Analysts can only see projects where they have entered results
CREATE POLICY "Users can view projects for their work" 
ON public.projects 
FOR SELECT 
USING (
  is_admin(auth.uid()) 
  OR is_lab_supervisor(auth.uid())
  OR id IN (
    SELECT DISTINCT s.project_id FROM samples s
    JOIN results r ON r.sample_id = s.id
    WHERE r.entered_by = auth.uid()
  )
);

-- Create role-scoped INSERT policy
-- Only admins and supervisors can create projects
CREATE POLICY "Admins and supervisors can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (
  is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())
);

-- Create role-scoped UPDATE policy
-- Only admins and supervisors can update projects
CREATE POLICY "Admins and supervisors can update projects" 
ON public.projects 
FOR UPDATE 
USING (
  is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())
);