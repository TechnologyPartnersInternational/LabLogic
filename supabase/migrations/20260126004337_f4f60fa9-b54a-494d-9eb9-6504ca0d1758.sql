-- Create compliance documents table for tracking certificates, permits, and accreditations
CREATE TABLE public.compliance_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT NOT NULL, -- 'calibration_certificate', 'regulatory_permit', 'accreditation', 'license'
  name TEXT NOT NULL,
  description TEXT,
  issuing_authority TEXT,
  document_number TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expiring_soon', 'expired', 'renewed'
  reminder_days INTEGER DEFAULT 30, -- Days before expiry to show warning
  file_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view compliance documents
CREATE POLICY "Authenticated users can view compliance documents"
ON public.compliance_documents
FOR SELECT
USING (true);

-- Only admins can manage compliance documents
CREATE POLICY "Admins can manage compliance documents"
ON public.compliance_documents
FOR ALL
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_compliance_documents_updated_at
BEFORE UPDATE ON public.compliance_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some common document types as examples
INSERT INTO public.compliance_documents (document_type, name, issuing_authority, issue_date, expiry_date, reminder_days, notes)
VALUES 
  ('accreditation', 'ISO 17025:2017 Accreditation', 'SON', '2024-01-15', '2027-01-14', 90, 'Main laboratory accreditation'),
  ('regulatory_permit', 'DPR Operating License', 'Department of Petroleum Resources', '2024-06-01', '2025-05-31', 60, 'Annual operating permit');