-- Create table for storing validation rule configurations
CREATE TABLE public.validation_rule_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id text NOT NULL UNIQUE,
  rule_name text NOT NULL,
  category text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  thresholds jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.validation_rule_configs ENABLE ROW LEVEL SECURITY;

-- Everyone can view configs
CREATE POLICY "Authenticated users can view validation configs"
ON public.validation_rule_configs FOR SELECT
USING (true);

-- Only admins can manage configs
CREATE POLICY "Admins can manage validation configs"
ON public.validation_rule_configs FOR ALL
USING (is_admin(auth.uid()));

-- Add update trigger
CREATE TRIGGER update_validation_rule_configs_updated_at
BEFORE UPDATE ON public.validation_rule_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default validation rules
INSERT INTO public.validation_rule_configs (rule_id, rule_name, category, description, enabled, thresholds) VALUES
('hydrocarbon_hierarchy', 'Hydrocarbon Hierarchy', 'hydrocarbons', 'THC ≥ TPH ≥ PAH + BTEX relationship validation', true, '{}'),
('cod_bod_ratio', 'COD/BOD Relationship', 'oxygen_demand', 'COD must be greater than or equal to BOD₅', true, '{"typical_ratio_min": 1.5, "typical_ratio_max": 4.0}'),
('tds_conductivity', 'TDS/Conductivity Ratio', 'conductivity', 'TDS should be 0.5-0.75 × Conductivity', true, '{"ratio_min": 0.5, "ratio_max": 0.75}'),
('nitrogen_species', 'Nitrogen Species Balance', 'nitrogen', 'TKN ≥ NH₃-N and Total N ≥ sum of species', true, '{}'),
('solids_balance', 'Solids Balance', 'solids', 'TS = TSS + TDS within tolerance', true, '{"tolerance_percent": 15}'),
('alkalinity_ph', 'Alkalinity/pH Relationship', 'alkalinity', 'Low pH should correspond to near-zero alkalinity', true, '{"low_ph_threshold": 4.5, "high_alkalinity_threshold": 50}'),
('hardness_balance', 'Hardness Balance', 'hardness', 'Total Hardness ≈ Ca Hardness + Mg Hardness', true, '{"tolerance_percent": 10}'),
('ionic_balance', 'Ionic Balance', 'ionic', 'Cation-Anion balance within acceptable error', true, '{"warning_threshold_percent": 10, "error_threshold_percent": 15}')