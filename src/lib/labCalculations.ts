/**
 * Automated Calculation Engine for Environmental Laboratory Analysis
 * 
 * Computes derived parameters from entered lab results in real-time.
 * All formulas follow standard environmental chemistry references.
 */

export interface CalculationRule {
  id: string;
  name: string;
  category: 'water_quality' | 'nitrogen' | 'solids' | 'ionic_balance' | 'alkalinity';
  formulaDescription: string;
  inputParams: string[];   // abbreviation aliases
  outputParam: string;     // target abbreviation
  outputUnit: string;
  decimalPlaces: number;
  calculate: (inputs: Record<string, number>) => number | null;
}

export interface CalculatedValue {
  ruleId: string;
  ruleName: string;
  category: string;
  outputParam: string;
  outputUnit: string;
  value: number;
  formulaDescription: string;
  inputValues: Record<string, number>;
  decimalPlaces: number;
}

// Abbreviation alias map — reuses patterns from scientificValidation.ts
const PARAM_ALIASES: Record<string, string[]> = {
  Ca: ['Ca', 'Calcium', 'Ca2+'],
  Mg: ['Mg', 'Magnesium', 'Mg2+'],
  Na: ['Na', 'Sodium', 'Na+'],
  K: ['K', 'Potassium', 'K+'],
  Cl: ['Cl', 'Chloride', 'Cl-'],
  SO4: ['SO4', 'SO₄²⁻', 'Sulfate', 'Sulphate'],
  HCO3: ['HCO3', 'HCO₃⁻', 'Bicarbonate'],
  CO3: ['CO3', 'CO₃²⁻', 'Carbonate'],
  EC: ['EC', 'Conductivity', 'Electrical Conductivity'],
  TDS: ['TDS', 'Total Dissolved Solids'],
  pH: ['pH'],
  Temperature: ['Temperature', 'Temp', 'T'],
  Alkalinity: ['Alkalinity', 'Total Alkalinity', 'Alk'],
  TKN: ['TKN', 'Total Kjeldahl Nitrogen'],
  'NH3-N': ['NH3-N', 'NH₃-N', 'Ammonia', 'NH3', 'Ammonia-Nitrogen'],
  'NO3-N': ['NO3-N', 'NO₃-N', 'Nitrate', 'NO3', 'Nitrate-Nitrogen'],
  'NO2-N': ['NO2-N', 'NO₂-N', 'Nitrite', 'NO2', 'Nitrite-Nitrogen'],
  TS: ['TS', 'Total Solids'],
  TSS: ['TSS', 'Total Suspended Solids'],
  'Total Hardness': ['Total Hardness', 'TH', 'Hardness'],
  'Ca Hardness': ['Ca Hardness', 'Calcium Hardness', 'Ca-Hardness'],
  'Mg Hardness': ['Mg Hardness', 'Magnesium Hardness', 'Mg-Hardness'],
};

// Equivalent weights for meq/L conversions
const EQ_WEIGHTS = {
  Ca: 20.04,
  Mg: 12.15,
  Na: 22.99,
  K: 39.10,
  Cl: 35.45,
  SO4: 48.03,
  HCO3: 61.02,
  CO3: 30.00,
};

// ===== Calculation Rules Registry =====

