-- Fix overly permissive RLS policy on validation_errors table
-- The current policy allows anyone to insert validation errors with WITH CHECK (true)
-- This should be restricted to:
-- 1. Users who entered the result (analysts)
-- 2. Admins, Lab Supervisors, QA Officers (for review workflows)

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can create validation errors" ON public.validation_errors;

-- Create a more restrictive INSERT policy
-- Validation errors can be created by:
-- - The analyst who entered the result
-- - Admins, Lab Supervisors, and QA Officers (during review)
CREATE POLICY "Authorized users can create validation errors" 
ON public.validation_errors 
FOR INSERT 
WITH CHECK (
  (result_id IN (
    SELECT id FROM public.results WHERE entered_by = auth.uid()
  ))
  OR is_admin(auth.uid())
  OR is_lab_supervisor(auth.uid())
  OR is_qa_officer(auth.uid())
);