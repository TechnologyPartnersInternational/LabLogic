-- Add unique constraint to prevent duplicate role+section combinations per user
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_unique_role_section 
UNIQUE (user_id, role, lab_section);