-- Drop existing permissive policies on samples table
DROP POLICY IF EXISTS "Authenticated users can view samples" ON public.samples;
DROP POLICY IF EXISTS "Authenticated users can create samples" ON public.samples;
DROP POLICY IF EXISTS "Authenticated users can update samples" ON public.samples;

-- Create role-scoped SELECT policy
-- Admins and supervisors can see all samples
-- Analysts can only see samples where they have entered results
CREATE POLICY "Users can view samples for their work" 
ON public.samples 
FOR SELECT 
USING (
  is_admin(auth.uid()) 
  OR is_lab_supervisor(auth.uid())
  OR id IN (
    SELECT DISTINCT r.sample_id 
    FROM results r 
    WHERE r.entered_by = auth.uid()
  )
);

-- Create role-scoped INSERT policy
-- Only admins and supervisors can create samples
CREATE POLICY "Admins and supervisors can create samples" 
ON public.samples 
FOR INSERT 
WITH CHECK (
  is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())
);

-- Create role-scoped UPDATE policy
-- Only admins and supervisors can update samples
CREATE POLICY "Admins and supervisors can update samples" 
ON public.samples 
FOR UPDATE 
USING (
  is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())
);