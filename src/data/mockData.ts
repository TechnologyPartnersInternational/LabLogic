import { 
  Parameter, 
  ParameterConfig, 
  TestPackage, 
  Client, 
  Project, 
  Sample, 
  DashboardStats,
  Unit,
  Method
} from '@/types/lims';

// Units
export const units: Unit[] = [
  { id: 'mg_l', symbol: 'mg/L', name: 'Milligrams per Liter', conversionFactor: 1, isCanonical: true },
  { id: 'ug_l', symbol: 'µg/L', name: 'Micrograms per Liter', conversionFactor: 0.001, isCanonical: false },
  { id: 'mg_kg', symbol: 'mg/kg', name: 'Milligrams per Kilogram', conversionFactor: 1, isCanonical: true },
  { id: 'ppm', symbol: 'ppm', name: 'Parts per Million', conversionFactor: 1, isCanonical: false },
  { id: 'ppb', symbol: 'ppb', name: 'Parts per Billion', conversionFactor: 0.001, isCanonical: false },
  { id: 'us_cm', symbol: 'µS/cm', name: 'Microsiemens per Centimeter', conversionFactor: 1, isCanonical: true },
  { id: 'ntu', symbol: 'NTU', name: 'Nephelometric Turbidity Units', conversionFactor: 1, isCanonical: true },
  { id: 'ppt', symbol: 'ppt', name: 'Parts per Thousand', conversionFactor: 1, isCanonical: true },
  { id: 'mv', symbol: 'mV', name: 'Millivolt', conversionFactor: 1, isCanonical: true },
  { id: 'celsius', symbol: '°C', name: 'Degrees Celsius', conversionFactor: 1, isCanonical: true },
  { id: 'ptco', symbol: 'PtCo', name: 'Platinum Cobalt Units', conversionFactor: 1, isCanonical: true },
  { id: 'cfu_ml', symbol: 'CFU/mL', name: 'Colony Forming Units per mL', conversionFactor: 1, isCanonical: true },
  { id: 'cfu_100ml', symbol: 'CFU/100mL', name: 'Colony Forming Units per 100mL', conversionFactor: 1, isCanonical: true },
  { id: 'mpn_100ml', symbol: 'MPN/100mL', name: 'Most Probable Number per 100mL', conversionFactor: 1, isCanonical: true },
  { id: 'percent', symbol: '%', name: 'Percent', conversionFactor: 1, isCanonical: true },
  { id: 'ph_units', symbol: 'pH', name: 'pH Units', conversionFactor: 1, isCanonical: true },
];

// Methods
export const methods: Method[] = [
  { id: 'apha_4500h', code: 'APHA 4500-H⁺ B', name: 'Electrometric Method', organization: 'APHA' },
  { id: 'apha_2510', code: 'APHA 2510 B', name: 'Conductivity - Laboratory Method', organization: 'APHA' },
  { id: 'apha_2130', code: 'APHA 2130 B', name: 'Turbidity - Nephelometric Method', organization: 'APHA' },
  { id: 'apha_4500o', code: 'APHA 4500-O G', name: 'Dissolved Oxygen - Membrane Electrode', organization: 'APHA' },
  { id: 'apha_5210', code: 'APHA 5210 B', name: 'BOD - 5-Day BOD Test', organization: 'APHA' },
  { id: 'apha_5220', code: 'APHA 5220 D', name: 'COD - Closed Reflux, Colorimetric', organization: 'APHA' },
  { id: 'apha_2540', code: 'APHA 2540 C/D', name: 'Total Dissolved/Suspended Solids', organization: 'APHA' },
  { id: 'apha_3111', code: 'APHA 3111 B', name: 'Metals by AAS - Direct Aspiration', organization: 'APHA' },
  { id: 'apha_3120', code: 'APHA 3120 B', name: 'Metals by ICP', organization: 'APHA' },
  { id: 'epa_8015', code: 'EPA 8015', name: 'TPH - GC/FID', organization: 'EPA' },
  { id: 'epa_8270', code: 'EPA 8270', name: 'PAHs - GC/MS', organization: 'EPA' },
  { id: 'apha_9221', code: 'APHA 9221 B', name: 'Multiple-Tube Fermentation', organization: 'APHA' },
  { id: 'apha_9222', code: 'APHA 9222 B', name: 'Membrane Filter Technique', organization: 'APHA' },
];

