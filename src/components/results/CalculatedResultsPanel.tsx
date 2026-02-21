import { Calculator, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { CalculatedValue, groupByCategory, CATEGORY_LABELS } from '@/lib/labCalculations';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CalculatedResultsPanelProps {
  calculatedValues: CalculatedValue[];
}

export function CalculatedResultsPanel({ calculatedValues }: CalculatedResultsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (calculatedValues.length === 0) return null;

  const grouped = groupByCategory(calculatedValues);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Automated Calculations</h3>
          <Badge variant="secondary" className="text-xs">
            {calculatedValues.length} computed
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {Object.entries(grouped).map(([category, values]) => (
            <div key={category}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {CATEGORY_LABELS[category] || category}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {values.map((calc) => (
                  <div
                    key={calc.ruleId}
                    className={cn(
                      'p-3 rounded-md border bg-primary/5 border-primary/20',
                      'flex flex-col gap-1'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{calc.ruleName}</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {calc.value} {calc.outputUnit}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {calc.formulaDescription}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(calc.inputValues).map(([key, val]) => (
                        <span key={key} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {key}={val}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
