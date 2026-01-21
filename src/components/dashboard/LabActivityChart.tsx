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

const data = [
  { name: 'Mon', wetChem: 45, instrumentation: 32, microbiology: 18 },
  { name: 'Tue', wetChem: 52, instrumentation: 38, microbiology: 22 },
  { name: 'Wed', wetChem: 48, instrumentation: 45, microbiology: 25 },
  { name: 'Thu', wetChem: 61, instrumentation: 52, microbiology: 30 },
  { name: 'Fri', wetChem: 55, instrumentation: 48, microbiology: 28 },
  { name: 'Sat', wetChem: 20, instrumentation: 15, microbiology: 8 },
  { name: 'Sun', wetChem: 0, instrumentation: 0, microbiology: 0 },
];

export function LabActivityChart() {
  return (
    <div className="lab-section-card">
      <div className="lab-section-header">
        <h2 className="font-semibold text-foreground">Weekly Lab Activity</h2>
        <span className="text-sm text-muted-foreground">Samples processed by lab section</span>
      </div>
      
      <div className="p-4 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
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
      </div>
    </div>
  );
}
