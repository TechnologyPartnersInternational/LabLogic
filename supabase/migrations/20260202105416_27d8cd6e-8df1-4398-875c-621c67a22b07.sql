-- Fix infinite recursion in results RLS policy
-- The current policy references the results table in a subquery, causing infinite recursion

-- Drop the problematic SELECT policy
DROP POLICY IF EXISTS "Users can view results for their work" ON public.results;

-- Create a simpler, non-recursive SELECT policy
-- Users can view results if:
-- 1. They are an admin, lab supervisor, or QA officer
-- 2. They entered the result themselves
CREATE POLICY "Users can view results for their work" 
ON public.results 
FOR SELECT 
USING (
  is_admin(auth.uid()) 
  OR is_lab_supervisor(auth.uid()) 
  OR is_qa_officer(auth.uid())
  OR entered_by = auth.uid()
);