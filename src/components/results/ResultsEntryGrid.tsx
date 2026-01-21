import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { parameters, sampleResultsData, parameterConfigs } from '@/data/mockData';

interface ResultsEntryGridProps {
  category: 'physico_chemical' | 'cations_anions' | 'heavy_metals' | 'hydrocarbons' | 'microbiology';
}

const categoryParameters: Record<string, string[]> = {
  physico_chemical: ['ph', 'temp', 'conductivity', 'turbidity', 'do', 'cod', 'bod5', 'tds', 'tss', 'salinity', 'alkalinity', 'redox', 'hardness', 'colour'],
  cations_anions: ['ammonium', 'chloride', 'phosphate', 'sulphate', 'nitrate', 'carbonate', 'calcium', 'magnesium', 'potassium', 'sodium'],
  heavy_metals: ['cadmium', 'zinc', 'iron', 'copper', 'chromium', 'nickel', 'lead', 'vanadium', 'arsenic', 'mercury', 'barium', 'manganese', 'cobalt'],
  hydrocarbons: ['oil_grease', 'thc', 'tph', 'pahs', 'btex', 'phenols'],
  microbiology: ['thb', 'tf', 'hub', 'huf', 'srb'],
};

const unitLabels: Record<string, string> = {
  ph: 'pH',
  temp: '°C',
  conductivity: 'µS/cm',
  turbidity: 'NTU',
  do: 'mg/L',
  cod: 'mg/L',
  bod5: 'mg/L',
  tds: 'mg/L',
  tss: 'mg/L',
  salinity: 'ppt',
  alkalinity: 'mg/L',
  redox: 'mV',
  hardness: 'mg/L',
  colour: 'PtCo',
  ammonium: 'mg/L',
  chloride: 'mg/L',
  phosphate: 'mg/L',
  sulphate: 'mg/L',
  nitrate: 'mg/L',
  carbonate: 'mg/L',
  calcium: 'mg/L',
  magnesium: 'mg/L',
  potassium: 'mg/L',
  sodium: 'mg/L',
  cadmium: 'mg/L',
  zinc: 'mg/L',
  iron: 'mg/L',
  copper: 'mg/L',
  chromium: 'mg/L',
  nickel: 'mg/L',
  lead: 'mg/L',
  vanadium: 'mg/L',
  arsenic: 'mg/L',
  mercury: 'mg/L',
  barium: 'mg/L',
  manganese: 'mg/L',
  cobalt: 'mg/L',
  oil_grease: 'mg/L',
  thc: 'mg/L',
  tph: 'mg/L',
  pahs: 'mg/L',
  btex: 'mg/L',
  phenols: 'mg/L',
  thb: 'CFU/mL',
  tf: 'CFU/mL',
  hub: 'CFU/mL',
  huf: 'CFU/mL',
  srb: 'MPN/mL',
};

export function ResultsEntryGrid({ category }: ResultsEntryGridProps) {
  const [editedCells, setEditedCells] = useState<Record<string, Record<string, string>>>({});
  
  const paramIds = categoryParameters[category] || [];
  const filteredParams = parameters.filter(p => paramIds.includes(p.id));
  
  const handleCellChange = (sampleId: string, paramId: string, value: string) => {
    setEditedCells(prev => ({
      ...prev,
      [sampleId]: {
        ...prev[sampleId],
        [paramId]: value,
      },
    }));
  };

  const getCellValue = (sampleId: string, paramId: string) => {
    // Check if edited
    if (editedCells[sampleId]?.[paramId]) {
      return editedCells[sampleId][paramId];
    }
    // Get from mock data
    const sample = sampleResultsData.find(s => s.sampleId === sampleId);
    return sample?.results[paramId]?.value || '';
  };

  const isBelowMdl = (sampleId: string, paramId: string) => {
    const sample = sampleResultsData.find(s => s.sampleId === sampleId);
    return sample?.results[paramId]?.isBelowMdl || false;
  };

  const getMdl = (paramId: string) => {
    const config = parameterConfigs.find(c => c.parameterId === paramId && c.matrixId === 'water');
    return config?.mdl;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select defaultValue="proj_yoho_ees">
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="proj_yoho_ees">TPI/2026/SEPNU/004 - YOHO EES</SelectItem>
              <SelectItem value="proj_baseline_2026">TPI/2026/SHELL/001 - Baseline Study</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="yoho_yb">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sample Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yoho_yb">YOHO YB</SelectItem>
              <SelectItem value="yoho_p">YOHO P</SelectItem>
              <SelectItem value="yoho_fso">YOHO FSO</SelectItem>
              <SelectItem value="awawa_a">AWAWA A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="w-3 h-3 text-success" />
            {sampleResultsData.length} samples
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Info className="w-3 h-3 text-info" />
            {filteredParams.length} parameters
          </Badge>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save All
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-info/20 border border-info/40"></span>
          Below MDL
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-warning/20 border border-warning/40"></span>
          Validation Warning
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-destructive/20 border border-destructive/40"></span>
          Out of Range
        </span>
      </div>

      {/* Data Grid */}
      <div className="lab-section-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-grid">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[hsl(var(--table-header))] min-w-[140px]">
                  Sample ID
                </th>
                {filteredParams.map(param => (
                  <th key={param.id} className="text-center min-w-[100px]">
                    <div className="flex flex-col items-center">
                      <span>{param.abbreviation}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {unitLabels[param.id]}
                      </span>
                      {getMdl(param.id) && (
                        <span className="text-xs font-normal text-muted-foreground">
                          MDL: {getMdl(param.id)}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleResultsData.map(sample => (
                <tr key={sample.sampleId}>
                  <td className="sticky left-0 z-10 bg-card font-medium">
                    {sample.sampleId}
                  </td>
                  {filteredParams.map(param => {
                    const value = getCellValue(sample.sampleId, param.id);
                    const belowMdl = isBelowMdl(sample.sampleId, param.id);
                    
                    return (
                      <td key={param.id} className="p-1">
                        <Input
                          value={value}
                          onChange={(e) => handleCellChange(sample.sampleId, param.id, e.target.value)}
                          className={cn(
                            'h-8 text-center scientific-value',
                            belowMdl && 'bg-info/10 text-info border-info/30',
                          )}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <div>
          <p className="text-sm font-medium">Validation Summary</p>
          <p className="text-sm text-muted-foreground">
            12 results below MDL • 0 range violations • 0 missing required values
          </p>
        </div>
      </div>
    </div>
  );
}