// Parameters based on actual lab report
export const parameters: Parameter[] = [
  // Physico-Chemical
  { id: 'ph', name: 'pH', abbreviation: 'pH', category: 'wet_chemistry', analyteGroup: 'Physical', resultType: 'numeric' },
  { id: 'temp', name: 'Temperature', abbreviation: 'Temp', category: 'wet_chemistry', analyteGroup: 'Physical', resultType: 'numeric' },
  { id: 'conductivity', name: 'Electrical Conductivity', abbreviation: 'EC', category: 'wet_chemistry', analyteGroup: 'Physical', resultType: 'numeric' },
  { id: 'turbidity', name: 'Turbidity', abbreviation: 'Turb', category: 'wet_chemistry', analyteGroup: 'Physical', resultType: 'numeric' },
  { id: 'do', name: 'Dissolved Oxygen', abbreviation: 'DO', category: 'wet_chemistry', analyteGroup: 'Physical', resultType: 'numeric' },
  { id: 'cod', name: 'Chemical Oxygen Demand', abbreviation: 'COD', category: 'wet_chemistry', analyteGroup: 'Oxygen Demand', resultType: 'numeric' },
  { id: 'bod5', name: 'Biochemical Oxygen Demand', abbreviation: 'BOD₅', category: 'wet_chemistry', analyteGroup: 'Oxygen Demand', resultType: 'numeric' },
  { id: 'tds', name: 'Total Dissolved Solids', abbreviation: 'TDS', category: 'wet_chemistry', analyteGroup: 'Solids', resultType: 'numeric' },
  { id: 'tss', name: 'Total Suspended Solids', abbreviation: 'TSS', category: 'wet_chemistry', analyteGroup: 'Solids', resultType: 'numeric' },
  { id: 'salinity', name: 'Salinity', abbreviation: 'Sal', category: 'wet_chemistry', analyteGroup: 'Physical', resultType: 'numeric' },
  { id: 'alkalinity', name: 'Alkalinity', abbreviation: 'Alk', category: 'wet_chemistry', analyteGroup: 'Physical', resultType: 'numeric' },
  { id: 'redox', name: 'Redox Potential', abbreviation: 'ORP', category: 'wet_chemistry', analyteGroup: 'Physical', resultType: 'numeric' },
  { id: 'hardness', name: 'Total Hardness', abbreviation: 'TH', category: 'wet_chemistry', analyteGroup: 'Physical', resultType: 'numeric' },
  { id: 'colour', name: 'Colour', abbreviation: 'Col', category: 'wet_chemistry', analyteGroup: 'Physical', resultType: 'numeric' },
  
  // Cations & Anions
  { id: 'ammonium', name: 'Ammonium', abbreviation: 'NH₄⁺', category: 'wet_chemistry', analyteGroup: 'Nutrients', resultType: 'numeric' },
  { id: 'chloride', name: 'Chloride', abbreviation: 'Cl⁻', category: 'wet_chemistry', analyteGroup: 'Anions', resultType: 'numeric' },
  { id: 'phosphate', name: 'Phosphate', abbreviation: 'PO₄³⁻', category: 'wet_chemistry', analyteGroup: 'Nutrients', resultType: 'numeric' },
  { id: 'sulphate', name: 'Sulphate', abbreviation: 'SO₄²⁻', category: 'wet_chemistry', analyteGroup: 'Anions', resultType: 'numeric' },
  { id: 'nitrate', name: 'Nitrate', abbreviation: 'NO₃⁻', category: 'wet_chemistry', analyteGroup: 'Nutrients', resultType: 'numeric' },
  { id: 'carbonate', name: 'Carbonate', abbreviation: 'CO₃²⁻', category: 'wet_chemistry', analyteGroup: 'Anions', resultType: 'numeric' },
  { id: 'calcium', name: 'Calcium', abbreviation: 'Ca', category: 'wet_chemistry', analyteGroup: 'Cations', resultType: 'numeric' },
  { id: 'magnesium', name: 'Magnesium', abbreviation: 'Mg', category: 'wet_chemistry', analyteGroup: 'Cations', resultType: 'numeric' },
  { id: 'potassium', name: 'Potassium', abbreviation: 'K', category: 'wet_chemistry', analyteGroup: 'Cations', resultType: 'numeric' },
  { id: 'sodium', name: 'Sodium', abbreviation: 'Na', category: 'wet_chemistry', analyteGroup: 'Cations', resultType: 'numeric' },
  
  // Heavy Metals
  { id: 'cadmium', name: 'Cadmium', abbreviation: 'Cd', category: 'instrumentation', analyteGroup: 'Heavy Metals', resultType: 'numeric', casNumber: '7440-43-9' },
  { id: 'zinc', name: 'Zinc', abbreviation: 'Zn', category: 'instrumentation', analyteGroup: 'Heavy Metals', resultType: 'numeric', casNumber: '7440-66-6' },
  { id: 'iron', name: 'Iron', abbreviation: 'Fe', category: 'instrumentation', analyteGroup: 'Heavy Metals', resultType: 'numeric', casNumber: '7439-89-6' },
  { id: 'copper', name: 'Copper', abbreviation: 'Cu', category: 'instrumentation', analyteGroup: 'Heavy Metals', resultType: 'numeric', casNumber: '7440-50-8' },
  { id: 'chromium', name: 'Chromium', abbreviation: 'Cr', category: 'instrumentation', analyteGroup: 'Heavy Metals', resultType: 'numeric', casNumber: '7440-47-3' },
  { id: 'nickel', name: 'Nickel', abbreviation: 'Ni', category: 'instrumentation', analyteGroup: 'Heavy Metals', resultType: 'numeric', casNumber: '7440-02-0' },
  { id: 'lead', name: 'Lead', abbreviation: 'Pb', category: 'instrumentation', analyteGroup: 'Heavy Metals', resultType: 'numeric', casNumber: '7439-92-1' },
  { id: 'vanadium', name: 'Vanadium', abbreviation: 'V', category: 'instrumentation', analyteGroup: 'Heavy Metals', resultType: 'numeric', casNumber: '7440-62-2' },
  { id: 'arsenic', name: 'Arsenic', abbreviation: 'As', category: 'instrumentation', analyteGroup: 'Heavy Metals', resultType: 'numeric', casNumber: '7440-38-2' },
  { id: 'mercury', name: 'Mercury', abbreviation: 'Hg', category: 'instrumentation', analyteGroup: 'Heavy Metals', resultType: 'numeric', casNumber: '7439-97-6' },
  { id: 'barium', name: 'Barium', abbreviation: 'Ba', category: 'instrumentation', analyteGroup: 'Heavy Metals', resultType: 'numeric', casNumber: '7440-39-3' },
  { id: 'manganese', name: 'Manganese', abbreviation: 'Mn', category: 'instrumentation', analyteGroup: 'Heavy Metals', resultType: 'numeric', casNumber: '7439-96-5' },
  { id: 'cobalt', name: 'Cobalt', abbreviation: 'Co', category: 'instrumentation', analyteGroup: 'Heavy Metals', resultType: 'numeric', casNumber: '7440-48-4' },
  
  // Hydrocarbons
  { id: 'oil_grease', name: 'Oil and Grease', abbreviation: 'O&G', category: 'instrumentation', analyteGroup: 'Hydrocarbons', resultType: 'numeric' },
  { id: 'thc', name: 'Total Hydrocarbon Content', abbreviation: 'THC', category: 'instrumentation', analyteGroup: 'Hydrocarbons', resultType: 'numeric' },
  { id: 'tph', name: 'Total Petroleum Hydrocarbon', abbreviation: 'TPH', category: 'instrumentation', analyteGroup: 'Hydrocarbons', resultType: 'numeric' },
  { id: 'pahs', name: 'Polycyclic Aromatic Hydrocarbons', abbreviation: 'PAHs', category: 'instrumentation', analyteGroup: 'Hydrocarbons', resultType: 'numeric' },
  { id: 'btex', name: 'BTEX', abbreviation: 'BTEX', category: 'instrumentation', analyteGroup: 'Hydrocarbons', resultType: 'numeric' },
  { id: 'phenols', name: 'Phenols', abbreviation: 'Phenols', category: 'instrumentation', analyteGroup: 'Hydrocarbons', resultType: 'numeric' },
  
  // Microbiology
  { id: 'thb', name: 'Total Heterotrophic Bacteria', abbreviation: 'THB', category: 'microbiology', analyteGroup: 'Bacteria', resultType: 'cfu' },
  { id: 'tf', name: 'Total Fungi', abbreviation: 'TF', category: 'microbiology', analyteGroup: 'Fungi', resultType: 'cfu' },
  { id: 'hub', name: 'Hydrocarbon Utilizing Bacteria', abbreviation: 'HUB', category: 'microbiology', analyteGroup: 'Bacteria', resultType: 'cfu' },
  { id: 'huf', name: 'Hydrocarbon Utilizing Fungi', abbreviation: 'HUF', category: 'microbiology', analyteGroup: 'Fungi', resultType: 'cfu' },
  { id: 'srb', name: 'Sulphate Reducing Bacteria', abbreviation: 'SRB', category: 'microbiology', analyteGroup: 'Bacteria', resultType: 'mpn' },
  
  // Sediment specific
  { id: 'toc', name: 'Total Organic Carbon', abbreviation: 'TOC', category: 'wet_chemistry', analyteGroup: 'Organic', resultType: 'numeric' },
];

