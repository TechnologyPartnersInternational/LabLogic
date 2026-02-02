-- Drop and recreate the profiles SELECT policies to properly restrict access
-- Admins and Lab Supervisors need to view all profiles for user management workflows
-- Regular users (analysts, QA officers) can only view their own profile

-- First drop the existing policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate with more descriptive name and include lab supervisors for workflow management
CREATE POLICY "Admins and supervisors can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  is_admin(auth.uid()) OR 
  is_lab_supervisor(auth.uid()) OR 
  (id = auth.uid())
);

-- Note: The "Users can view own profile" policy already exists and handles the self-view case
-- but we've combined it into the above policy for clarity

-- Drop the redundant user policy since it's now combined
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;