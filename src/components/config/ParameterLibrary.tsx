import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter, Settings2, Loader2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParameters } from '@/hooks/useParameters';
import { useParameterConfigs } from '@/hooks/useParameterConfigs';
import { AddParameterDialog } from './AddParameterDialog';
import { ChemicalFormula } from '@/components/ui/chemical-formula';
import { AddParameterConfigDialog } from './AddParameterConfigDialog';

const categoryLabels: Record<string, string> = {
  wet_chemistry: 'Wet Chemistry',
  instrumentation: 'Instrumentation',
  microbiology: 'Microbiology',
};

const categoryStyles: Record<string, string> = {
  wet_chemistry: 'bg-primary/10 text-primary border-primary/20',
  instrumentation: 'bg-accent/10 text-accent border-accent/20',
  microbiology: 'bg-warning/10 text-warning border-warning/20',
};

export function ParameterLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [addParamDialogOpen, setAddParamDialogOpen] = useState(false);
  const [addConfigDialogOpen, setAddConfigDialogOpen] = useState(false);
  const [selectedParameterId, setSelectedParameterId] = useState<string | undefined>();
  
  const { data: parameters = [], isLoading } = useParameters();
  const { data: configs = [] } = useParameterConfigs();
  
  const filteredParams = parameters.filter(param => {
    const matchesSearch = 
      param.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      param.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || param.lab_section === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getConfig = (paramId: string) => 
    configs.find(c => c.parameter_id === paramId);

  const handleConfigureParameter = (paramId: string) => {
    setSelectedParameterId(paramId);
    setAddConfigDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Parameter Library</h1>
          <p className="text-muted-foreground mt-1">
            Configure detection limits, units, and validation rules for each parameter
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddConfigDialogOpen(true)}>
            <Settings2 className="w-4 h-4 mr-2" />
            Add Configuration
          </Button>
          <Button onClick={() => setAddParamDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Parameter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="wet_chemistry">Wet Chemistry</SelectItem>
            <SelectItem value="instrumentation">Instrumentation</SelectItem>
            <SelectItem value="microbiology">Microbiology</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="lab-section-card p-4">
          <p className="text-sm text-muted-foreground">Total Parameters</p>
          <p className="text-2xl font-semibold mt-1">{parameters.length}</p>
        </div>
        <div className="lab-section-card p-4">
          <p className="text-sm text-muted-foreground">Wet Chemistry</p>
          <p className="text-2xl font-semibold mt-1">
            {parameters.filter(p => p.lab_section === 'wet_chemistry').length}
          </p>
        </div>
        <div className="lab-section-card p-4">
          <p className="text-sm text-muted-foreground">Instrumentation</p>
          <p className="text-2xl font-semibold mt-1">
            {parameters.filter(p => p.lab_section === 'instrumentation').length}
          </p>
        </div>
        <div className="lab-section-card p-4">
          <p className="text-sm text-muted-foreground">Microbiology</p>
          <p className="text-2xl font-semibold mt-1">
            {parameters.filter(p => p.lab_section === 'microbiology').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="lab-section-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parameter</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Analyte Group</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">MDL</TableHead>
              <TableHead className="text-right">LOQ</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {parameters.length === 0 
                    ? 'No parameters configured. Add your first parameter to get started.'
                    : 'No parameters match your search criteria.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredParams.map((param) => {
                const config = getConfig(param.id);
                const method = config?.method;
                
                return (
                  <TableRow key={param.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{param.name}</span>
                        <span className="text-muted-foreground ml-2">
                          (<ChemicalFormula formula={param.abbreviation} />)
                        </span>
                      </div>
                      {param.cas_number && (
                        <span className="text-xs text-muted-foreground">CAS: {param.cas_number}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', categoryStyles[param.lab_section] || '')}
                      >
                        {categoryLabels[param.lab_section] || param.lab_section}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {param.analyte_group}
                    </TableCell>
                    <TableCell>
                      {method ? (
                        <span className="text-sm font-mono">{method.code}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {config?.mdl ?? '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {config?.loq ?? '—'}
                    </TableCell>
                    <TableCell>
                      {config?.canonical_unit ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleConfigureParameter(param.id)}
                        title="Edit parameter configuration"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AddParameterDialog open={addParamDialogOpen} onOpenChange={setAddParamDialogOpen} />
      <AddParameterConfigDialog 
        open={addConfigDialogOpen} 
        onOpenChange={(open) => {
          setAddConfigDialogOpen(open);
          if (!open) setSelectedParameterId(undefined);
        }}
        preselectedParameterId={selectedParameterId}
      />
    </div>
  );
}
