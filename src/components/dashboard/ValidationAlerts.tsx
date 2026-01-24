import { AlertTriangle, AlertCircle, Info, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface ValidationError {
  id: string;
  error_code: string;
  message: string;
  severity: string;
  field: string | null;
  result_id: string;
  resolved: boolean;
}

export function ValidationAlerts() {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['validation-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('validation_errors')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as ValidationError[];
    }
  });

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

  const getAlertStyle = (severity: string) => {
    if (severity === 'error' || severity === 'critical') return alertStyles.error;
    if (severity === 'warning') return alertStyles.warning;
    return alertStyles.info;
  };

  const errorCount = alerts.filter(a => a.severity === 'error' || a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="lab-section-card">
      <div className="lab-section-header">
        <h2 className="font-semibold text-foreground">Validation Alerts</h2>
        <span className="text-sm text-muted-foreground">
          {errorCount} errors, {warningCount} warnings
        </span>
      </div>
      
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success" />
            <p className="font-medium">All Clear</p>
            <p className="text-sm">No validation alerts at this time</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const style = getAlertStyle(alert.severity);
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
                    <h4 className="font-medium text-foreground text-sm">{alert.error_code}</h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                  {alert.field && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-background">
                        {alert.field}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
