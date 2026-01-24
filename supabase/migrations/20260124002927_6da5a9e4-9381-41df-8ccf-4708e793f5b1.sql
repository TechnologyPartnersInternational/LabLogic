-- Add COC fields to projects table (project-level data)
ALTER TABLE public.projects
ADD COLUMN sampler_name text,
ADD COLUMN sampler_company text,
ADD COLUMN tat text,
ADD COLUMN regulatory_program text,
ADD COLUMN special_instructions text,
ADD COLUMN receipt_discrepancies text,
ADD COLUMN relinquished_by text,
ADD COLUMN received_by text;

-- Add COC fields to samples table (sample-level data)
ALTER TABLE public.samples
ADD COLUMN sample_condition text DEFAULT 'intact',
ADD COLUMN container_count integer DEFAULT 1;

-- Add comment for regulatory program options
COMMENT ON COLUMN public.projects.regulatory_program IS 'Nigerian regulatory programs: NUPRC, NMDPRA, NOSDRA, FMEnv, IFC';