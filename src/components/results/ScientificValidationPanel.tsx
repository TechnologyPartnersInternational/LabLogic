import { useState } from 'react';
import { 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronRight,
  Fuel,
  Activity,
  Zap,
  Atom,
  Layers,
  Scale,
  TestTube,
  Diamond,
  Gem,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ValidationResult, 
  getCategoryLabel 
} from '@/lib/scientificValidation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ScientificValidationPanelProps {
  validations: ValidationResult[];
  className?: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  hydrocarbons: Fuel,
  oxygen_demand: Activity,
  conductivity: Zap,
  nitrogen: Atom,
  solids: Layers,
  ionic_balance: Scale,
  alkalinity: TestTube,
  hardness: Diamond,
  metals: Gem,
};

export function ScientificValidationPanel({ 
  validations, 
  className 
}: ScientificValidationPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const warningCount = validations.filter(v => v.severity === 'warning').length;
  const infoCount = validations.filter(v => v.severity === 'info').length;

  // Group validations by category
  const groupedValidations = validations.reduce((acc, validation) => {
    if (!acc[validation.category]) {
      acc[validation.category] = [];
    }
    acc[validation.category].push(validation);
    return acc;
  }, {} as Record<string, ValidationResult[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(Object.keys(groupedValidations)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  if (validations.length === 0) {
    return (
      <div className={cn("lab-section-card", className)}>
        <div className="lab-section-header">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            Scientific Validation
          </h3>
        </div>
        <div className="p-4 text-center text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-success/50" />
          <p className="text-sm">All cross-parameter validations passed</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("lab-section-card", className)}>
      <div className="lab-section-header">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Scientific Validation
          </h3>
          <div className="flex items-center gap-2">
            {warningCount > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                {warningCount} warning{warningCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {infoCount > 0 && (
              <Badge variant="outline" className="bg-info/10 text-info border-info/30">
                {infoCount} info
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={expandAll}
            className="text-xs"
          >
            Expand All
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={collapseAll}
            className="text-xs"
          >
            Collapse
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {Object.entries(groupedValidations).map(([category, items]) => {
          const Icon = categoryIcons[category] || AlertTriangle;
          const isExpanded = expandedCategories.has(category);
          const categoryWarnings = items.filter(i => i.severity === 'warning').length;

          return (
            <Collapsible
              key={category}
              open={isExpanded}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger className="w-full">
                <div className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  categoryWarnings > 0 
                    ? "bg-warning/5 border-warning/20 hover:bg-warning/10" 
                    : "bg-info/5 border-info/20 hover:bg-info/10"
                )}>
                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      "w-5 h-5",
                      categoryWarnings > 0 ? "text-warning" : "text-info"
                    )} />
                    <span className="font-medium text-sm">
                      {getCategoryLabel(category as ValidationResult['category'])}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {items.length} issue{items.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="mt-2 space-y-2 pl-4">
                  {items.map((validation, idx) => (
                    <div
                      key={`${validation.ruleId}-${idx}`}
                      className={cn(
                        "p-3 rounded-lg border-l-4",
                        validation.severity === 'warning'
                          ? "bg-warning/5 border-l-warning"
                          : "bg-info/5 border-l-info"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {validation.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 mt-0.5 text-warning flex-shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 mt-0.5 text-info flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">
                              {validation.ruleId}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs font-medium">
                              {validation.ruleName}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">
                            {validation.message}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {validation.affectedParameters.map((param) => (
                              <Badge 
                                key={param} 
                                variant="outline" 
                                className="text-xs font-mono"
                              >
                                {param}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
