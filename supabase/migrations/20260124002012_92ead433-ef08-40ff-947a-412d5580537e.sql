-- Change container_type from text to text array to support multiple container types per sample
ALTER TABLE public.samples 
ALTER COLUMN container_type TYPE text[] USING CASE 
  WHEN container_type IS NULL THEN NULL 
  ELSE ARRAY[container_type] 
END;