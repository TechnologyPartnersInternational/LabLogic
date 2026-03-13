
-- Replace BOD with Microbial Counts in all microbiology departments
UPDATE public.departments
SET analyte_groups = jsonb_build_array(
  jsonb_build_object('key', 'indicator_organisms', 'label', 'Indicator Organisms'),
  jsonb_build_object('key', 'pathogens', 'label', 'Pathogens'),
  jsonb_build_object('key', 'microbial_counts', 'label', 'Microbial Counts')
)
WHERE slug = 'microbiology';
