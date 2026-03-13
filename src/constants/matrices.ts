import { Database } from '@/integrations/supabase/types';

export type MatrixType = Database['public']['Enums']['matrix_type'];

export const matrices: { value: MatrixType; label: string }[] = [
  { value: 'surface_water', label: 'Surface Water' },
  { value: 'groundwater', label: 'Groundwater' },
  { value: 'stormwater', label: 'Stormwater' },
  { value: 'borehole_water', label: 'Borehole Water' },
  { value: 'wastewater', label: 'Wastewater' },
  { value: 'sediment', label: 'Sediment' },
  { value: 'soil', label: 'Soil' },
  { value: 'sludge', label: 'Sludge' },
  { value: 'air', label: 'Air' },
  { value: 'vegetation', label: 'Vegetation' },
  { value: 'fish', label: 'Fish' },
];

export const matrixLabels: Record<string, string> = Object.fromEntries(
  matrices.map((m) => [m.value, m.label])
);

/** All matrix enum values for zod validation */
export const matrixValues = matrices.map((m) => m.value) as [MatrixType, ...MatrixType[]];