// Parameter configurations with MDL values from the lab report
export const parameterConfigs: ParameterConfig[] = [
  // Physico-Chemical Water
  { id: 'pc_ph_water', parameterId: 'ph', matrixId: 'surface_water', methodId: 'apha_4500h', canonicalUnit: units[15], allowedUnits: [units[15]], mdl: 0.01, loq: 0.05, minValue: 0, maxValue: 14, decimalPlaces: 2, reportBelowMdlAs: '<MDL' },
  { id: 'pc_temp_water', parameterId: 'temp', matrixId: 'surface_water', methodId: 'apha_2510', canonicalUnit: units[9], allowedUnits: [units[9]], mdl: 0.01, loq: 0.1, decimalPlaces: 1, reportBelowMdlAs: '<MDL' },
  { id: 'pc_cond_water', parameterId: 'conductivity', matrixId: 'surface_water', methodId: 'apha_2510', canonicalUnit: units[5], allowedUnits: [units[5]], mdl: 0.01, loq: 1, decimalPlaces: 0, reportBelowMdlAs: '<MDL' },
  { id: 'pc_turb_water', parameterId: 'turbidity', matrixId: 'surface_water', methodId: 'apha_2130', canonicalUnit: units[6], allowedUnits: [units[6]], mdl: 0.01, loq: 0.1, decimalPlaces: 1, reportBelowMdlAs: '<MDL' },
  { id: 'pc_do_water', parameterId: 'do', matrixId: 'surface_water', methodId: 'apha_4500o', canonicalUnit: units[0], allowedUnits: [units[0]], mdl: 0.01, loq: 0.1, decimalPlaces: 2, reportBelowMdlAs: '<MDL' },
  { id: 'pc_cod_water', parameterId: 'cod', matrixId: 'surface_water', methodId: 'apha_5220', canonicalUnit: units[0], allowedUnits: [units[0]], mdl: 3.00, loq: 5, decimalPlaces: 1, reportBelowMdlAs: '<MDL' },
  { id: 'pc_bod_water', parameterId: 'bod5', matrixId: 'surface_water', methodId: 'apha_5210', canonicalUnit: units[0], allowedUnits: [units[0]], mdl: 0.01, loq: 0.5, decimalPlaces: 2, reportBelowMdlAs: '<MDL' },
  { id: 'pc_tds_water', parameterId: 'tds', matrixId: 'surface_water', methodId: 'apha_2540', canonicalUnit: units[0], allowedUnits: [units[0]], mdl: 0.01, loq: 1, decimalPlaces: 0, reportBelowMdlAs: '<MDL' },
  { id: 'pc_tss_water', parameterId: 'tss', matrixId: 'surface_water', methodId: 'apha_2540', canonicalUnit: units[0], allowedUnits: [units[0]], mdl: 0.01, loq: 1, decimalPlaces: 2, reportBelowMdlAs: '<MDL' },
  
  // Heavy Metals
  { id: 'hm_cd_water', parameterId: 'cadmium', matrixId: 'surface_water', methodId: 'apha_3120', canonicalUnit: units[0], allowedUnits: [units[0], units[1]], mdl: 0.002, loq: 0.005, decimalPlaces: 3, reportBelowMdlAs: '<MDL' },
  { id: 'hm_zn_water', parameterId: 'zinc', matrixId: 'surface_water', methodId: 'apha_3120', canonicalUnit: units[0], allowedUnits: [units[0], units[1]], mdl: 0.002, loq: 0.005, decimalPlaces: 3, reportBelowMdlAs: '<MDL' },
  { id: 'hm_fe_water', parameterId: 'iron', matrixId: 'surface_water', methodId: 'apha_3120', canonicalUnit: units[0], allowedUnits: [units[0], units[1]], mdl: 0.002, loq: 0.005, decimalPlaces: 3, reportBelowMdlAs: '<MDL' },
  { id: 'hm_cu_water', parameterId: 'copper', matrixId: 'surface_water', methodId: 'apha_3120', canonicalUnit: units[0], allowedUnits: [units[0], units[1]], mdl: 0.004, loq: 0.01, decimalPlaces: 3, reportBelowMdlAs: '<MDL' },
  { id: 'hm_pb_water', parameterId: 'lead', matrixId: 'surface_water', methodId: 'apha_3120', canonicalUnit: units[0], allowedUnits: [units[0], units[1]], mdl: 0.009, loq: 0.02, decimalPlaces: 3, reportBelowMdlAs: '<MDL' },
  { id: 'hm_hg_water', parameterId: 'mercury', matrixId: 'surface_water', methodId: 'apha_3120', canonicalUnit: units[0], allowedUnits: [units[0], units[1]], mdl: 0.001, loq: 0.002, decimalPlaces: 4, reportBelowMdlAs: '<MDL' },
  
  // Hydrocarbons
  { id: 'hc_og_water', parameterId: 'oil_grease', matrixId: 'surface_water', methodId: 'epa_8015', canonicalUnit: units[0], allowedUnits: [units[0]], mdl: 0.10, loq: 0.5, decimalPlaces: 2, reportBelowMdlAs: '<MDL' },
  { id: 'hc_tph_water', parameterId: 'tph', matrixId: 'surface_water', methodId: 'epa_8015', canonicalUnit: units[0], allowedUnits: [units[0]], mdl: 0.01, loq: 0.05, decimalPlaces: 2, reportBelowMdlAs: '<MDL' },
  { id: 'hc_pahs_water', parameterId: 'pahs', matrixId: 'surface_water', methodId: 'epa_8270', canonicalUnit: units[0], allowedUnits: [units[0]], mdl: 0.001, loq: 0.005, decimalPlaces: 3, reportBelowMdlAs: '<MDL' },
  
  // Anions
  { id: 'an_nh4_water', parameterId: 'ammonium', matrixId: 'surface_water', methodId: 'apha_4500h', canonicalUnit: units[0], allowedUnits: [units[0]], mdl: 0.017, loq: 0.05, decimalPlaces: 3, reportBelowMdlAs: '<MDL' },
  { id: 'an_no3_water', parameterId: 'nitrate', matrixId: 'surface_water', methodId: 'apha_4500h', canonicalUnit: units[0], allowedUnits: [units[0]], mdl: 0.005, loq: 0.01, decimalPlaces: 3, reportBelowMdlAs: '<MDL' },
  { id: 'an_po4_water', parameterId: 'phosphate', matrixId: 'surface_water', methodId: 'apha_4500h', canonicalUnit: units[0], allowedUnits: [units[0]], mdl: 0.095, loq: 0.2, decimalPlaces: 3, reportBelowMdlAs: '<MDL' },
];

