-- Fix Security Issue 1: profiles_table_public_exposure
-- Users should only be able to view their own profile
-- Create a separate admin-only policy for managing users if needed

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Create separate policy for admins to view all profiles when managing users
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin(auth.uid()));


-- Fix Security Issue 2: clients_table_contact_exposure
-- Only admins and lab supervisors should access client contact information

DROP POLICY IF EXISTS "Users can view clients for their projects" ON public.clients;

CREATE POLICY "Admins and supervisors can view clients"
ON public.clients
FOR SELECT
USING (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid()));