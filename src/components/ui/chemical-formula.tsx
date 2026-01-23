import React from 'react';

interface ChemicalFormulaProps {
  formula: string;
  className?: string;
}

/**
 * Parses chemical formulas and renders them with proper subscripts and superscripts.
 * 
 * Examples:
 * - NH3 → NH₃
 * - SO4 → SO₄
 * - Ca2+ → Ca²⁺
 * - PO4^3- → PO₄³⁻
 * - H2SO4 → H₂SO₄
 */
export function ChemicalFormula({ formula, className }: ChemicalFormulaProps) {
  const parts = parseFormula(formula);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'subscript') {
          return <sub key={index}>{part.text}</sub>;
        } else if (part.type === 'superscript') {
          return <sup key={index}>{part.text}</sup>;
        }
        return <span key={index}>{part.text}</span>;
      })}
    </span>
  );
}

interface FormulaPart {
  type: 'normal' | 'subscript' | 'superscript';
  text: string;
}

function parseFormula(formula: string): FormulaPart[] {
  const parts: FormulaPart[] = [];
  let i = 0;
  
  while (i < formula.length) {
    // Check for explicit superscript notation (e.g., ^2-, ^3+)
    if (formula[i] === '^') {
      i++;
      let superText = '';
      while (i < formula.length && /[\d+\-]/.test(formula[i])) {
        superText += formula[i];
        i++;
      }
      if (superText) {
        parts.push({ type: 'superscript', text: superText });
      }
      continue;
    }
    
    // Check for ionic charge notation at end (e.g., 2+, 3-, +, -)
    if (/[\d]/.test(formula[i]) && i > 0) {
      // Look ahead to see if this is a charge (number followed by +/-)
      let j = i;
      let numStr = '';
      while (j < formula.length && /\d/.test(formula[j])) {
        numStr += formula[j];
        j++;
      }
      
      // Check if followed by + or - (ionic charge)
      if (j < formula.length && /[+\-]/.test(formula[j])) {
        const chargeStr = numStr + formula[j];
        parts.push({ type: 'superscript', text: chargeStr });
        i = j + 1;
        continue;
      }
      
      // Check if previous character was a letter (subscript number in formula)
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.type === 'normal' && /[A-Za-z]$/.test(lastPart.text)) {
        parts.push({ type: 'subscript', text: numStr });
        i = j;
        continue;
      }
    }
    
    // Check for standalone + or - at the end (single charge)
    if (/[+\-]/.test(formula[i]) && i === formula.length - 1) {
      parts.push({ type: 'superscript', text: formula[i] });
      i++;
      continue;
    }
    
    // Regular character - add to last normal part or create new one
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.type === 'normal') {
      lastPart.text += formula[i];
    } else {
      parts.push({ type: 'normal', text: formula[i] });
    }
    i++;
  }
  
  return parts;
}

/**
 * Formats a chemical formula string for display in contexts where JSX isn't available.
 * Uses Unicode subscript/superscript characters.
 */
export function formatChemicalFormula(formula: string): string {
  const subscriptMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  };
  
  const superscriptMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻',
  };
  
  let result = '';
  let i = 0;
  
  while (i < formula.length) {
    // Handle explicit superscript
    if (formula[i] === '^') {
      i++;
      while (i < formula.length && /[\d+\-]/.test(formula[i])) {
        result += superscriptMap[formula[i]] || formula[i];
        i++;
      }
      continue;
    }
    
    // Handle numbers after letters (subscript)
    if (/\d/.test(formula[i]) && i > 0 && /[A-Za-z]/.test(formula[i - 1])) {
      // Check if this is a charge (followed by +/-)
      let j = i;
      let numStr = '';
      while (j < formula.length && /\d/.test(formula[j])) {
        numStr += formula[j];
        j++;
      }
      
      if (j < formula.length && /[+\-]/.test(formula[j])) {
        // It's a charge - use superscript
        for (const char of numStr) {
          result += superscriptMap[char] || char;
        }
        result += superscriptMap[formula[j]] || formula[j];
        i = j + 1;
        continue;
      }
      
      // Regular subscript number
      for (const char of numStr) {
        result += subscriptMap[char] || char;
      }
      i = j;
      continue;
    }
    
    // Handle standalone charge at end
    if (/[+\-]/.test(formula[i]) && i === formula.length - 1) {
      result += superscriptMap[formula[i]] || formula[i];
      i++;
      continue;
    }
    
    result += formula[i];
    i++;
  }
  
  return result;
}
