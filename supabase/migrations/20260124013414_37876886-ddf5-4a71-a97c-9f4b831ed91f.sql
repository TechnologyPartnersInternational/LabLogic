-- Drop the overly permissive insert policy on audit_logs
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Block all direct user inserts - triggers use SECURITY DEFINER to bypass RLS
CREATE POLICY "Block direct audit log inserts" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (false);