-- Create lab_settings table for configurable laboratory information
CREATE TABLE public.lab_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lab_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view settings
CREATE POLICY "Authenticated users can view lab settings"
  ON public.lab_settings FOR SELECT
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage lab settings"
  ON public.lab_settings FOR ALL
  USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_lab_settings_updated_at
  BEFORE UPDATE ON public.lab_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default lab settings for TPI
INSERT INTO public.lab_settings (setting_key, setting_value, description) VALUES
  ('lab_name', 'Technology Partners International', 'Full laboratory name displayed on reports'),
  ('lab_short_name', 'TPI', 'Abbreviated laboratory name'),
  ('lab_address', '', 'Laboratory physical address'),
  ('lab_phone', '', 'Laboratory contact phone number'),
  ('lab_email', '', 'Laboratory contact email'),
  ('lab_accreditation', 'ISO 17025:2017 Accredited', 'Accreditation statement for reports'),
  ('lab_tagline', 'Environmental Laboratory Services', 'Tagline displayed on reports');