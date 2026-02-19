
-- Drop function that needs return type change FIRST
DROP FUNCTION IF EXISTS public.get_invitation_by_token(text);

-- 1. Create organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  industry_suite text,
  accreditation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Storage bucket for org logos
INSERT INTO storage.buckets (id, name, public) VALUES ('org-logos', 'org-logos', true);
CREATE POLICY "Org logos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'org-logos');
CREATE POLICY "Authenticated users can upload org logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'org-logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update org logos" ON storage.objects FOR UPDATE USING (bucket_id = 'org-logos' AND auth.uid() IS NOT NULL);

-- 3. Add organization_id to all tables
ALTER TABLE public.profiles ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.projects ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.samples ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.results ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.departments ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.user_roles ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.parameter_configs ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.pending_invitations ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.clients ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.parameters ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.methods ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.lab_settings ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.notifications ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.test_packages ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.test_package_parameters ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.compliance_documents ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.validation_errors ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.validation_rule_configs ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.audit_logs ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- 4. get_my_org_id() helper
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT organization_id FROM public.profiles WHERE id = auth.uid() $$;

-- 5. Organizations RLS
CREATE POLICY "Anyone can view orgs" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Org admins can update" ON public.organizations FOR UPDATE TO authenticated USING (id = get_my_org_id() AND is_admin(auth.uid()));
CREATE POLICY "Auth users can create orgs" ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Rewrite ALL RLS policies with org isolation

-- PROFILES
DROP POLICY IF EXISTS "Admins and supervisors can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view profiles in their org" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR (organization_id = get_my_org_id() AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid()))));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- PROJECTS
DROP POLICY IF EXISTS "Users can view projects for their work" ON public.projects;
DROP POLICY IF EXISTS "Admins and supervisors can create projects" ON public.projects;
DROP POLICY IF EXISTS "Admins and supervisors can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
CREATE POLICY "View projects in org" ON public.projects FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid()) OR id IN (SELECT DISTINCT s.project_id FROM samples s JOIN results r ON r.sample_id = s.id WHERE r.entered_by = auth.uid())));
CREATE POLICY "Create projects in org" ON public.projects FOR INSERT TO authenticated WITH CHECK (organization_id = get_my_org_id() AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())));
CREATE POLICY "Update projects in org" ON public.projects FOR UPDATE TO authenticated USING (organization_id = get_my_org_id() AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())));
CREATE POLICY "Delete projects in org" ON public.projects FOR DELETE TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- SAMPLES
DROP POLICY IF EXISTS "Users can view samples for their work" ON public.samples;
DROP POLICY IF EXISTS "Admins and supervisors can create samples" ON public.samples;
DROP POLICY IF EXISTS "Admins and supervisors can update samples" ON public.samples;
DROP POLICY IF EXISTS "Admins can delete samples" ON public.samples;
CREATE POLICY "View samples in org" ON public.samples FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid()) OR id IN (SELECT DISTINCT r.sample_id FROM results r WHERE r.entered_by = auth.uid())));
CREATE POLICY "Create samples in org" ON public.samples FOR INSERT TO authenticated WITH CHECK (organization_id = get_my_org_id() AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())));
CREATE POLICY "Update samples in org" ON public.samples FOR UPDATE TO authenticated USING (organization_id = get_my_org_id() AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())));
CREATE POLICY "Delete samples in org" ON public.samples FOR DELETE TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- RESULTS
DROP POLICY IF EXISTS "Users can view results for their work" ON public.results;
DROP POLICY IF EXISTS "Analysts can insert results" ON public.results;
DROP POLICY IF EXISTS "Users can update results based on workflow" ON public.results;
DROP POLICY IF EXISTS "Admins can delete results" ON public.results;
CREATE POLICY "View results in org" ON public.results FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid()) OR is_qa_officer(auth.uid()) OR entered_by = auth.uid()));
CREATE POLICY "Insert results in org" ON public.results FOR INSERT TO authenticated WITH CHECK (organization_id = get_my_org_id() AND entered_by = auth.uid());
CREATE POLICY "Update results in org" ON public.results FOR UPDATE TO authenticated
  USING (organization_id = get_my_org_id() AND ((entered_by = auth.uid() AND status = 'draft') OR (is_lab_supervisor(auth.uid()) AND status = 'pending_review') OR (is_qa_officer(auth.uid()) AND status = 'reviewed') OR is_admin(auth.uid())));
