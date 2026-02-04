-- Fix 1: compliance_documents - Change SELECT policy to require authentication and restrict to admins/supervisors only
DROP POLICY IF EXISTS "Authenticated users can view compliance documents" ON public.compliance_documents;
CREATE POLICY "Authenticated users can view compliance documents" 
ON public.compliance_documents 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())));

-- Fix 2: lab_settings - Require authentication for viewing
DROP POLICY IF EXISTS "Authenticated users can view lab settings" ON public.lab_settings;
CREATE POLICY "Authenticated users can view lab settings" 
ON public.lab_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 3: profiles - Add explicit auth check as first condition
DROP POLICY IF EXISTS "Admins and supervisors can view all profiles" ON public.profiles;
CREATE POLICY "Admins and supervisors can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid()) OR (id = auth.uid())));

-- Fix 4: clients - Reinforce auth check (ensuring explicit NULL check)
DROP POLICY IF EXISTS "Admins and supervisors can view clients" ON public.clients;
CREATE POLICY "Admins and supervisors can view clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())));