// Test Packages
export const testPackages: TestPackage[] = [
  {
    id: 'pkg_water_physico',
    name: 'Physico-Chemical Water Panel',
    description: 'Standard physico-chemical analysis for surface water samples',
    category: 'wet_chemistry',
    parameterIds: ['ph', 'temp', 'conductivity', 'turbidity', 'do', 'cod', 'bod5', 'tds', 'tss', 'salinity', 'alkalinity', 'redox', 'hardness', 'colour'],
    matrix: ['surface_water', 'wastewater'],
  },
  {
    id: 'pkg_cations_anions',
    name: 'Cations & Anions Panel',
    description: 'Major ions analysis',
    category: 'wet_chemistry',
    parameterIds: ['ammonium', 'chloride', 'phosphate', 'sulphate', 'nitrate', 'carbonate', 'calcium', 'magnesium', 'potassium', 'sodium'],
    matrix: ['surface_water', 'wastewater'],
  },
  {
    id: 'pkg_heavy_metals',
    name: 'Heavy Metals Panel',
    description: 'Comprehensive heavy metals analysis by ICP/AAS',
    category: 'instrumentation',
    parameterIds: ['cadmium', 'zinc', 'iron', 'copper', 'chromium', 'nickel', 'lead', 'vanadium', 'arsenic', 'mercury', 'barium', 'manganese', 'cobalt'],
    matrix: ['water', 'wastewater', 'sediment', 'soil'],
  },
  {
    id: 'pkg_hydrocarbons',
    name: 'Hydrocarbons Panel',
    description: 'Oil, grease, TPH, PAHs analysis',
    category: 'instrumentation',
    parameterIds: ['oil_grease', 'thc', 'tph', 'pahs', 'btex', 'phenols'],
    matrix: ['water', 'wastewater', 'sediment', 'soil'],
  },
  {
    id: 'pkg_microbiology',
    name: 'Microbiology Panel',
    description: 'Bacterial and fungal enumeration',
    category: 'microbiology',
    parameterIds: ['thb', 'tf', 'hub', 'huf', 'srb'],
    matrix: ['water', 'wastewater', 'sediment'],
  },
  {
    id: 'pkg_sediment_full',
    name: 'Full Sediment Analysis',
    description: 'Complete sediment characterization including physico-chemical, metals, and hydrocarbons',
    category: 'instrumentation',
    parameterIds: ['ph', 'conductivity', 'temp', 'redox', 'salinity', 'toc', 'cadmium', 'zinc', 'iron', 'copper', 'lead', 'tph', 'pahs'],
    matrix: ['sediment', 'soil'],
  },
];