CREATE POLICY "Delete results in org" ON public.results FOR DELETE TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- DEPARTMENTS
DROP POLICY IF EXISTS "Authenticated users can view active departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can insert departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can update departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can delete departments" ON public.departments;
CREATE POLICY "View depts in org" ON public.departments FOR SELECT TO authenticated USING (organization_id = get_my_org_id());
CREATE POLICY "Insert depts in org" ON public.departments FOR INSERT TO authenticated WITH CHECK (organization_id = get_my_org_id() AND is_admin(auth.uid()));
CREATE POLICY "Update depts in org" ON public.departments FOR UPDATE TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));
CREATE POLICY "Delete depts in org" ON public.departments FOR DELETE TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "View roles in org" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR organization_id = get_my_org_id());
CREATE POLICY "Insert roles in org" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (organization_id = get_my_org_id() AND is_admin(auth.uid()));
CREATE POLICY "Update roles in org" ON public.user_roles FOR UPDATE TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));
CREATE POLICY "Delete roles in org" ON public.user_roles FOR DELETE TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- CLIENTS
DROP POLICY IF EXISTS "Admins and supervisors can view clients" ON public.clients;
DROP POLICY IF EXISTS "Admins and supervisors can create clients" ON public.clients;
DROP POLICY IF EXISTS "Admins and supervisors can update clients" ON public.clients;
CREATE POLICY "View clients in org" ON public.clients FOR SELECT TO authenticated USING (organization_id = get_my_org_id() AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())));
CREATE POLICY "Create clients in org" ON public.clients FOR INSERT TO authenticated WITH CHECK (organization_id = get_my_org_id() AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())));
CREATE POLICY "Update clients in org" ON public.clients FOR UPDATE TO authenticated USING (organization_id = get_my_org_id() AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())));

-- PARAMETERS
DROP POLICY IF EXISTS "Authenticated users can view parameters" ON public.parameters;
DROP POLICY IF EXISTS "Admins can manage parameters" ON public.parameters;
CREATE POLICY "View params in org" ON public.parameters FOR SELECT TO authenticated USING (organization_id = get_my_org_id());
CREATE POLICY "Manage params in org" ON public.parameters FOR ALL TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- METHODS
DROP POLICY IF EXISTS "Authenticated users can view methods" ON public.methods;
DROP POLICY IF EXISTS "Admins can manage methods" ON public.methods;
CREATE POLICY "View methods in org" ON public.methods FOR SELECT TO authenticated USING (organization_id = get_my_org_id() OR organization_id IS NULL);
CREATE POLICY "Manage methods in org" ON public.methods FOR ALL TO authenticated USING ((organization_id = get_my_org_id() OR organization_id IS NULL) AND is_admin(auth.uid()));

-- PARAMETER_CONFIGS
DROP POLICY IF EXISTS "Authenticated users can view parameter configs" ON public.parameter_configs;
DROP POLICY IF EXISTS "Admins can manage parameter configs" ON public.parameter_configs;
CREATE POLICY "View param configs in org" ON public.parameter_configs FOR SELECT TO authenticated USING (organization_id = get_my_org_id());
CREATE POLICY "Manage param configs in org" ON public.parameter_configs FOR ALL TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- PENDING_INVITATIONS
DROP POLICY IF EXISTS "Admins can view invitations" ON public.pending_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON public.pending_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.pending_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.pending_invitations;
CREATE POLICY "View invitations in org" ON public.pending_invitations FOR SELECT TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));
CREATE POLICY "Create invitations in org" ON public.pending_invitations FOR INSERT TO authenticated WITH CHECK (organization_id = get_my_org_id() AND is_admin(auth.uid()));
CREATE POLICY "Update invitations in org" ON public.pending_invitations FOR UPDATE TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));
CREATE POLICY "Delete invitations in org" ON public.pending_invitations FOR DELETE TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- LAB_SETTINGS
DROP POLICY IF EXISTS "Authenticated users can view lab settings" ON public.lab_settings;
DROP POLICY IF EXISTS "Admins can manage lab settings" ON public.lab_settings;
CREATE POLICY "View settings in org" ON public.lab_settings FOR SELECT TO authenticated USING (organization_id = get_my_org_id());
CREATE POLICY "Manage settings in org" ON public.lab_settings FOR ALL TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authorized users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Create notifications in org" ON public.notifications FOR INSERT TO authenticated WITH CHECK (organization_id = get_my_org_id());
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- TEST_PACKAGES
DROP POLICY IF EXISTS "Authenticated users can view test packages" ON public.test_packages;
DROP POLICY IF EXISTS "Admins can manage test packages" ON public.test_packages;
CREATE POLICY "View test packages in org" ON public.test_packages FOR SELECT TO authenticated USING (organization_id = get_my_org_id());
CREATE POLICY "Manage test packages in org" ON public.test_packages FOR ALL TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- TEST_PACKAGE_PARAMETERS
DROP POLICY IF EXISTS "Authenticated users can view test package parameters" ON public.test_package_parameters;
DROP POLICY IF EXISTS "Admins can manage test package parameters" ON public.test_package_parameters;
CREATE POLICY "View tpp in org" ON public.test_package_parameters FOR SELECT TO authenticated USING (organization_id = get_my_org_id());
CREATE POLICY "Manage tpp in org" ON public.test_package_parameters FOR ALL TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- COMPLIANCE_DOCUMENTS
DROP POLICY IF EXISTS "Authenticated users can view compliance documents" ON public.compliance_documents;
DROP POLICY IF EXISTS "Admins can manage compliance documents" ON public.compliance_documents;
CREATE POLICY "View compliance in org" ON public.compliance_documents FOR SELECT TO authenticated USING (organization_id = get_my_org_id() AND (is_admin(auth.uid()) OR is_lab_supervisor(auth.uid())));
CREATE POLICY "Manage compliance in org" ON public.compliance_documents FOR ALL TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- VALIDATION_ERRORS
DROP POLICY IF EXISTS "Authenticated users can view validation errors" ON public.validation_errors;
DROP POLICY IF EXISTS "Users can view validation errors for their results" ON public.validation_errors;
DROP POLICY IF EXISTS "Authorized users can create validation errors" ON public.validation_errors;
DROP POLICY IF EXISTS "Users can update validation errors for their results" ON public.validation_errors;
DROP POLICY IF EXISTS "Admins can delete validation errors" ON public.validation_errors;
CREATE POLICY "View val errors in org" ON public.validation_errors FOR SELECT TO authenticated USING (organization_id = get_my_org_id());
CREATE POLICY "Create val errors in org" ON public.validation_errors FOR INSERT TO authenticated WITH CHECK (organization_id = get_my_org_id());
CREATE POLICY "Update val errors in org" ON public.validation_errors FOR UPDATE TO authenticated USING (organization_id = get_my_org_id());
CREATE POLICY "Delete val errors in org" ON public.validation_errors FOR DELETE TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- VALIDATION_RULE_CONFIGS
DROP POLICY IF EXISTS "Authenticated users can view validation configs" ON public.validation_rule_configs;
DROP POLICY IF EXISTS "Admins can manage validation configs" ON public.validation_rule_configs;
CREATE POLICY "View val configs in org" ON public.validation_rule_configs FOR SELECT TO authenticated USING (organization_id = get_my_org_id());
CREATE POLICY "Manage val configs in org" ON public.validation_rule_configs FOR ALL TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Block direct audit log inserts" ON public.audit_logs;
CREATE POLICY "View audit logs in org" ON public.audit_logs FOR SELECT TO authenticated USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));
CREATE POLICY "Block direct audit inserts" ON public.audit_logs FOR INSERT WITH CHECK (false);

