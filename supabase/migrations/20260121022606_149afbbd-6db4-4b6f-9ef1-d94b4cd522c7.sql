-- =====================================================
-- LIMS Database Schema for Environmental Laboratory
-- =====================================================

-- 1. Create ENUM types for roles and statuses
CREATE TYPE public.lab_role AS ENUM (
  'wet_chemistry_analyst',
  'instrumentation_analyst', 
  'microbiology_analyst',
  'lab_supervisor',
  'qa_officer',
  'admin'
);

CREATE TYPE public.lab_section AS ENUM (
  'wet_chemistry',
  'instrumentation',
  'microbiology'
);

CREATE TYPE public.result_status AS ENUM (
  'draft',
  'pending_review',
  'reviewed',
  'approved',
  'rejected',
  'revision_required'
);

CREATE TYPE public.sample_status AS ENUM (
  'received',
  'in_progress',
  'completed',
  'released'
);

CREATE TYPE public.matrix_type AS ENUM (
  'water',
  'wastewater',
  'sediment',
  'soil',
  'air',
  'sludge'
);

CREATE TYPE public.result_type AS ENUM (
  'numeric',
  'presence_absence',
  'mpn',
  'cfu',
  'text'
);

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role lab_role NOT NULL,
  lab_section lab_section, -- Only relevant for analyst roles
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE(user_id, role, lab_section)
);

-- 4. Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- 5. Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  sample_collection_date DATE,
  sample_receipt_date DATE,
  analysis_start_date DATE,
  analysis_end_date DATE,
  results_issued_date DATE,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- 6. Create methods table
CREATE TABLE public.methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  organization TEXT NOT NULL CHECK (organization IN ('APHA', 'ASTM', 'EPA', 'ISO', 'Internal')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create parameters table
CREATE TABLE public.parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  lab_section lab_section NOT NULL,
  cas_number TEXT,
  analyte_group TEXT NOT NULL,
  result_type result_type NOT NULL DEFAULT 'numeric',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create parameter_configs table (links parameter + matrix + method with MDL/LOQ)
CREATE TABLE public.parameter_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_id UUID NOT NULL REFERENCES public.parameters(id) ON DELETE CASCADE,
  matrix matrix_type NOT NULL,
  method_id UUID NOT NULL REFERENCES public.methods(id) ON DELETE RESTRICT,
  canonical_unit TEXT NOT NULL,
  allowed_units TEXT[] DEFAULT '{}',
  mdl DECIMAL(12,6) NOT NULL, -- Minimum Detection Limit
  loq DECIMAL(12,6) NOT NULL, -- Limit of Quantification
  min_value DECIMAL(12,6),
  max_value DECIMAL(12,6),
  decimal_places INTEGER NOT NULL DEFAULT 2,
  report_below_mdl_as TEXT NOT NULL DEFAULT '<MDL' CHECK (report_below_mdl_as IN ('<MDL', 'ND', 'value')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parameter_id, matrix, method_id)
);

-- 9. Create samples table
CREATE TABLE public.samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  sample_id TEXT NOT NULL, -- Lab-assigned ID
  field_id TEXT, -- Field sample ID
  matrix matrix_type NOT NULL,
  sample_type TEXT NOT NULL DEFAULT 'grab' CHECK (sample_type IN ('grab', 'composite')),
  collection_date DATE NOT NULL,
  collection_time TIME,
  location TEXT,
  depth TEXT,
  preservation_type TEXT,
  container_type TEXT,
  status sample_status NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(project_id, sample_id)
);

-- 10. Create results table with full workflow tracking
CREATE TABLE public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID NOT NULL REFERENCES public.samples(id) ON DELETE RESTRICT,
  parameter_config_id UUID NOT NULL REFERENCES public.parameter_configs(id) ON DELETE RESTRICT,
  -- Values
  entered_value TEXT, -- What analyst entered (could be number or qualifier)
  entered_unit TEXT,
  canonical_value DECIMAL(12,6), -- Converted to canonical unit
  canonical_unit TEXT,
  qualifier TEXT, -- '<MDL', 'ND', etc.
  is_below_mdl BOOLEAN DEFAULT FALSE,
  -- Status & Workflow
  status result_status NOT NULL DEFAULT 'draft',
  -- Analyst entry
  entered_by UUID REFERENCES public.profiles(id),
  entered_at TIMESTAMPTZ,
  analyst_notes TEXT,
  -- Supervisor review
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  -- QA approval
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  -- Rejection tracking
  rejected_by UUID REFERENCES public.profiles(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  -- Revision tracking (for editing approved results)
  revision_number INTEGER DEFAULT 0,
  revision_reason TEXT,
  previous_value TEXT, -- Store previous value before revision
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Analysis metadata
  analysis_date DATE,
  instrument_id TEXT,
  batch_id TEXT,
  UNIQUE(sample_id, parameter_config_id)
);

-- 11. Create validation_errors table for tracking validation issues
CREATE TABLE public.validation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
  error_code TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('error', 'warning', 'info')),
  field TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  override_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Create audit_logs table for complete change tracking
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'approve', 'reject', 'submit', 'revise')),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  previous_value JSONB,
  new_value JSONB,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Create test_packages table for grouping parameters
CREATE TABLE public.test_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  lab_section lab_section NOT NULL,
  matrices matrix_type[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.test_package_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_package_id UUID NOT NULL REFERENCES public.test_packages(id) ON DELETE CASCADE,
  parameter_id UUID NOT NULL REFERENCES public.parameters(id) ON DELETE CASCADE,
  UNIQUE(test_package_id, parameter_id)
);

