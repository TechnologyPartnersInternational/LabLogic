/**
 * Scientific Validation Engine for Environmental Laboratory Results
 * 
 * This module implements cross-parameter validation rules based on
 * established scientific relationships in environmental chemistry.
 */

export interface ValidationResult {
  ruleId: string;
  ruleName: string;
  category: 'hydrocarbons' | 'oxygen_demand' | 'conductivity' | 'nitrogen' | 'solids' | 'ionic_balance' | 'alkalinity' | 'hardness' | 'metals';
  severity: 'warning' | 'info';
  message: string;
  affectedParameters: string[];
  expectedRelationship: string;
  actualValues: Record<string, number | null>;
}

export interface ValidationRuleConfig {
  rule_id: string;
  enabled: boolean;
  thresholds: Record<string, number>;
}

export interface SampleResult {
  parameterId: string;
  parameterName: string;
  abbreviation: string;
  value: number | null;
  unit: string;
  analyteGroup: string;
}

// Parameter abbreviation mappings for validation rules
const PARAM_ABBREV = {
  // Hydrocarbons
  THC: ['THC', 'Total Hydrocarbons'],
  TPH: ['TPH', 'Total Petroleum Hydrocarbons'],
  PAH: ['PAH', 'Polycyclic Aromatic Hydrocarbons'],
  BTEX: ['BTEX', 'Benzene Toluene Ethylbenzene Xylene'],
  
  // Oxygen Demand
  COD: ['COD', 'Chemical Oxygen Demand'],
  BOD5: ['BOD5', 'BOD₅', 'BOD', 'Biological Oxygen Demand'],
  
  // Conductivity/TDS/Salinity
  EC: ['EC', 'Conductivity', 'Electrical Conductivity'],
  TDS: ['TDS', 'Total Dissolved Solids'],
  SALINITY: ['Salinity', 'SAL'],
  
  // Nitrogen Species
  TKN: ['TKN', 'Total Kjeldahl Nitrogen'],
  NH3: ['NH3-N', 'NH₃-N', 'Ammonia', 'NH3', 'Ammonia-Nitrogen'],
  NO3: ['NO3-N', 'NO₃-N', 'Nitrate', 'NO3', 'Nitrate-Nitrogen'],
  NO2: ['NO2-N', 'NO₂-N', 'Nitrite', 'NO2', 'Nitrite-Nitrogen'],
  TN: ['TN', 'Total Nitrogen'],
  
  // Solids
  TS: ['TS', 'Total Solids'],
  TSS: ['TSS', 'Total Suspended Solids'],
  
  // Alkalinity
  ALKALINITY: ['Alkalinity', 'Total Alkalinity', 'Alk'],
  PH: ['pH'],
  
  // Hardness
  TOTAL_HARDNESS: ['Total Hardness', 'TH', 'Hardness'],
  CA_HARDNESS: ['Ca Hardness', 'Calcium Hardness', 'Ca-Hardness'],
  MG_HARDNESS: ['Mg Hardness', 'Magnesium Hardness', 'Mg-Hardness'],
  
  // Metals
  TOTAL_METALS: ['Total Metals'],
  // Individual metals will be matched by analyte group
};

/**
 * Find a parameter value by matching abbreviations
 */
function findParam(results: SampleResult[], aliases: string[]): SampleResult | undefined {
  return results.find(r => 
    aliases.some(alias => 
      r.abbreviation.toLowerCase() === alias.toLowerCase() ||
      r.parameterName.toLowerCase().includes(alias.toLowerCase())
    )
  );
}

/**
 * Get numeric value or null
 */
function getValue(param: SampleResult | undefined): number | null {
  if (!param || param.value === null || param.value === undefined) return null;
  return param.value;
}

/**
 * Hydrocarbon Hierarchy Validation
 * THC ≥ TPH ≥ PAH + BTEX
 */
