-- Drop the overly permissive policy
DROP POLICY "Anyone can check invitation by token" ON public.pending_invitations;

-- Create a more secure function to check invitation by token (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE(
  id uuid,
  email text,
  roles jsonb,
  expires_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, roles, expires_at
  FROM public.pending_invitations
  WHERE token = _token 
    AND expires_at > now() 
    AND accepted_at IS NULL
$$;

-- Create a function to mark invitation as accepted (bypasses RLS)
CREATE OR REPLACE FUNCTION public.accept_invitation(_token text, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
  role_item JSONB;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record
  FROM public.pending_invitations
  WHERE token = _token 
    AND expires_at > now() 
    AND accepted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Mark invitation as accepted
  UPDATE public.pending_invitations
  SET accepted_at = now()
  WHERE id = invitation_record.id;
  
  -- Assign roles from the invitation
  FOR role_item IN SELECT * FROM jsonb_array_elements(invitation_record.roles)
  LOOP
    INSERT INTO public.user_roles (user_id, role, lab_section, assigned_by)
    VALUES (
      _user_id,
      (role_item->>'role')::lab_role,
      CASE WHEN role_item->>'lab_section' IS NOT NULL 
        THEN (role_item->>'lab_section')::lab_section 
        ELSE NULL 
      END,
      invitation_record.invited_by
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN true;
END;
$$;