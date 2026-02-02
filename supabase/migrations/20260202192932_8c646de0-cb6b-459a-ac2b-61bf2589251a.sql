-- Fix warn-level security issues by adding explicit auth.uid() IS NOT NULL checks

-- =====================================================
-- FIX 1: clients table - Add explicit authentication check
-- =====================================================
DROP POLICY IF EXISTS "Admins and supervisors can view clients" ON public.clients;
DROP POLICY IF EXISTS "Admins and supervisors can create clients" ON public.clients;
DROP POLICY IF EXISTS "Admins and supervisors can update clients" ON public.clients;

-- Recreate with explicit auth check
CREATE POLICY "Admins and supervisors can view clients" 
ON public.clients 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid()))
);

CREATE POLICY "Admins and supervisors can create clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid()))
);

CREATE POLICY "Admins and supervisors can update clients" 
ON public.clients 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid()))
);

-- =====================================================
-- FIX 2: pending_invitations table - Add explicit authentication check
-- =====================================================
DROP POLICY IF EXISTS "Admins can view invitations" ON public.pending_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON public.pending_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.pending_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.pending_invitations;

-- Recreate with explicit auth check
CREATE POLICY "Admins can view invitations" 
ON public.pending_invitations 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  is_admin(auth.uid())
);

CREATE POLICY "Admins can create invitations" 
ON public.pending_invitations 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  is_admin(auth.uid())
);

CREATE POLICY "Admins can update invitations" 
ON public.pending_invitations 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  is_admin(auth.uid())
);

CREATE POLICY "Admins can delete invitations" 
ON public.pending_invitations 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  is_admin(auth.uid())
);