function validateHydrocarbonHierarchy(results: SampleResult[]): ValidationResult[] {
  const validations: ValidationResult[] = [];
  
  const thc = findParam(results, PARAM_ABBREV.THC);
  const tph = findParam(results, PARAM_ABBREV.TPH);
  const pah = findParam(results, PARAM_ABBREV.PAH);
  const btex = findParam(results, PARAM_ABBREV.BTEX);
  
  const thcVal = getValue(thc);
  const tphVal = getValue(tph);
  const pahVal = getValue(pah);
  const btexVal = getValue(btex);
  
  // THC ≥ TPH
  if (thcVal !== null && tphVal !== null && thcVal < tphVal) {
    validations.push({
      ruleId: 'HC_001',
      ruleName: 'THC ≥ TPH Check',
      category: 'hydrocarbons',
      severity: 'warning',
      message: `Total Hydrocarbons (${thcVal}) should be ≥ Total Petroleum Hydrocarbons (${tphVal})`,
      affectedParameters: [thc!.abbreviation, tph!.abbreviation],
      expectedRelationship: 'THC ≥ TPH',
      actualValues: { THC: thcVal, TPH: tphVal }
    });
  }
  
  // TPH ≥ PAH + BTEX
  if (tphVal !== null && pahVal !== null && btexVal !== null) {
    const sumFractions = pahVal + btexVal;
    if (tphVal < sumFractions) {
      validations.push({
        ruleId: 'HC_002',
        ruleName: 'TPH ≥ PAH + BTEX Check',
        category: 'hydrocarbons',
        severity: 'warning',
        message: `TPH (${tphVal}) should be ≥ PAH + BTEX (${sumFractions.toFixed(2)})`,
        affectedParameters: [tph!.abbreviation, pah!.abbreviation, btex!.abbreviation],
        expectedRelationship: 'TPH ≥ PAH + BTEX',
        actualValues: { TPH: tphVal, PAH: pahVal, BTEX: btexVal }
      });
    }
  }
  
  return validations;
}

/**
 * Oxygen Demand Validation
 * COD ≥ BOD₅ (always, since COD measures all oxidizable matter)
 * COD/BOD₅ ratio typically 1.5-3.0 for domestic wastewater
 */
function validateOxygenDemand(
  results: SampleResult[],
  thresholds?: { typicalRatioMin?: number; typicalRatioMax?: number }
): ValidationResult[] {
  const validations: ValidationResult[] = [];
  const ratioMin = thresholds?.typicalRatioMin ?? 1.5;
  const ratioMax = thresholds?.typicalRatioMax ?? 4.0;
  
  const cod = findParam(results, PARAM_ABBREV.COD);
  const bod = findParam(results, PARAM_ABBREV.BOD5);
  
  const codVal = getValue(cod);
  const bodVal = getValue(bod);
  
  if (codVal !== null && bodVal !== null) {
    // COD must be ≥ BOD
    if (codVal < bodVal) {
      validations.push({
        ruleId: 'OD_001',
        ruleName: 'COD ≥ BOD₅ Check',
        category: 'oxygen_demand',
        severity: 'warning',
        message: `COD (${codVal}) should always be ≥ BOD₅ (${bodVal}). COD measures all oxidizable matter while BOD only measures biodegradable.`,
        affectedParameters: [cod!.abbreviation, bod!.abbreviation],
        expectedRelationship: 'COD ≥ BOD₅',
        actualValues: { COD: codVal, BOD5: bodVal }
      });
    }
    
    // Check ratio (informational if outside typical range)
    if (bodVal > 0) {
      const ratio = codVal / bodVal;
      if (ratio < ratioMin || ratio > 10) {
        validations.push({
          ruleId: 'OD_002',
          ruleName: 'COD/BOD₅ Ratio Check',
          category: 'oxygen_demand',
          severity: 'info',
          message: `COD/BOD₅ ratio is ${ratio.toFixed(2)}. Typical range for wastewater is ${ratioMin}-${ratioMax}. Values outside this may indicate industrial discharge or non-biodegradable contaminants.`,
          affectedParameters: [cod!.abbreviation, bod!.abbreviation],
          expectedRelationship: `COD/BOD₅ ratio ${ratioMin}-${ratioMax}`,
          actualValues: { COD: codVal, BOD5: bodVal, Ratio: ratio }
        });
      }
    }
  }
  
  return validations;
}

/**
 * Conductivity/TDS/Salinity Relationships
 * TDS ≈ 0.5-0.7 × Conductivity (empirical relationship)
 */
