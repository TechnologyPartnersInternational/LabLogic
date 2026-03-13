
-- Step 1: Add new enum values to matrix_type
ALTER TYPE public.matrix_type ADD VALUE IF NOT EXISTS 'surface_water';
ALTER TYPE public.matrix_type ADD VALUE IF NOT EXISTS 'groundwater';
ALTER TYPE public.matrix_type ADD VALUE IF NOT EXISTS 'stormwater';
ALTER TYPE public.matrix_type ADD VALUE IF NOT EXISTS 'borehole_water';
ALTER TYPE public.matrix_type ADD VALUE IF NOT EXISTS 'vegetation';
ALTER TYPE public.matrix_type ADD VALUE IF NOT EXISTS 'fish';