// Clients
export const clients: Client[] = [
  {
    id: 'client_seplat',
    name: 'Seplat Energy Producing Nigeria Unlimited',
    contactName: 'Project Manager',
    email: 'projects@seplatenergy.com',
    phone: '+234 1 277 9600',
    address: 'Seplat House, 1 Lekki Expressway, Victoria Island, Lagos, Nigeria',
  },
  {
    id: 'client_shell',
    name: 'Shell Petroleum Development Company',
    contactName: 'Environmental Manager',
    email: 'environment@shell.com.ng',
    address: 'Port Harcourt, Rivers State, Nigeria',
  },
  {
    id: 'client_total',
    name: 'TotalEnergies Nigeria',
    contactName: 'HSE Coordinator',
    email: 'hse@totalenergies.ng',
    address: 'Victoria Island, Lagos, Nigeria',
  },
];

// Projects
export const projects: Project[] = [
  {
    id: 'proj_yoho_ees',
    code: 'TPI/2026/SEPNU/004',
    title: 'Environmental Evaluation Study (EES) of Yoho Area Operations',
    clientId: 'client_seplat',
    status: 'active',
    sampleCollectionDate: '2025-08-08',
    sampleReceiptDate: '2025-08-25',
    analysisStartDate: '2025-08-25',
    analysisEndDate: '2025-10-31',
    resultsIssuedDate: '2026-01-09',
    location: 'Yoho Area, Niger Delta',
    notes: 'Surface water (55 + 9 controls), Sediment (48 + 3 controls), Benthos (54 + 3 controls), Planktons (39 + 3 controls)',
    createdAt: '2025-08-20T10:00:00Z',
    updatedAt: '2026-01-09T14:30:00Z',
  },
  {
    id: 'proj_baseline_2026',
    code: 'TPI/2026/SHELL/001',
    title: 'Baseline Environmental Study - Ogoni Cleanup Phase 3',
    clientId: 'client_shell',
    status: 'active',
    sampleCollectionDate: '2026-01-10',
    sampleReceiptDate: '2026-01-12',
    analysisStartDate: '2026-01-12',
    location: 'Ogoniland, Rivers State',
    createdAt: '2026-01-08T09:00:00Z',
    updatedAt: '2026-01-15T11:00:00Z',
  },
];