function validateConductivityRelationships(
  results: SampleResult[],
  thresholds?: { ratioMin?: number; ratioMax?: number }
): ValidationResult[] {
  const validations: ValidationResult[] = [];
  const expectedMin = thresholds?.ratioMin ?? 0.5;
  const expectedMax = thresholds?.ratioMax ?? 0.75;
  
  const ec = findParam(results, PARAM_ABBREV.EC);
  const tds = findParam(results, PARAM_ABBREV.TDS);
  
  const ecVal = getValue(ec);
  const tdsVal = getValue(tds);
  
  if (ecVal !== null && tdsVal !== null && ecVal > 0) {
    const ratio = tdsVal / ecVal;
    
    if (ratio < expectedMin || ratio > expectedMax) {
      validations.push({
        ruleId: 'EC_001',
        ruleName: 'TDS/Conductivity Ratio Check',
        category: 'conductivity',
        severity: 'warning',
        message: `TDS/EC ratio is ${ratio.toFixed(3)}. Expected range is ${expectedMin}-${expectedMax}. Current TDS (${tdsVal}) vs EC (${ecVal}).`,
        affectedParameters: [tds!.abbreviation, ec!.abbreviation],
        expectedRelationship: `TDS/EC ratio ${expectedMin}-${expectedMax}`,
        actualValues: { TDS: tdsVal, EC: ecVal, Ratio: ratio }
      });
    }
  }
  
  return validations;
}

/**
 * Nitrogen Species Validation
 * TKN ≥ NH₃-N (Total Kjeldahl Nitrogen includes ammonia)
 * Total N ≥ TKN + NO₃-N + NO₂-N
 */
function validateNitrogenSpecies(results: SampleResult[]): ValidationResult[] {
  const validations: ValidationResult[] = [];
  
  const tkn = findParam(results, PARAM_ABBREV.TKN);
  const nh3 = findParam(results, PARAM_ABBREV.NH3);
  const no3 = findParam(results, PARAM_ABBREV.NO3);
  const no2 = findParam(results, PARAM_ABBREV.NO2);
  const tn = findParam(results, PARAM_ABBREV.TN);
  
  const tknVal = getValue(tkn);
  const nh3Val = getValue(nh3);
  const no3Val = getValue(no3);
  const no2Val = getValue(no2);
  const tnVal = getValue(tn);
  
  // TKN ≥ NH₃-N
  if (tknVal !== null && nh3Val !== null && tknVal < nh3Val) {
    validations.push({
      ruleId: 'N_001',
      ruleName: 'TKN ≥ NH₃-N Check',
      category: 'nitrogen',
      severity: 'warning',
      message: `TKN (${tknVal}) should be ≥ NH₃-N (${nh3Val}). TKN includes organic nitrogen and ammonia.`,
      affectedParameters: [tkn!.abbreviation, nh3!.abbreviation],
      expectedRelationship: 'TKN ≥ NH₃-N',
      actualValues: { TKN: tknVal, 'NH3-N': nh3Val }
    });
  }
  
  // Total N ≥ sum of species
  if (tnVal !== null) {
    let speciesSum = 0;
    const components: string[] = [];
    
    if (tknVal !== null) { speciesSum += tknVal; components.push('TKN'); }
    if (no3Val !== null) { speciesSum += no3Val; components.push('NO₃-N'); }
    if (no2Val !== null) { speciesSum += no2Val; components.push('NO₂-N'); }
    
    if (components.length >= 2 && tnVal < speciesSum * 0.9) { // 10% tolerance
      validations.push({
        ruleId: 'N_002',
        ruleName: 'Total N Balance Check',
        category: 'nitrogen',
        severity: 'warning',
        message: `Total Nitrogen (${tnVal}) should be ≥ sum of nitrogen species (${speciesSum.toFixed(2)}). Components: ${components.join(' + ')}.`,
        affectedParameters: [tn!.abbreviation, ...components],
        expectedRelationship: 'TN ≥ TKN + NO₃-N + NO₂-N',
        actualValues: { TN: tnVal, 'Species Sum': speciesSum }
      });
    }
  }
  
  return validations;
}

/**
 * Solids Relationships Validation
 * TS = TSS + TDS (within tolerance)
 */
