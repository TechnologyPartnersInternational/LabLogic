ALTER TABLE public.samples ALTER COLUMN sample_condition DROP DEFAULT;

ALTER TABLE public.samples ALTER COLUMN sample_condition TYPE jsonb USING CASE WHEN sample_condition IS NULL THEN '{}'::jsonb WHEN sample_condition = 'intact' THEN '{}'::jsonb ELSE jsonb_build_object('general', sample_condition) END;

ALTER TABLE public.samples ALTER COLUMN sample_condition SET DEFAULT '{}'::jsonb;