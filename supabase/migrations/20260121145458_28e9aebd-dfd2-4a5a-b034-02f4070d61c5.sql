-- Drop overly permissive policies on clients table
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;

-- Create project-based SELECT policy
-- Users can only see clients associated with projects they work on (through samples/results)
-- Admins and Lab Supervisors can see all clients
CREATE POLICY "Users can view clients for their projects" ON public.clients
  FOR SELECT USING (
    is_admin(auth.uid()) 
    OR is_lab_supervisor(auth.uid())
    OR id IN (
      SELECT DISTINCT p.client_id FROM projects p
      JOIN samples s ON s.project_id = p.id
      JOIN results r ON r.sample_id = s.id
      WHERE r.entered_by = auth.uid()
    )
  );

-- Only admins and lab supervisors can create clients
CREATE POLICY "Admins and supervisors can create clients" ON public.clients
  FOR INSERT WITH CHECK (
    is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())
  );

-- Only admins and lab supervisors can update clients
CREATE POLICY "Admins and supervisors can update clients" ON public.clients
  FOR UPDATE USING (
    is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())
  );