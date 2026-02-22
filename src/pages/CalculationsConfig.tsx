import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calculator, Droplets, Leaf, Layers, CircleDot, Gauge,
  Settings, Save, Loader2, Info,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useCalculationRuleConfigs,
  useUpdateCalculationRuleConfig,
  CalculationRuleConfig,
} from '@/hooks/useCalculationRuleConfigs';
import { CALCULATION_RULES, CATEGORY_LABELS } from '@/lib/labCalculations';

const categoryIcons: Record<string, React.ElementType> = {
  water_quality: Droplets,
  nitrogen: Leaf,
  solids: Layers,
  ionic_balance: CircleDot,
  alkalinity: Gauge,
};

/** Editable parameters per rule — defines which overrides are exposed in the UI */
const RULE_OVERRIDES: Record<string, { key: string; label: string; defaultValue: number; step: string; description: string }[]> = {
  CALC_TDS_EC: [
    { key: 'ec_factor', label: 'EC → TDS Factor', defaultValue: 0.65, step: '0.01', description: 'Multiplier to convert EC (µS/cm) to TDS (mg/L). Typical range: 0.55–0.70.' },
  ],
  CALC_TH: [
    { key: 'ca_factor', label: 'Ca Factor', defaultValue: 2.497, step: '0.001', description: 'Calcium to CaCO₃ conversion factor.' },
    { key: 'mg_factor', label: 'Mg Factor', defaultValue: 4.118, step: '0.001', description: 'Magnesium to CaCO₃ conversion factor.' },
  ],
  CALC_CA_H: [
    { key: 'ca_factor', label: 'Ca Factor', defaultValue: 2.497, step: '0.001', description: 'Calcium to CaCO₃ conversion factor.' },
  ],
  CALC_MG_H: [
    { key: 'mg_factor', label: 'Mg Factor', defaultValue: 4.118, step: '0.001', description: 'Magnesium to CaCO₃ conversion factor.' },
  ],
  CALC_FREE_CO2: [
    { key: 'hco3_conversion', label: 'HCO₃ Conversion', defaultValue: 1.22, step: '0.01', description: 'Factor to convert CaCO₃ alkalinity to mg/L HCO₃.' },
    { key: 'pka1', label: 'pKa₁ (CO₂/HCO₃)', defaultValue: 6.35, step: '0.01', description: 'First dissociation constant of carbonic acid at 25°C.' },
  ],
};

interface RuleCardProps {
  config: CalculationRuleConfig;
  onUpdate: (id: string, enabled?: boolean, overrides?: Record<string, number>) => void;
  isUpdating: boolean;
}

function RuleCard({ config, onUpdate, isUpdating }: RuleCardProps) {
  const [localOverrides, setLocalOverrides] = useState<Record<string, number>>(config.overrides || {});
  const [hasChanges, setHasChanges] = useState(false);

  const ruleDefinition = CALCULATION_RULES.find(r => r.id === config.rule_id);
  const overrideFields = RULE_OVERRIDES[config.rule_id] || [];
  const Icon = categoryIcons[config.category] || Calculator;

  const handleOverrideChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setLocalOverrides(prev => ({ ...prev, [key]: numValue }));
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    onUpdate(config.id, undefined, localOverrides);
    setHasChanges(false);
  };

  return (
    <Card className={!config.enabled ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{config.rule_name}</CardTitle>
              {ruleDefinition && (
                <CardDescription className="text-sm mt-1 font-mono">
                  {ruleDefinition.formulaDescription}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.enabled ? 'default' : 'secondary'}>
              {config.enabled ? 'Active' : 'Disabled'}
            </Badge>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => onUpdate(config.id, enabled, undefined)}
              disabled={isUpdating}
            />
          </div>
        </div>
        {ruleDefinition && (
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Output: <strong>{ruleDefinition.outputParam}</strong></span>
            <span>Unit: {ruleDefinition.outputUnit}</span>
            <span>Inputs: {ruleDefinition.inputParams.join(', ')}</span>
          </div>
        )}
      </CardHeader>

      {overrideFields.length > 0 && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Adjustable Parameters</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overrideFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor={`${config.id}-${field.key}`} className="text-sm">
                      {field.label}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        {field.description}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id={`${config.id}-${field.key}`}
                    type="number"
                    step={field.step}
                    value={localOverrides[field.key] ?? field.defaultValue}
                    onChange={(e) => handleOverrideChange(field.key, e.target.value)}
                    disabled={!config.enabled || isUpdating}
                    className="h-9"
                  />
                </div>
              ))}
            </div>
            {hasChanges && (
              <Button size="sm" onClick={handleSave} disabled={isUpdating} className="mt-2">
                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Parameters
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function CalculationsConfig() {
  const { data: configs, isLoading, error } = useCalculationRuleConfigs();
  const updateMutation = useUpdateCalculationRuleConfig();

  const handleUpdate = (id: string, enabled?: boolean, overrides?: Record<string, number>) => {
    updateMutation.mutate({ id, enabled, overrides });
  };

  const groupedConfigs = configs?.reduce((acc, config) => {
    if (!acc[config.category]) acc[config.category] = [];
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, CalculationRuleConfig[]>) ?? {};

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive">Error loading calculation configs: {(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          Automated Calculations
        </h1>
        <p className="text-muted-foreground mt-1">
          Enable or disable calculation rules and fine-tune conversion factors used by the calculation engine.
        </p>
      </div>

      {configs && (
        <div className="flex gap-4">
          <Badge variant="outline" className="text-sm py-1 px-3">
            {configs.filter(c => c.enabled).length} Active
          </Badge>
          <Badge variant="secondary" className="text-sm py-1 px-3">
            {configs.filter(c => !c.enabled).length} Disabled
          </Badge>
          <Badge variant="outline" className="text-sm py-1 px-3">
            {configs.length} Total Rules
          </Badge>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-72 mt-2" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => {
            const Icon = categoryIcons[category] || Calculator;
            return (
              <div key={category} className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  {CATEGORY_LABELS[category] || category}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {categoryConfigs.map((config) => (
                    <RuleCard
                      key={config.id}
                      config={config}
                      onUpdate={handleUpdate}
                      isUpdating={updateMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