function validateSolidsRelationships(
  results: SampleResult[],
  thresholds?: { tolerancePercent?: number }
): ValidationResult[] {
  const validations: ValidationResult[] = [];
  const tolerance = (thresholds?.tolerancePercent ?? 15) / 100;
  
  const ts = findParam(results, PARAM_ABBREV.TS);
  const tss = findParam(results, PARAM_ABBREV.TSS);
  const tds = findParam(results, PARAM_ABBREV.TDS);
  
  const tsVal = getValue(ts);
  const tssVal = getValue(tss);
  const tdsVal = getValue(tds);
  
  if (tsVal !== null && tssVal !== null && tdsVal !== null) {
    const calculatedTS = tssVal + tdsVal;
    const diff = Math.abs(tsVal - calculatedTS);
    
    if (diff > tsVal * tolerance) {
      validations.push({
        ruleId: 'S_001',
        ruleName: 'TS = TSS + TDS Check',
        category: 'solids',
        severity: 'warning',
        message: `Total Solids (${tsVal}) should equal TSS + TDS (${calculatedTS.toFixed(2)}). Difference: ${diff.toFixed(2)} (${((diff/tsVal)*100).toFixed(1)}%)`,
        affectedParameters: [ts!.abbreviation, tss!.abbreviation, tds!.abbreviation],
        expectedRelationship: `TS = TSS + TDS (±${(tolerance * 100).toFixed(0)}%)`,
        actualValues: { TS: tsVal, TSS: tssVal, TDS: tdsVal, 'Calculated TS': calculatedTS }
      });
    }
  }
  
  return validations;
}

/**
 * Alkalinity/pH Validation
 * If pH < 4.5, Alkalinity should be approximately 0
 */
function validateAlkalinityPH(
  results: SampleResult[],
  thresholds?: { lowPhThreshold?: number; highAlkalinityThreshold?: number }
): ValidationResult[] {
  const validations: ValidationResult[] = [];
  const lowPhThreshold = thresholds?.lowPhThreshold ?? 4.5;
  const highAlkThreshold = thresholds?.highAlkalinityThreshold ?? 50;
  
  const alk = findParam(results, PARAM_ABBREV.ALKALINITY);
  const ph = findParam(results, PARAM_ABBREV.PH);
  
  const alkVal = getValue(alk);
  const phVal = getValue(ph);
  
  if (alkVal !== null && phVal !== null) {
    // At pH < 4.5, all carbonate species should be converted to CO2
    if (phVal < lowPhThreshold && alkVal > 5) { // Small threshold for measurement error
      validations.push({
        ruleId: 'ALK_001',
        ruleName: 'Low pH Alkalinity Check',
        category: 'alkalinity',
        severity: 'warning',
        message: `At pH ${phVal}, alkalinity should be near zero. Found ${alkVal} mg/L CaCO₃. At pH < ${lowPhThreshold}, carbonate species are converted to CO₂.`,
        affectedParameters: [alk!.abbreviation, ph!.abbreviation],
        expectedRelationship: `pH < ${lowPhThreshold} → Alkalinity ≈ 0`,
        actualValues: { pH: phVal, Alkalinity: alkVal }
      });
    }
    
    // High alkalinity with low pH is also suspicious
    if (phVal < 6 && alkVal > highAlkThreshold) {
      validations.push({
        ruleId: 'ALK_002',
        ruleName: 'Alkalinity/pH Consistency Check',
        category: 'alkalinity',
        severity: 'info',
        message: `High alkalinity (${alkVal}) with low pH (${phVal}) is unusual. Verify sample collection and analysis.`,
        affectedParameters: [alk!.abbreviation, ph!.abbreviation],
        expectedRelationship: 'High alkalinity → Higher pH expected',
        actualValues: { pH: phVal, Alkalinity: alkVal }
      });
    }
  }
  
  return validations;
}

/**
 * Hardness Validation
 * Total Hardness ≈ Ca Hardness + Mg Hardness
 */
