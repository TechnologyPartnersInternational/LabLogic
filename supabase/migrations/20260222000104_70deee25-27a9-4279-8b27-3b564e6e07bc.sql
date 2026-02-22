
-- Store per-org calculation rule configurations
CREATE TABLE public.calculation_rule_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  rule_id text NOT NULL,
  rule_name text NOT NULL,
  category text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  overrides jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, rule_id)
);

ALTER TABLE public.calculation_rule_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View calc configs in org" ON public.calculation_rule_configs
  FOR SELECT USING (organization_id = get_my_org_id());

CREATE POLICY "Manage calc configs in org" ON public.calculation_rule_configs
  FOR ALL USING (organization_id = get_my_org_id() AND is_admin(auth.uid()));

CREATE TRIGGER update_calc_rule_configs_updated_at
  BEFORE UPDATE ON public.calculation_rule_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