-- 7. Updated functions
CREATE OR REPLACE FUNCTION public.accept_invitation(_token text, _user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
  role_item JSONB;
BEGIN
  SELECT * INTO invitation_record FROM public.pending_invitations
  WHERE token = _token AND expires_at > now() AND accepted_at IS NULL;
  IF NOT FOUND THEN RETURN false; END IF;
  
  UPDATE public.pending_invitations SET accepted_at = now() WHERE id = invitation_record.id;
  
  IF invitation_record.organization_id IS NOT NULL THEN
    UPDATE public.profiles SET organization_id = invitation_record.organization_id WHERE id = _user_id;
  END IF;
  
  FOR role_item IN SELECT * FROM jsonb_array_elements(invitation_record.roles)
  LOOP
    INSERT INTO public.user_roles (user_id, role, lab_section, department_id, organization_id, assigned_by)
    VALUES (
      _user_id, (role_item->>'role')::lab_role,
      CASE WHEN role_item->>'lab_section' IS NOT NULL THEN (role_item->>'lab_section')::lab_section ELSE NULL END,
      CASE WHEN role_item->>'department_id' IS NOT NULL THEN (role_item->>'department_id')::uuid ELSE NULL END,
      invitation_record.organization_id, invitation_record.invited_by
    ) ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE(id uuid, email text, roles jsonb, expires_at timestamptz, organization_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, email, roles, expires_at, organization_id
  FROM public.pending_invitations
  WHERE token = _token AND expires_at > now() AND accepted_at IS NULL
$$;

CREATE OR REPLACE FUNCTION public.get_org_by_slug(_slug text)
RETURNS TABLE(id uuid, name text, slug text, logo_url text, industry_suite text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, name, slug, logo_url, industry_suite FROM public.organizations WHERE slug = _slug
$$;

CREATE OR REPLACE FUNCTION public.register_organization(
  _user_id uuid, _org_name text, _org_slug text,
  _logo_url text DEFAULT NULL, _industry_suite text DEFAULT NULL, _accreditation text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _org_id uuid;
BEGIN
  INSERT INTO public.organizations (name, slug, logo_url, industry_suite, accreditation, created_by)
  VALUES (_org_name, _org_slug, _logo_url, _industry_suite, _accreditation, _user_id)
  RETURNING id INTO _org_id;
  
  UPDATE public.profiles SET organization_id = _org_id WHERE id = _user_id;
  INSERT INTO public.user_roles (user_id, role, organization_id) VALUES (_user_id, 'admin', _org_id);
  RETURN _org_id;
END;
$$;

-- Indexes
CREATE INDEX idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX idx_projects_org ON public.projects(organization_id);
CREATE INDEX idx_samples_org ON public.samples(organization_id);
CREATE INDEX idx_results_org ON public.results(organization_id);
CREATE INDEX idx_departments_org ON public.departments(organization_id);
CREATE INDEX idx_user_roles_org ON public.user_roles(organization_id);
CREATE INDEX idx_pending_invitations_org ON public.pending_invitations(organization_id);
CREATE INDEX idx_clients_org ON public.clients(organization_id);
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
