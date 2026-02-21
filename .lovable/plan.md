
# Automated Calculations for Environmental Laboratory Analysis

## Overview

Add a calculation engine that automatically computes derived parameters from entered lab results in real-time. When an analyst enters raw values (e.g., Calcium and Magnesium concentrations), the system will auto-calculate dependent parameters (e.g., Total Hardness, SAR) and display them inline in the Results Entry grid -- clearly marked as calculated values that analysts can optionally override.

## Calculations to Implement

### 1. Water Quality Index Calculations
| Calculation | Formula | Inputs | Output Unit |
|---|---|---|---|
| **Total Hardness** | 2.497 x Ca + 4.118 x Mg | Ca (mg/L), Mg (mg/L) | mg/L as CaCO3 |
| **Calcium Hardness** | 2.497 x Ca | Ca (mg/L) | mg/L as CaCO3 |
| **Magnesium Hardness** | 4.118 x Mg | Mg (mg/L) | mg/L as CaCO3 |
| **TDS from Conductivity** | EC x conversion factor (0.55-0.70) | EC (uS/cm) | mg/L |
| **Sodium Adsorption Ratio (SAR)** | Na / sqrt((Ca + Mg) / 2) -- all in meq/L | Na, Ca, Mg (mg/L) | dimensionless |
| **Langelier Saturation Index (LSI)** | pH - pHs (saturation pH) | pH, Temperature, TDS, Ca Hardness, Alkalinity | dimensionless |

### 2. Nitrogen Balance
| Calculation | Formula | Inputs |
|---|---|---|
| **Organic Nitrogen** | TKN - NH3-N | TKN, NH3-N |
| **Total Nitrogen** | TKN + NO3-N + NO2-N | TKN, NO3-N, NO2-N |

### 3. Solids Balance
| Calculation | Formula | Inputs |
|---|---|---|
| **Total Dissolved Solids (check)** | TS - TSS | TS, TSS |
| **Total Solids (check)** | TSS + TDS | TSS, TDS |

### 4. Ionic Balance
| Calculation | Formula | Output |
|---|---|---|
| **Cation-Anion Balance %** | ((sum cations - sum anions) / (sum cations + sum anions)) x 100 | % error |

### 5. Alkalinity Speciation (from pH and Total Alkalinity)
| Calculation | Condition | Formula |
|---|---|---|
| **Bicarbonate Alkalinity** | pH < 8.3 | = Total Alkalinity |
| **Carbonate Alkalinity** | pH >= 8.3 | Calculated from carbonate equilibrium |
| **Free CO2** | All | From pH and bicarbonate concentration |

---

## Architecture

### New Files
- `src/lib/labCalculations.ts` -- Pure calculation engine with all formulas, input/output definitions, and a registry of all calculation rules
- `src/hooks/useLabCalculations.ts` -- React hook that watches entered results and returns computed values
- `src/components/results/CalculatedResultsPanel.tsx` -- UI panel showing auto-calculated values grouped by category, with visual distinction from manually entered values

### Modified Files
- `src/components/results/ResultsEntryGrid.tsx` -- Integrate calculated values as read-only cells in the grid (highlighted with a distinct "calculated" badge/color), and allow analysts to override with a manual entry
- `src/lib/scientificValidation.ts` -- Import calculated values so validations can also run against derived parameters

---

## Technical Details

### Calculation Engine (`labCalculations.ts`)

Each calculation rule will be defined as:

```text
+---------------------------+
| CalculationRule           |
+---------------------------+
| id: string                |
| name: string              |
| category: string          |
| formula: description      |
| inputParams: string[]     |  -- abbreviation aliases
| outputParam: string       |  -- target abbreviation
| outputUnit: string        |
| calculate(inputs) => num  |
| decimalPlaces: number     |
+---------------------------+
```

The engine will:
1. Receive the current sample's entered results
2. Match input parameters by abbreviation (reusing the alias system from `scientificValidation.ts`)
3. Run all applicable calculations where all required inputs are present
4. Return an array of `CalculatedValue` objects

### UI Integration

Calculated cells in the grid will be:
- Displayed with a distinct background color (e.g., light purple/violet tint)
- Marked with a small calculator icon
- Read-only by default but overridable (click to enter manual value)
- Show a tooltip with the formula used and input values

The `CalculatedResultsPanel` will appear below the grid (similar to the existing `ScientificValidationPanel`) showing a summary of all auto-calculated values grouped by category, with the formula breakdown visible.

### Data Flow

```text
Analyst enters value
       |
       v
ResultsEntryGrid detects change
       |
       v
useLabCalculations hook recalculates
       |
       v
Calculated values appear in grid (purple cells)
       |
       v
On "Save All", calculated values are saved
to the results table with a "calculated" flag
```

### Database Change

Add a `is_calculated` boolean column to the `results` table (default `false`) so the system can distinguish manually entered values from auto-calculated ones. This preserves audit traceability.

---

## Step-by-Step Implementation

1. **Database migration**: Add `is_calculated` boolean column to `results` table
2. **Create `src/lib/labCalculations.ts`**: Pure calculation engine with all formulas listed above
3. **Create `src/hooks/useLabCalculations.ts`**: Hook that takes sample results and returns calculated values
4. **Create `src/components/results/CalculatedResultsPanel.tsx`**: Summary panel showing formula breakdowns
5. **Update `ResultsEntryGrid.tsx`**: Display calculated values inline with distinct styling, allow override
6. **Update save logic**: When saving, include calculated values with `is_calculated: true`
7. **Update `useResults.ts`**: Include `is_calculated` in the Result interface

This adds a powerful, real-time calculation layer that saves analysts significant manual work while maintaining full traceability of which values are calculated vs. manually entered.