function validateHardness(
  results: SampleResult[],
  thresholds?: { tolerancePercent?: number }
): ValidationResult[] {
  const validations: ValidationResult[] = [];
  const tolerance = (thresholds?.tolerancePercent ?? 10) / 100;
  
  const th = findParam(results, PARAM_ABBREV.TOTAL_HARDNESS);
  const caH = findParam(results, PARAM_ABBREV.CA_HARDNESS);
  const mgH = findParam(results, PARAM_ABBREV.MG_HARDNESS);
  
  const thVal = getValue(th);
  const caHVal = getValue(caH);
  const mgHVal = getValue(mgH);
  
  if (thVal !== null && caHVal !== null && mgHVal !== null) {
    const calculatedTH = caHVal + mgHVal;
    const diff = Math.abs(thVal - calculatedTH);
    
    if (diff > thVal * tolerance && thVal > 10) { // Skip check for very low hardness
      validations.push({
        ruleId: 'H_001',
        ruleName: 'Total Hardness = Ca + Mg Check',
        category: 'hardness',
        severity: 'warning',
        message: `Total Hardness (${thVal}) should equal Ca + Mg Hardness (${calculatedTH.toFixed(2)}). Difference: ${diff.toFixed(2)}`,
        affectedParameters: [th!.abbreviation, caH!.abbreviation, mgH!.abbreviation],
        expectedRelationship: `Total Hardness = Ca Hardness + Mg Hardness (±${(tolerance * 100).toFixed(0)}%)`,
        actualValues: { 'Total Hardness': thVal, 'Ca Hardness': caHVal, 'Mg Hardness': mgHVal }
      });
    }
  }
  
  return validations;
}

/**
 * Ionic Balance Validation (Cation-Anion Balance)
 * The sum of cation equivalents should approximately equal anion equivalents
 * Acceptable error: ±5% for TDS > 100, ±10% for lower TDS
 */
function validateIonicBalance(
  results: SampleResult[],
  thresholds?: { warningThresholdPercent?: number; errorThresholdPercent?: number }
): ValidationResult[] {
  const validations: ValidationResult[] = [];
  const warningThreshold = thresholds?.warningThresholdPercent ?? 10;
  const errorThreshold = thresholds?.errorThresholdPercent ?? 15;
  
  // Define ionic species with their equivalent weights (mg/meq)
  const cations = [
    { aliases: ['Ca', 'Calcium', 'Ca2+'], eqWeight: 20.04 },
    { aliases: ['Mg', 'Magnesium', 'Mg2+'], eqWeight: 12.15 },
    { aliases: ['Na', 'Sodium', 'Na+'], eqWeight: 22.99 },
    { aliases: ['K', 'Potassium', 'K+'], eqWeight: 39.10 },
  ];
  
  const anions = [
    { aliases: ['Cl', 'Chloride', 'Cl-'], eqWeight: 35.45 },
    { aliases: ['SO4', 'SO₄²⁻', 'Sulfate', 'Sulphate'], eqWeight: 48.03 },
    { aliases: ['HCO3', 'HCO₃⁻', 'Bicarbonate'], eqWeight: 61.02 },
    { aliases: ['CO3', 'CO₃²⁻', 'Carbonate'], eqWeight: 30.00 },
    { aliases: ['NO3', 'NO₃⁻', 'Nitrate'], eqWeight: 62.00 },
  ];
  
  let cationSum = 0;
  let anionSum = 0;
  const foundCations: string[] = [];
  const foundAnions: string[] = [];
  
  // Calculate cation meq/L
  for (const cation of cations) {
    const param = findParam(results, cation.aliases);
    const val = getValue(param);
    if (val !== null && param) {
      cationSum += val / cation.eqWeight;
      foundCations.push(param.abbreviation);
    }
  }
  
  // Calculate anion meq/L
  for (const anion of anions) {
    const param = findParam(results, anion.aliases);
    const val = getValue(param);
    if (val !== null && param) {
      anionSum += val / anion.eqWeight;
      foundAnions.push(param.abbreviation);
    }
  }
  
  // Only validate if we have at least 2 of each
  if (foundCations.length >= 2 && foundAnions.length >= 2) {
    const total = cationSum + anionSum;
    const diff = Math.abs(cationSum - anionSum);
    const percentError = total > 0 ? (diff / total) * 200 : 0; // Percentage difference
    
    const tds = findParam(results, PARAM_ABBREV.TDS);
    const tdsVal = getValue(tds);
    const threshold = (tdsVal !== null && tdsVal > 100) ? warningThreshold / 2 : warningThreshold;
    
    if (percentError > threshold) {
      validations.push({
        ruleId: 'ION_001',
        ruleName: 'Cation-Anion Balance Check',
        category: 'ionic_balance',
        severity: percentError > errorThreshold ? 'warning' : 'info',
        message: `Ionic balance error: ${percentError.toFixed(1)}% (threshold: ±${threshold}%). Cations: ${cationSum.toFixed(3)} meq/L, Anions: ${anionSum.toFixed(3)} meq/L.`,
        affectedParameters: [...foundCations, ...foundAnions],
        expectedRelationship: `Σ Cations ≈ Σ Anions (±${threshold}%)`,
        actualValues: { 
          'Cations (meq/L)': cationSum, 
          'Anions (meq/L)': anionSum,
          'Error %': percentError 
        }
      });
    }
  }
  
  return validations;
}