// Samples
export const samples: Sample[] = [
  {
    id: 'smp_yb1_top',
    projectId: 'proj_yoho_ees',
    sampleId: 'YB1 (top)',
    fieldId: 'YB-001-T',
    matrix: 'water',
    sampleType: 'grab',
    collectionDate: '2025-08-08',
    collectionTime: '09:30',
    location: 'YOHO YB - 200m',
    depth: 'Surface (0-0.5m)',
    status: 'approved',
    assignedTests: ['pkg_water_physico', 'pkg_cations_anions', 'pkg_heavy_metals', 'pkg_hydrocarbons', 'pkg_microbiology'],
  },
  {
    id: 'smp_yb1_mid',
    projectId: 'proj_yoho_ees',
    sampleId: 'YB1 (mid)',
    fieldId: 'YB-001-M',
    matrix: 'water',
    sampleType: 'grab',
    collectionDate: '2025-08-08',
    collectionTime: '09:35',
    location: 'YOHO YB - 200m',
    depth: 'Middle (2-3m)',
    status: 'approved',
    assignedTests: ['pkg_water_physico', 'pkg_cations_anions', 'pkg_heavy_metals', 'pkg_hydrocarbons', 'pkg_microbiology'],
  },
  {
    id: 'smp_yb1_bottom',
    projectId: 'proj_yoho_ees',
    sampleId: 'YB1 (bottom)',
    fieldId: 'YB-001-B',
    matrix: 'water',
    sampleType: 'grab',
    collectionDate: '2025-08-08',
    collectionTime: '09:40',
    location: 'YOHO YB - 200m',
    depth: 'Bottom (5-6m)',
    status: 'pending_review',
    assignedTests: ['pkg_water_physico', 'pkg_cations_anions', 'pkg_heavy_metals', 'pkg_hydrocarbons', 'pkg_microbiology'],
  },
  {
    id: 'smp_cp1_top',
    projectId: 'proj_yoho_ees',
    sampleId: 'CP1 (top)',
    fieldId: 'CP-001-T',
    matrix: 'water',
    sampleType: 'grab',
    collectionDate: '2025-08-10',
    collectionTime: '08:00',
    location: 'Control Point - 6,000m',
    depth: 'Surface',
    status: 'approved',
    assignedTests: ['pkg_water_physico', 'pkg_cations_anions', 'pkg_heavy_metals', 'pkg_hydrocarbons', 'pkg_microbiology'],
  },
  {
    id: 'smp_sed_yb1',
    projectId: 'proj_yoho_ees',
    sampleId: 'YB1-SED',
    fieldId: 'YB-001-SED',
    matrix: 'sediment',
    sampleType: 'grab',
    collectionDate: '2025-08-08',
    collectionTime: '10:00',
    location: 'YOHO YB - 200m',
    status: 'pending_review',
    assignedTests: ['pkg_sediment_full', 'pkg_microbiology'],
  },
];

