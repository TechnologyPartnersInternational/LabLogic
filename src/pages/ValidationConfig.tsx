import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  FlaskConical, 
  Droplets, 
  Zap, 
  Leaf, 
  Layers, 
  Gauge, 
  Scale,
  CircleDot,
  Settings,
  Save,
  Loader2
} from 'lucide-react';
import { useValidationRuleConfigs, useUpdateValidationRuleConfig, ValidationRuleConfig } from '@/hooks/useValidationRuleConfigs';
import { Skeleton } from '@/components/ui/skeleton';

const categoryIcons: Record<string, React.ElementType> = {
  hydrocarbons: FlaskConical,
  oxygen_demand: Droplets,
  conductivity: Zap,
  nitrogen: Leaf,
  solids: Layers,
  alkalinity: Gauge,
  hardness: Scale,
  ionic: CircleDot,
};

const categoryLabels: Record<string, string> = {
  hydrocarbons: 'Hydrocarbons',
  oxygen_demand: 'Oxygen Demand',
  conductivity: 'Conductivity',
  nitrogen: 'Nitrogen Species',
  solids: 'Solids',
  alkalinity: 'Alkalinity/pH',
  hardness: 'Hardness',
  ionic: 'Ionic Balance',
};

const thresholdLabels: Record<string, string> = {
  typical_ratio_min: 'Typical Ratio (Min)',
  typical_ratio_max: 'Typical Ratio (Max)',
  ratio_min: 'Ratio (Min)',
  ratio_max: 'Ratio (Max)',
  tolerance_percent: 'Tolerance (%)',
  low_ph_threshold: 'Low pH Threshold',
  high_alkalinity_threshold: 'High Alkalinity Threshold (mg/L)',
  warning_threshold_percent: 'Warning Threshold (%)',
  error_threshold_percent: 'Error Threshold (%)',
};

interface RuleCardProps {
  config: ValidationRuleConfig;
  onUpdate: (id: string, enabled?: boolean, thresholds?: Record<string, number>) => void;
  isUpdating: boolean;
}

function RuleCard({ config, onUpdate, isUpdating }: RuleCardProps) {
  const [localThresholds, setLocalThresholds] = useState<Record<string, number>>(config.thresholds || {});
  const [hasChanges, setHasChanges] = useState(false);

  const Icon = categoryIcons[config.category] || Settings;
  const thresholdKeys = Object.keys(config.thresholds || {});

  const handleThresholdChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setLocalThresholds(prev => ({ ...prev, [key]: numValue }));
      setHasChanges(true);
    }
  };

  const handleSaveThresholds = () => {
    onUpdate(config.id, undefined, localThresholds);
    setHasChanges(false);
  };

  const handleToggle = (enabled: boolean) => {
    onUpdate(config.id, enabled, undefined);
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
              <CardDescription className="text-sm mt-1">
                {config.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.enabled ? 'default' : 'secondary'}>
              {config.enabled ? 'Active' : 'Disabled'}
            </Badge>
            <Switch
              checked={config.enabled}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
            />
          </div>
        </div>
      </CardHeader>
      
      {thresholdKeys.length > 0 && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Thresholds</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {thresholdKeys.map((key) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`${config.id}-${key}`} className="text-sm">
                    {thresholdLabels[key] || key}
                  </Label>
                  <Input
                    id={`${config.id}-${key}`}
                    type="number"
                    step="0.01"
                    value={localThresholds[key] ?? ''}
                    onChange={(e) => handleThresholdChange(key, e.target.value)}
                    disabled={!config.enabled || isUpdating}
                    className="h-9"
                  />
                </div>
              ))}
            </div>
            {hasChanges && (
              <Button 
                size="sm" 
                onClick={handleSaveThresholds}
                disabled={isUpdating}
                className="mt-2"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Thresholds
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function ValidationConfig() {
  const { data: configs, isLoading, error } = useValidationRuleConfigs();
  const updateMutation = useUpdateValidationRuleConfig();

  const handleUpdate = (id: string, enabled?: boolean, thresholds?: Record<string, number>) => {
    updateMutation.mutate({ id, enabled, thresholds });
  };

  // Group configs by category
  const groupedConfigs = configs?.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, ValidationRuleConfig[]>) ?? {};

  if (error) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="text-destructive">Error loading validation configs: {error.message}</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Scientific Validation Rules</h1>
          <p className="text-muted-foreground mt-1">
            Configure which validation rules are active and adjust their thresholds
          </p>
        </div>

        {/* Stats */}
        {configs && (
          <div className="flex gap-4">
            <Badge variant="outline" className="text-sm py-1 px-3">
              {configs.filter(c => c.enabled).length} Active Rules
            </Badge>
            <Badge variant="secondary" className="text-sm py-1 px-3">
              {configs.filter(c => !c.enabled).length} Disabled
            </Badge>
          </div>
        )}

        {/* Rules Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-72 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
              <div key={category} className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  {(() => {
                    const Icon = categoryIcons[category] || Settings;
                    return <Icon className="h-5 w-5 text-muted-foreground" />;
                  })()}
                  {categoryLabels[category] || category}
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
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
