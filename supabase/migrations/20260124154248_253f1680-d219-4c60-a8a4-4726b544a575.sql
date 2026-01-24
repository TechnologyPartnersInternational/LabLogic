-- Create pending_invitations table to store invitations with pre-assigned roles
CREATE TABLE public.pending_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster token lookups
CREATE INDEX idx_pending_invitations_token ON public.pending_invitations(token);
CREATE INDEX idx_pending_invitations_email ON public.pending_invitations(email);

-- Enable RLS
ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view all invitations
CREATE POLICY "Admins can view invitations"
ON public.pending_invitations
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
ON public.pending_invitations
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Admins can update invitations
CREATE POLICY "Admins can update invitations"
ON public.pending_invitations
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admins can delete invitations
CREATE POLICY "Admins can delete invitations"
ON public.pending_invitations
FOR DELETE
USING (is_admin(auth.uid()));

-- Allow public access to check valid tokens (for signup flow)
CREATE POLICY "Anyone can check invitation by token"
ON public.pending_invitations
FOR SELECT
USING (token IS NOT NULL AND expires_at > now() AND accepted_at IS NULL);