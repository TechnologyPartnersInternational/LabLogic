-- Allow admins to delete results
CREATE POLICY "Admins can delete results"
ON public.results
FOR DELETE
USING (is_admin(auth.uid()));

-- Allow admins to delete samples
CREATE POLICY "Admins can delete samples"
ON public.samples
FOR DELETE
USING (is_admin(auth.uid()));

-- Allow admins to delete validation errors
CREATE POLICY "Admins can delete validation errors"
ON public.validation_errors
FOR DELETE
USING (is_admin(auth.uid()));