-- Fix security issues with overly permissive RLS policies

-- 1. FIX AUDIT_LOGS: Restrict access to admins only (currently all authenticated users can view)
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (is_admin(auth.uid()));

-- 2. FIX RESULTS: Restrict SELECT to authorized users only (matching samples table pattern)
-- Currently all authenticated users can view all results
DROP POLICY IF EXISTS "Authenticated users can view results" ON public.results;

CREATE POLICY "Users can view results for their work" 
ON public.results 
FOR SELECT 
USING (
  is_admin(auth.uid()) 
  OR is_lab_supervisor(auth.uid()) 
  OR is_qa_officer(auth.uid())
  OR entered_by = auth.uid()
  OR sample_id IN (
    SELECT id FROM public.samples 
    WHERE id IN (
      SELECT DISTINCT r.sample_id 
      FROM public.results r 
      WHERE r.entered_by = auth.uid()
    )
  )
);

-- Note on PROFILES table: Current policies are appropriate
-- - Users can only view their own profile (id = auth.uid())
-- - Admins can view all profiles (needed for user management)
-- The finding overstates the risk since regular users CANNOT see other profiles

-- Note on CLIENTS table: Current policies are appropriate for business needs
-- - Only admins and lab supervisors can view clients (role-restricted)
-- - This is the minimum access required for project management workflows