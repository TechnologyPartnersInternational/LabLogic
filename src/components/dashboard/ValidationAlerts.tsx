import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ValidationAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  sampleId?: string;
  parameter?: string;
}

const mockAlerts: ValidationAlert[] = [
  {
    id: '1',
    type: 'error',
    title: 'pH Out of Range',
    message: 'Sample YP1 (mid) has pH value 7.31 which is significantly lower than other samples in the batch',
    sampleId: 'YP1 (mid)',
    parameter: 'pH',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Missing Results',
    message: '3 samples in YOHO FSO batch are missing hydrocarbon analysis results',
    sampleId: 'FPS1-FPS3',
  },
  {
    id: '3',
    type: 'warning',
    title: 'Duplicate RPD Exceeded',
    message: 'Duplicate RPD for Iron exceeds 20% threshold (23.4%)',
    sampleId: 'QC-DUP-001',
    parameter: 'Iron',
  },
  {
    id: '4',
    type: 'info',
    title: 'Below MDL Values',
    message: '45 results reported as below detection limit in current batch',
  },
];

export function ValidationAlerts() {
  const alertStyles = {
    error: {
      bg: 'bg-destructive/10 border-destructive/20',
      icon: AlertCircle,
      iconColor: 'text-destructive',
    },
    warning: {
      bg: 'bg-warning/10 border-warning/20',
      icon: AlertTriangle,
      iconColor: 'text-warning',
    },
    info: {
      bg: 'bg-info/10 border-info/20',
      icon: Info,
      iconColor: 'text-info',
    },
  };

  return (
    <div className="lab-section-card">
      <div className="lab-section-header">
        <h2 className="font-semibold text-foreground">Validation Alerts</h2>
        <span className="text-sm text-muted-foreground">
          {mockAlerts.filter(a => a.type === 'error').length} errors, {mockAlerts.filter(a => a.type === 'warning').length} warnings
        </span>
      </div>
      
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {mockAlerts.map((alert) => {
          const style = alertStyles[alert.type];
          const Icon = style.icon;
          
          return (
            <div
              key={alert.id}
              className={cn(
                'p-3 rounded-lg border flex items-start gap-3',
                style.bg
              )}
            >
              <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', style.iconColor)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-foreground text-sm">{alert.title}</h4>
                  <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                {(alert.sampleId || alert.parameter) && (
                  <div className="mt-2 flex items-center gap-2">
                    {alert.sampleId && (
                      <span className="text-xs px-2 py-0.5 rounded bg-background font-mono">
                        {alert.sampleId}
                      </span>
                    )}
                    {alert.parameter && (
                      <span className="text-xs px-2 py-0.5 rounded bg-background">
                        {alert.parameter}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
