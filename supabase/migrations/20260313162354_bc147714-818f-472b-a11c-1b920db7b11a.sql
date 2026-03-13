
-- Move BOD from microbiology to wet_chemistry
UPDATE public.parameters 
SET lab_section = 'wet_chemistry', analyte_group = 'Physico-Chemical'
WHERE id = 'cf3d4c7d-8d70-4b69-b95a-41d7152db8d8';

-- Rename analyte_group "Microbiology" to "Microbial Counts"
UPDATE public.parameters 
SET analyte_group = 'Microbial Counts'
WHERE lab_section = 'microbiology' AND analyte_group = 'Microbiology';