/**
 * Main validation function - runs all applicable validations
 * Accepts optional configs to enable/disable rules and adjust thresholds
 */
export function validateSampleResults(
  results: SampleResult[], 
  configs?: Record<string, ValidationRuleConfig>
): ValidationResult[] {
  const allValidations: ValidationResult[] = [];
  
  // Helper to check if rule is enabled
  const isEnabled = (ruleId: string): boolean => {
    if (!configs) return true; // Default to enabled if no configs
    return configs[ruleId]?.enabled ?? true;
  };
  
  // Helper to get threshold value
  const getThreshold = (ruleId: string, key: string, defaultValue: number): number => {
    if (!configs) return defaultValue;
    return configs[ruleId]?.thresholds?.[key] ?? defaultValue;
  };
  
  // Run all validation categories (only if enabled)
  if (isEnabled('hydrocarbon_hierarchy')) {
    allValidations.push(...validateHydrocarbonHierarchy(results));
  }
  if (isEnabled('cod_bod_ratio')) {
    allValidations.push(...validateOxygenDemand(results, {
      typicalRatioMin: getThreshold('cod_bod_ratio', 'typical_ratio_min', 1.5),
      typicalRatioMax: getThreshold('cod_bod_ratio', 'typical_ratio_max', 4.0),
    }));
  }
  if (isEnabled('tds_conductivity')) {
    allValidations.push(...validateConductivityRelationships(results, {
      ratioMin: getThreshold('tds_conductivity', 'ratio_min', 0.5),
      ratioMax: getThreshold('tds_conductivity', 'ratio_max', 0.75),
    }));
  }
  if (isEnabled('nitrogen_species')) {
    allValidations.push(...validateNitrogenSpecies(results));
  }
  if (isEnabled('solids_balance')) {
    allValidations.push(...validateSolidsRelationships(results, {
      tolerancePercent: getThreshold('solids_balance', 'tolerance_percent', 15),
    }));
  }
  if (isEnabled('alkalinity_ph')) {
    allValidations.push(...validateAlkalinityPH(results, {
      lowPhThreshold: getThreshold('alkalinity_ph', 'low_ph_threshold', 4.5),
      highAlkalinityThreshold: getThreshold('alkalinity_ph', 'high_alkalinity_threshold', 50),
    }));
  }
  if (isEnabled('hardness_balance')) {
    allValidations.push(...validateHardness(results, {
      tolerancePercent: getThreshold('hardness_balance', 'tolerance_percent', 10),
    }));
  }
  if (isEnabled('ionic_balance')) {
    allValidations.push(...validateIonicBalance(results, {
      warningThresholdPercent: getThreshold('ionic_balance', 'warning_threshold_percent', 10),
      errorThresholdPercent: getThreshold('ionic_balance', 'error_threshold_percent', 15),
    }));
  }
  
  return allValidations;
}

/**
 * Get validation category label for UI display
 */
export function getCategoryLabel(category: ValidationResult['category']): string {
  const labels: Record<ValidationResult['category'], string> = {
    hydrocarbons: 'Hydrocarbon Hierarchy',
    oxygen_demand: 'Oxygen Demand',
    conductivity: 'Conductivity/TDS',
    nitrogen: 'Nitrogen Species',
    solids: 'Solids Balance',
    ionic_balance: 'Ionic Balance',
    alkalinity: 'Alkalinity/pH',
    hardness: 'Hardness',
    metals: 'Metals',
  };
  return labels[category] || category;
}

/**
 * Get validation category icon name for UI
 */
export function getCategoryIcon(category: ValidationResult['category']): string {
  const icons: Record<ValidationResult['category'], string> = {
    hydrocarbons: 'Fuel',
    oxygen_demand: 'Activity',
    conductivity: 'Zap',
    nitrogen: 'Atom',
    solids: 'Layers',
    ionic_balance: 'Scale',
    alkalinity: 'TestTube',
    hardness: 'Diamond',
    metals: 'Gem',
  };
  return icons[category] || 'AlertTriangle';
}
