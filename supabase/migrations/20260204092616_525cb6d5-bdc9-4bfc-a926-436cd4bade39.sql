-- Add DELETE policy for projects (Admins only)
CREATE POLICY "Admins can delete projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND is_admin(auth.uid()));