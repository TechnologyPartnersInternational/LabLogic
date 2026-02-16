// Industry-standard laboratory templates for quick department setup

export interface AnalyteGroupTemplate {
  key: string;
  label: string;
}

export interface DepartmentTemplate {
  name: string;
  slug: string;
  icon: string;
  analyteGroups: AnalyteGroupTemplate[];
}

export interface LabTemplate {
  id: string;
  name: string;
  description: string;
  standard: string;
  departments: DepartmentTemplate[];
}

export const labTemplates: LabTemplate[] = [
  {
    id: 'environmental',
    name: 'Environmental Laboratory',
    description: 'Water, wastewater, soil, and air quality testing following ISO 17025 and EPA methods.',
    standard: 'ISO 17025 / EPA',
    departments: [
      {
        name: 'Wet Chemistry',
        slug: 'wet-chemistry',
        icon: 'beaker',
        analyteGroups: [
          { key: 'physico_chemical', label: 'Physico-Chemical' },
          { key: 'anions', label: 'Anions' },
          { key: 'cations', label: 'Cations' },
        ],
      },
      {
        name: 'Instrumentation',
        slug: 'instrumentation',
        icon: 'activity',
        analyteGroups: [
          { key: 'heavy_metals', label: 'Heavy Metals (ICP-OES/MS)' },
          { key: 'hydrocarbons', label: 'Hydrocarbons (GC-FID/MS)' },
          { key: 'organics', label: 'Organics (HPLC/LC-MS)' },
        ],
      },
      {
        name: 'Microbiology',
        slug: 'microbiology',
        icon: 'microscope',
        analyteGroups: [
          { key: 'indicator_organisms', label: 'Indicator Organisms' },
          { key: 'pathogens', label: 'Pathogens' },
          { key: 'bod', label: 'Biological Oxygen Demand' },
        ],
      },
    ],
  },
  {
    id: 'pharmaceutical',
    name: 'Pharmaceutical / QC Laboratory',
    description: 'Quality control testing for raw materials, in-process, and finished pharmaceutical products.',
    standard: 'GMP / USP / ICH',
    departments: [
      {
        name: 'Raw Materials Testing',
        slug: 'raw-materials',
        icon: 'package',
        analyteGroups: [
          { key: 'identity_testing', label: 'Identity Testing' },
          { key: 'purity_analysis', label: 'Purity Analysis' },
          { key: 'assay_potency', label: 'Assay / Potency' },
        ],
      },
      {
        name: 'In-Process Controls',
        slug: 'in-process',
        icon: 'gauge',
        analyteGroups: [
          { key: 'blend_uniformity', label: 'Blend Uniformity' },
          { key: 'content_uniformity', label: 'Content Uniformity' },
          { key: 'dissolution', label: 'Dissolution' },
        ],
      },
      {
        name: 'Finished Product',
        slug: 'finished-product',
        icon: 'pill',
        analyteGroups: [
          { key: 'assay', label: 'Assay' },
          { key: 'impurities', label: 'Related Substances / Impurities' },
          { key: 'stability', label: 'Stability Indicating' },
        ],
      },
      {
        name: 'Microbiology',
        slug: 'pharma-microbiology',
        icon: 'microscope',
        analyteGroups: [
          { key: 'bioburden', label: 'Bioburden' },
          { key: 'sterility', label: 'Sterility Testing' },
          { key: 'endotoxin', label: 'Endotoxin (LAL)' },
        ],
      },
    ],
  },
  {
    id: 'food_beverage',
    name: 'Food & Beverage Laboratory',
    description: 'Testing for food safety, nutritional composition, contaminants, and microbial quality.',
    standard: 'ISO 22000 / Codex Alimentarius',
    departments: [
      {
        name: 'Proximate Analysis',
        slug: 'proximate-analysis',
        icon: 'wheat',
        analyteGroups: [
          { key: 'moisture', label: 'Moisture' },
          { key: 'ash', label: 'Ash' },
          { key: 'protein', label: 'Protein' },
          { key: 'fat', label: 'Fat' },
          { key: 'fiber', label: 'Fiber' },
          { key: 'carbohydrates', label: 'Carbohydrates' },
        ],
      },
      {
        name: 'Chemical Analysis',
        slug: 'chemical-analysis',
        icon: 'flask-conical',
        analyteGroups: [
          { key: 'additives', label: 'Additives' },
          { key: 'preservatives', label: 'Preservatives' },
          { key: 'contaminants', label: 'Contaminants' },
          { key: 'pesticide_residues', label: 'Pesticide Residues' },
        ],
      },
      {
        name: 'Microbiology',
        slug: 'food-microbiology',
        icon: 'microscope',
        analyteGroups: [
          { key: 'pathogens', label: 'Pathogens (Salmonella, Listeria, E. coli)' },
          { key: 'indicators', label: 'Indicator Organisms' },
          { key: 'yeast_mold', label: 'Yeast & Mold' },
        ],
      },
      {
        name: 'Sensory & Physical',
        slug: 'sensory-physical',
        icon: 'eye',
        analyteGroups: [
          { key: 'texture', label: 'Texture' },
          { key: 'color', label: 'Color' },
          { key: 'viscosity', label: 'Viscosity' },
          { key: 'particle_size', label: 'Particle Size' },
        ],
      },
    ],
  },
  {
    id: 'petrochemical',
    name: 'Petrochemical / Fuels Laboratory',
    description: 'Testing for fuel quality, lubricant performance, and process water monitoring.',
    standard: 'ASTM / IP Standards',
    departments: [
      {
        name: 'Fuel Testing',
        slug: 'fuel-testing',
        icon: 'fuel',
        analyteGroups: [
          { key: 'octane_cetane', label: 'Octane / Cetane' },
          { key: 'sulfur', label: 'Sulfur Content' },
          { key: 'distillation', label: 'Distillation' },
          { key: 'flash_point', label: 'Flash Point' },
        ],
      },
      {
        name: 'Lubricants',
        slug: 'lubricants',
        icon: 'droplets',
        analyteGroups: [
          { key: 'viscosity', label: 'Viscosity' },
          { key: 'wear_metals', label: 'Wear Metals' },
          { key: 'tan_tbn', label: 'Total Acid / Base Number' },
          { key: 'oxidation', label: 'Oxidation Stability' },
        ],
      },
      {
        name: 'Water & Effluent',
        slug: 'water-effluent',
        icon: 'droplet',
        analyteGroups: [
          { key: 'process_water', label: 'Process Water' },
          { key: 'cooling_water', label: 'Cooling Water' },
          { key: 'discharge', label: 'Discharge Monitoring' },
        ],
      },
    ],
  },
  {
    id: 'mining',
    name: 'Mining & Metallurgical Laboratory',
    description: 'Assay, geochemical analysis, process control, and environmental monitoring for mining operations.',
    standard: 'ISO 17025 / JORC',
    departments: [
      {
        name: 'Fire Assay',
        slug: 'fire-assay',
        icon: 'flame',
        analyteGroups: [
          { key: 'gold', label: 'Gold' },
          { key: 'pgms', label: 'PGMs' },
          { key: 'silver', label: 'Silver' },
        ],
      },
      {
        name: 'Geochemistry',
        slug: 'geochemistry',
        icon: 'mountain',
        analyteGroups: [
          { key: 'multi_element', label: 'Multi-Element (ICP-OES/MS)' },
          { key: 'trace', label: 'Trace Analysis' },
          { key: 'whole_rock', label: 'Whole Rock' },
        ],
      },
      {
        name: 'Process Control',
        slug: 'process-control',
        icon: 'settings',
        analyteGroups: [
          { key: 'grade_control', label: 'Grade Control' },
          { key: 'recovery', label: 'Recovery Testing' },
          { key: 'particle_size', label: 'Particle Size Distribution' },
        ],
      },
      {
        name: 'Environmental Monitoring',
        slug: 'environmental-monitoring',
        icon: 'leaf',
        analyteGroups: [
          { key: 'tailings', label: 'Tailings' },
          { key: 'amd', label: 'Acid Mine Drainage' },
          { key: 'water_quality', label: 'Water Quality' },
        ],
      },
    ],
  },
  {
    id: 'custom',
    name: 'Custom (Blank)',
    description: 'Start from scratch with no pre-defined departments. Build your own structure.',
    standard: 'Custom',
    departments: [],
  },
];