// Dashboard stats
export const dashboardStats: DashboardStats = {
  activeProjects: 2,
  pendingSamples: 156,
  validationErrors: 3,
  pendingApprovals: 24,
  samplesThisWeek: 45,
  completedThisMonth: 312,
};

// Sample results for the batch entry grid (based on actual report data)
export const sampleResultsData = [
  {
    sampleId: 'YB1 (top)',
    results: {
      ph: { value: '8.39', qualifier: '', isBelowMdl: false },
      temp: { value: '25.9', qualifier: '', isBelowMdl: false },
      conductivity: { value: '45100', qualifier: '', isBelowMdl: false },
      turbidity: { value: '0.1', qualifier: '', isBelowMdl: false },
      do: { value: '7.56', qualifier: '', isBelowMdl: false },
      cod: { value: '4.00', qualifier: '', isBelowMdl: false },
      bod5: { value: '1.71', qualifier: '', isBelowMdl: false },
      tds: { value: '30200', qualifier: '', isBelowMdl: false },
      tss: { value: '1.00', qualifier: '', isBelowMdl: false },
      salinity: { value: '28.8', qualifier: '', isBelowMdl: false },
      alkalinity: { value: '130', qualifier: '', isBelowMdl: false },
      redox: { value: '140', qualifier: '', isBelowMdl: false },
      hardness: { value: '3700', qualifier: '', isBelowMdl: false },
      colour: { value: '1.00', qualifier: '', isBelowMdl: false },
    }
  },
  {
    sampleId: 'YB1 (mid)',
    results: {
      ph: { value: '8.33', qualifier: '', isBelowMdl: false },
      temp: { value: '25.6', qualifier: '', isBelowMdl: false },
      conductivity: { value: '44800', qualifier: '', isBelowMdl: false },
      turbidity: { value: '0.1', qualifier: '', isBelowMdl: false },
      do: { value: '7.42', qualifier: '', isBelowMdl: false },
      cod: { value: '3.80', qualifier: '', isBelowMdl: false },
      bod5: { value: '1.64', qualifier: '', isBelowMdl: false },
      tds: { value: '30000', qualifier: '', isBelowMdl: false },
      tss: { value: '1.00', qualifier: '', isBelowMdl: false },
      salinity: { value: '28.5', qualifier: '', isBelowMdl: false },
      alkalinity: { value: '140', qualifier: '', isBelowMdl: false },
      redox: { value: '143', qualifier: '', isBelowMdl: false },
      hardness: { value: '3520', qualifier: '', isBelowMdl: false },
      colour: { value: '1.00', qualifier: '', isBelowMdl: false },
    }
  },
  {
    sampleId: 'YB1 (bottom)',
    results: {
      ph: { value: '8.29', qualifier: '', isBelowMdl: false },
      temp: { value: '25.3', qualifier: '', isBelowMdl: false },
      conductivity: { value: '44600', qualifier: '', isBelowMdl: false },
      turbidity: { value: '0.1', qualifier: '', isBelowMdl: false },
      do: { value: '7.34', qualifier: '', isBelowMdl: false },
      cod: { value: '3.70', qualifier: '', isBelowMdl: false },
      bod5: { value: '1.59', qualifier: '', isBelowMdl: false },
      tds: { value: '29700', qualifier: '', isBelowMdl: false },
      tss: { value: '1.00', qualifier: '', isBelowMdl: false },
      salinity: { value: '28.3', qualifier: '', isBelowMdl: false },
      alkalinity: { value: '100', qualifier: '', isBelowMdl: false },
      redox: { value: '145', qualifier: '', isBelowMdl: false },
      hardness: { value: '4445', qualifier: '', isBelowMdl: false },
      colour: { value: '2.00', qualifier: '', isBelowMdl: false },
    }
  },
  {
    sampleId: 'CP1 (top)',
    results: {
      ph: { value: '8.36', qualifier: '', isBelowMdl: false },
      temp: { value: '27.3', qualifier: '', isBelowMdl: false },
      conductivity: { value: '41400', qualifier: '', isBelowMdl: false },
      turbidity: { value: '0.1', qualifier: '', isBelowMdl: false },
      do: { value: '7.34', qualifier: '', isBelowMdl: false },
      cod: { value: '4.70', qualifier: '', isBelowMdl: false },
      bod5: { value: '2.02', qualifier: '', isBelowMdl: false },
      tds: { value: '27700', qualifier: '', isBelowMdl: false },
      tss: { value: '1.00', qualifier: '', isBelowMdl: false },
      salinity: { value: '26.4', qualifier: '', isBelowMdl: false },
      alkalinity: { value: '130', qualifier: '', isBelowMdl: false },
      redox: { value: '140', qualifier: '', isBelowMdl: false },
      hardness: { value: '4070', qualifier: '', isBelowMdl: false },
      colour: { value: '2.00', qualifier: '', isBelowMdl: false },
    }
  },
];

