import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';

export function LabActivityChart() {
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['lab-activity-results'],
    queryFn: async () => {
      // Get results from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('results')
        .select(`
          id,
          entered_at,
          parameter_config:parameter_configs!inner(
            parameter:parameters!inner(
              lab_section
            )
          )
        `)
        .gte('entered_at', sevenDaysAgo.toISOString())
        .not('entered_at', 'is', null);
      
      if (error) throw error;
      return data || [];
    }
  });

  const chartData = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Initialize data structure
    const data = days.map((name, index) => ({
      name,
      date: addDays(weekStart, index),
      wetChem: 0,
      instrumentation: 0,
      microbiology: 0,
    }));

    // Count results by day and lab section
    results.forEach((result: any) => {
      if (!result.entered_at) return;
      
      const resultDate = new Date(result.entered_at);
      const dayIndex = (resultDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
      
      if (dayIndex >= 0 && dayIndex < 7) {
        const labSection = result.parameter_config?.parameter?.lab_section;
        if (labSection === 'wet_chemistry') {
          data[dayIndex].wetChem++;
        } else if (labSection === 'instrumentation') {
          data[dayIndex].instrumentation++;
        } else if (labSection === 'microbiology') {
          data[dayIndex].microbiology++;
        }
      }
    });

    return data;
  }, [results]);

  const hasData = chartData.some(d => d.wetChem > 0 || d.instrumentation > 0 || d.microbiology > 0);

  return (
    <div className="lab-section-card">
      <div className="lab-section-header">
        <h2 className="font-semibold text-foreground">Weekly Lab Activity</h2>
        <span className="text-sm text-muted-foreground">Samples processed by lab section</span>
      </div>
      
      <div className="p-4 h-[300px]">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : !hasData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="font-medium">No Activity This Week</p>
              <p className="text-sm">Results will appear here as they are entered</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Bar 
                dataKey="wetChem" 
                name="Wet Chemistry"
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="instrumentation" 
                name="Instrumentation"
                fill="hsl(var(--accent))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="microbiology" 
                name="Microbiology"
                fill="hsl(var(--warning))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