-- =====================================================
-- SECURITY DEFINER FUNCTIONS (for RLS without recursion)
-- =====================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role lab_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Check if user is lab supervisor
CREATE OR REPLACE FUNCTION public.is_lab_supervisor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'lab_supervisor')
$$;

-- Check if user is QA officer
CREATE OR REPLACE FUNCTION public.is_qa_officer(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'qa_officer')
$$;

-- Get user's lab sections
CREATE OR REPLACE FUNCTION public.get_user_lab_sections(_user_id UUID)
RETURNS SETOF lab_section
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT lab_section FROM public.user_roles
  WHERE user_id = _user_id AND lab_section IS NOT NULL
$$;

-- Check if user is analyst for a specific lab section
CREATE OR REPLACE FUNCTION public.is_analyst_for_section(_user_id UUID, _section lab_section)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND lab_section = _section
    AND role IN ('wet_chemistry_analyst', 'instrumentation_analyst', 'microbiology_analyst')
  )
$$;

-- Check if result is editable (not approved)
CREATE OR REPLACE FUNCTION public.is_result_editable(_result_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.results
    WHERE id = _result_id AND status = 'approved'
  )
$$;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parameter_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_package_parameters ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- PROFILES: Users can view their own profile, admins can view all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- USER_ROLES: Users can view their own roles, admins can manage all
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.is_admin(auth.uid()));

-- CLIENTS: All authenticated users can view, create, update
CREATE POLICY "Authenticated users can view clients" ON public.clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create clients" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE TO authenticated USING (true);

-- PROJECTS: All authenticated users can view and manage
CREATE POLICY "Authenticated users can view projects" ON public.projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects" ON public.projects
  FOR UPDATE TO authenticated USING (true);

-- SAMPLES: All authenticated users can view and manage
CREATE POLICY "Authenticated users can view samples" ON public.samples
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create samples" ON public.samples
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update samples" ON public.samples
  FOR UPDATE TO authenticated USING (true);

-- PARAMETERS: All authenticated can view, admins can manage
CREATE POLICY "Authenticated users can view parameters" ON public.parameters
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage parameters" ON public.parameters
  FOR ALL USING (public.is_admin(auth.uid()));

-- METHODS: All authenticated can view, admins can manage
CREATE POLICY "Authenticated users can view methods" ON public.methods
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage methods" ON public.methods
  FOR ALL USING (public.is_admin(auth.uid()));

-- PARAMETER_CONFIGS: All authenticated can view, admins can manage
CREATE POLICY "Authenticated users can view parameter configs" ON public.parameter_configs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage parameter configs" ON public.parameter_configs
  FOR ALL USING (public.is_admin(auth.uid()));

-- RESULTS: Complex policies for workflow
CREATE POLICY "Authenticated users can view results" ON public.results
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Analysts can insert results" ON public.results
  FOR INSERT TO authenticated WITH CHECK (
    entered_by = auth.uid()
  );

CREATE POLICY "Users can update results based on workflow" ON public.results
  FOR UPDATE TO authenticated USING (
    -- Analyst can update their own draft results
    (entered_by = auth.uid() AND status = 'draft')
    -- Supervisors can update pending_review results
    OR (public.is_lab_supervisor(auth.uid()) AND status = 'pending_review')
    -- QA can update reviewed results
    OR (public.is_qa_officer(auth.uid()) AND status = 'reviewed')
    -- Admins can update anything
    OR public.is_admin(auth.uid())
  );

-- VALIDATION_ERRORS: View based on result access
CREATE POLICY "Authenticated users can view validation errors" ON public.validation_errors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage validation errors" ON public.validation_errors
  FOR ALL TO authenticated USING (true);

-- AUDIT_LOGS: View only, admins see all, users see related
CREATE POLICY "Authenticated users can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- TEST_PACKAGES: All authenticated can view
CREATE POLICY "Authenticated users can view test packages" ON public.test_packages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage test packages" ON public.test_packages
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view test package parameters" ON public.test_package_parameters
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage test package parameters" ON public.test_package_parameters
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- TRIGGERS FOR AUDIT LOGGING
-- =====================================================

-- Function to log changes to audit_logs
CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, user_id, new_value)
    VALUES (TG_TABLE_NAME, NEW.id, 'create', auth.uid(), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, user_id, previous_value, new_value)
    VALUES (TG_TABLE_NAME, NEW.id, 'update', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, user_id, previous_value)
    VALUES (TG_TABLE_NAME, OLD.id, 'delete', auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Apply audit triggers to results table
CREATE TRIGGER audit_results_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- Apply audit triggers to samples table
CREATE TRIGGER audit_samples_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.samples
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_samples_updated_at
  BEFORE UPDATE ON public.samples
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_results_updated_at
  BEFORE UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parameter_configs_updated_at
  BEFORE UPDATE ON public.parameter_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_samples_project_id ON public.samples(project_id);
CREATE INDEX idx_samples_status ON public.samples(status);
CREATE INDEX idx_results_sample_id ON public.results(sample_id);
CREATE INDEX idx_results_status ON public.results(status);
CREATE INDEX idx_results_entered_by ON public.results(entered_by);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_parameter_configs_parameter ON public.parameter_configs(parameter_id);
CREATE INDEX idx_parameter_configs_matrix ON public.parameter_configs(matrix);