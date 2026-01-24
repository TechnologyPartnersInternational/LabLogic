-- Drop overly permissive policy on validation_errors table
DROP POLICY IF EXISTS "Authenticated users can manage validation errors" ON public.validation_errors;

-- Users can view validation errors for results they entered or have supervisor access
CREATE POLICY "Users can view validation errors for their results" 
ON public.validation_errors 
FOR SELECT 
USING (
  result_id IN (
    SELECT id FROM public.results 
    WHERE entered_by = auth.uid()
  )
  OR is_admin(auth.uid()) 
  OR is_lab_supervisor(auth.uid())
  OR is_qa_officer(auth.uid())
);

-- System/triggers can create validation errors (keep permissive for automated creation)
CREATE POLICY "System can create validation errors" 
ON public.validation_errors 
FOR INSERT 
WITH CHECK (true);

-- Only result owner and supervisors can resolve/update validation errors
CREATE POLICY "Users can update validation errors for their results" 
ON public.validation_errors 
FOR UPDATE 
USING (
  result_id IN (
    SELECT id FROM public.results 
    WHERE entered_by = auth.uid()
  )
  OR is_admin(auth.uid()) 
  OR is_lab_supervisor(auth.uid())
  OR is_qa_officer(auth.uid())
);