export const CALCULATION_RULES: CalculationRule[] = [
  // --- Water Quality Index ---
  {
    id: 'CALC_TH',
    name: 'Total Hardness',
    category: 'water_quality',
    formulaDescription: '2.497 × Ca + 4.118 × Mg',
    inputParams: ['Ca', 'Mg'],
    outputParam: 'Total Hardness',
    outputUnit: 'mg/L as CaCO₃',
    decimalPlaces: 1,
    calculate: (inputs) => 2.497 * inputs.Ca + 4.118 * inputs.Mg,
  },
  {
    id: 'CALC_CA_H',
    name: 'Calcium Hardness',
    category: 'water_quality',
    formulaDescription: '2.497 × Ca',
    inputParams: ['Ca'],
    outputParam: 'Ca Hardness',
    outputUnit: 'mg/L as CaCO₃',
    decimalPlaces: 1,
    calculate: (inputs) => 2.497 * inputs.Ca,
  },
  {
    id: 'CALC_MG_H',
    name: 'Magnesium Hardness',
    category: 'water_quality',
    formulaDescription: '4.118 × Mg',
    inputParams: ['Mg'],
    outputParam: 'Mg Hardness',
    outputUnit: 'mg/L as CaCO₃',
    decimalPlaces: 1,
    calculate: (inputs) => 4.118 * inputs.Mg,
  },
  {
    id: 'CALC_TDS_EC',
    name: 'TDS from Conductivity',
    category: 'water_quality',
    formulaDescription: 'EC × 0.65',
    inputParams: ['EC'],
    outputParam: 'TDS',
    outputUnit: 'mg/L',
    decimalPlaces: 0,
    calculate: (inputs) => inputs.EC * 0.65,
  },
  {
    id: 'CALC_SAR',
    name: 'Sodium Adsorption Ratio',
    category: 'water_quality',
    formulaDescription: 'Na(meq/L) / √((Ca(meq/L) + Mg(meq/L)) / 2)',
    inputParams: ['Na', 'Ca', 'Mg'],
    outputParam: 'SAR',
    outputUnit: 'dimensionless',
    decimalPlaces: 2,
    calculate: (inputs) => {
      const naMeq = inputs.Na / EQ_WEIGHTS.Na;
      const caMeq = inputs.Ca / EQ_WEIGHTS.Ca;
      const mgMeq = inputs.Mg / EQ_WEIGHTS.Mg;
      const denom = Math.sqrt((caMeq + mgMeq) / 2);
      if (denom === 0) return null;
      return naMeq / denom;
    },
  },
  {
    id: 'CALC_LSI',
    name: 'Langelier Saturation Index',
    category: 'water_quality',
    formulaDescription: 'pH - pHs (saturation pH)',
    inputParams: ['pH', 'Temperature', 'TDS', 'Ca Hardness', 'Alkalinity'],
    outputParam: 'LSI',
    outputUnit: 'dimensionless',
    decimalPlaces: 2,
    calculate: (inputs) => {
      const pH = inputs.pH;
      const tempC = inputs.Temperature;
      const tds = inputs.TDS;
      const caHardness = inputs['Ca Hardness'];
      const alkalinity = inputs.Alkalinity;

      // Empirical pHs calculation (Langelier method)
      const A = (Math.log10(tds) - 1) / 10;
      const B = -13.12 * Math.log10(tempC + 273) + 34.55;
      const C = Math.log10(caHardness) - 0.4;
      const D = Math.log10(alkalinity);
      const pHs = (9.3 + A + B) - (C + D);
      return pH - pHs;
    },
  },

  // --- Nitrogen Balance ---
  {
    id: 'CALC_ORG_N',
    name: 'Organic Nitrogen',
    category: 'nitrogen',
    formulaDescription: 'TKN - NH₃-N',
    inputParams: ['TKN', 'NH3-N'],
    outputParam: 'Org-N',
    outputUnit: 'mg/L',
    decimalPlaces: 2,
    calculate: (inputs) => {
      const result = inputs.TKN - inputs['NH3-N'];
      return result >= 0 ? result : null;
    },
  },
  {
    id: 'CALC_TN',
    name: 'Total Nitrogen',
    category: 'nitrogen',
    formulaDescription: 'TKN + NO₃-N + NO₂-N',
    inputParams: ['TKN', 'NO3-N', 'NO2-N'],
    outputParam: 'TN',
    outputUnit: 'mg/L',
    decimalPlaces: 2,
    calculate: (inputs) => inputs.TKN + inputs['NO3-N'] + inputs['NO2-N'],
  },

  // --- Solids Balance ---
  {
    id: 'CALC_TDS_CHECK',
    name: 'TDS (Solids Check)',
    category: 'solids',
    formulaDescription: 'TS - TSS',
    inputParams: ['TS', 'TSS'],
    outputParam: 'TDS (calc)',
    outputUnit: 'mg/L',
    decimalPlaces: 0,
    calculate: (inputs) => {
      const result = inputs.TS - inputs.TSS;
      return result >= 0 ? result : null;
    },
  },
  {
    id: 'CALC_TS_CHECK',
    name: 'Total Solids (Check)',
    category: 'solids',
    formulaDescription: 'TSS + TDS',
    inputParams: ['TSS', 'TDS'],
    outputParam: 'TS (calc)',
    outputUnit: 'mg/L',
    decimalPlaces: 0,
    calculate: (inputs) => inputs.TSS + inputs.TDS,
  },

  // --- Ionic Balance ---
  {
    id: 'CALC_ION_BAL',
    name: 'Cation-Anion Balance',
    category: 'ionic_balance',
    formulaDescription: '((Σ cations - Σ anions) / (Σ cations + Σ anions)) × 100',
    inputParams: ['Ca', 'Mg', 'Na', 'K', 'Cl', 'SO4', 'HCO3'],
    outputParam: 'Ion Balance',
    outputUnit: '% error',
    decimalPlaces: 1,
    calculate: (inputs) => {
      const cationSum =
        (inputs.Ca / EQ_WEIGHTS.Ca) +
        (inputs.Mg / EQ_WEIGHTS.Mg) +
        (inputs.Na / EQ_WEIGHTS.Na) +
        (inputs.K / EQ_WEIGHTS.K);
      const anionSum =
        (inputs.Cl / EQ_WEIGHTS.Cl) +
        (inputs.SO4 / EQ_WEIGHTS.SO4) +
        (inputs.HCO3 / EQ_WEIGHTS.HCO3);
      const total = cationSum + anionSum;
      if (total === 0) return null;
      return ((cationSum - anionSum) / total) * 100;
    },
  },

  // --- Alkalinity Speciation ---
  {
    id: 'CALC_BICARB',
    name: 'Bicarbonate Alkalinity',
    category: 'alkalinity',
    formulaDescription: 'pH < 8.3: = Total Alkalinity; pH ≥ 8.3: computed from carbonate equilibrium',
    inputParams: ['pH', 'Alkalinity'],
    outputParam: 'HCO₃ Alk',
    outputUnit: 'mg/L as CaCO₃',
    decimalPlaces: 1,
    calculate: (inputs) => {
      const pH = inputs.pH;
      const alk = inputs.Alkalinity;
      if (pH < 8.3) return alk;
      // Simplified: Bicarbonate = Total Alk - 2 × Carbonate contribution
      // P alkalinity approximation
      const pAlk = alk * (1 - Math.pow(10, pH - 8.3) / (1 + Math.pow(10, pH - 8.3)));
      return alk - 2 * pAlk;
    },
  },
  {
    id: 'CALC_CARB',
    name: 'Carbonate Alkalinity',
    category: 'alkalinity',
    formulaDescription: 'Calculated from pH ≥ 8.3 and Total Alkalinity',
    inputParams: ['pH', 'Alkalinity'],
    outputParam: 'CO₃ Alk',
    outputUnit: 'mg/L as CaCO₃',
    decimalPlaces: 1,
    calculate: (inputs) => {
      const pH = inputs.pH;
      const alk = inputs.Alkalinity;
      if (pH < 8.3) return 0;
      const pAlk = alk * (Math.pow(10, pH - 8.3) / (1 + Math.pow(10, pH - 8.3)));
      return 2 * pAlk;
    },
  },
  {
    id: 'CALC_FREE_CO2',
    name: 'Free CO₂',
    category: 'alkalinity',
    formulaDescription: 'From pH and bicarbonate: CO₂ = HCO₃ × 10^(6.35 - pH) × 44/61',
    inputParams: ['pH', 'Alkalinity'],
    outputParam: 'Free CO₂',
    outputUnit: 'mg/L',
    decimalPlaces: 1,
    calculate: (inputs) => {
      const pH = inputs.pH;
      const alk = inputs.Alkalinity;
      // Bicarbonate in mg/L CaCO3 → convert to mg/L HCO3 (factor × 1.22)
      const hco3MgL = alk * 1.22;
      // Henderson-Hasselbalch: CO2 = HCO3 × 10^(6.35 - pH) × (44/61)
      const co2 = hco3MgL * Math.pow(10, 6.35 - pH) * (44 / 61);
      return co2 > 0 ? co2 : 0;
    },
  },
];