export const cationsAnionsResults = [
  {
    sampleId: 'YB1 (top)',
    results: {
      ammonium: { value: '<0.017', qualifier: '<MDL', isBelowMdl: true },
      chloride: { value: '12900', qualifier: '', isBelowMdl: false },
      phosphate: { value: '<0.095', qualifier: '<MDL', isBelowMdl: true },
      sulphate: { value: '1484', qualifier: '', isBelowMdl: false },
      nitrate: { value: '<0.005', qualifier: '<MDL', isBelowMdl: true },
      carbonate: { value: '40.0', qualifier: '', isBelowMdl: false },
      calcium: { value: '733', qualifier: '', isBelowMdl: false },
      magnesium: { value: '1026', qualifier: '', isBelowMdl: false },
      potassium: { value: '440', qualifier: '', isBelowMdl: false },
      sodium: { value: '11726', qualifier: '', isBelowMdl: false },
    }
  },
];

export const heavyMetalsResults = [
  {
    sampleId: 'YB1 (top)',
    results: {
      cadmium: { value: '0.002', qualifier: '', isBelowMdl: false },
      zinc: { value: '0.240', qualifier: '', isBelowMdl: false },
      iron: { value: '0.343', qualifier: '', isBelowMdl: false },
      copper: { value: '0.115', qualifier: '', isBelowMdl: false },
      chromium: { value: '<0.002', qualifier: '<MDL', isBelowMdl: true },
      nickel: { value: '<0.002', qualifier: '<MDL', isBelowMdl: true },
      lead: { value: '<0.009', qualifier: '<MDL', isBelowMdl: true },
      vanadium: { value: '<0.002', qualifier: '<MDL', isBelowMdl: true },
      arsenic: { value: '<0.001', qualifier: '<MDL', isBelowMdl: true },
      mercury: { value: '<0.001', qualifier: '<MDL', isBelowMdl: true },
      barium: { value: '<0.03', qualifier: '<MDL', isBelowMdl: true },
      manganese: { value: '<0.002', qualifier: '<MDL', isBelowMdl: true },
      cobalt: { value: '<0.002', qualifier: '<MDL', isBelowMdl: true },
    }
  },
];