// ===== Engine Functions =====

interface SampleInput {
  abbreviation: string;
  parameterName: string;
  value: number | null;
}

/**
 * Resolve a canonical param key from an abbreviation using aliases
 */
function resolveParamKey(abbreviation: string, parameterName: string): string | null {
  for (const [key, aliases] of Object.entries(PARAM_ALIASES)) {
    if (aliases.some(a => 
      a.toLowerCase() === abbreviation.toLowerCase() ||
      a.toLowerCase() === parameterName.toLowerCase()
    )) {
      return key;
    }
  }
  return null;
}

/**
 * Run all applicable calculations given a set of sample results.
 * Returns calculated values for any rule where all inputs are present.
 */
export function runCalculations(sampleResults: SampleInput[]): CalculatedValue[] {
  // Build a lookup of canonical key → value
  const lookup = new Map<string, number>();
  
  for (const result of sampleResults) {
    if (result.value === null) continue;
    const key = resolveParamKey(result.abbreviation, result.parameterName);
    if (key) {
      lookup.set(key, result.value);
    }
  }

  const calculated: CalculatedValue[] = [];

  for (const rule of CALCULATION_RULES) {
    // Check if all inputs are available
    const inputs: Record<string, number> = {};
    let allPresent = true;

    for (const paramKey of rule.inputParams) {
      const val = lookup.get(paramKey);
      if (val === undefined || val === null) {
        allPresent = false;
        break;
      }
      inputs[paramKey] = val;
    }

    if (!allPresent) continue;

    try {
      const result = rule.calculate(inputs);
      if (result === null || !isFinite(result)) continue;

      const rounded = parseFloat(result.toFixed(rule.decimalPlaces));

      calculated.push({
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        outputParam: rule.outputParam,
        outputUnit: rule.outputUnit,
        value: rounded,
        formulaDescription: rule.formulaDescription,
        inputValues: { ...inputs },
        decimalPlaces: rule.decimalPlaces,
      });
    } catch {
      // Skip failed calculations silently
    }
  }

  return calculated;
}

/**
 * Group calculated values by category for display
 */
export function groupByCategory(values: CalculatedValue[]): Record<string, CalculatedValue[]> {
  return values.reduce((acc, val) => {
    if (!acc[val.category]) acc[val.category] = [];
    acc[val.category].push(val);
    return acc;
  }, {} as Record<string, CalculatedValue[]>);
}

export const CATEGORY_LABELS: Record<string, string> = {
  water_quality: 'Water Quality Index',
  nitrogen: 'Nitrogen Balance',
  solids: 'Solids Balance',
  ionic_balance: 'Ionic Balance',
  alkalinity: 'Alkalinity Speciation',
};
