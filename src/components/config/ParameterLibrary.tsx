import { useState } from 'react';
import { parameters, parameterConfigs, methods } from '@/data/mockData';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Settings2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ParameterLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const filteredParams = parameters.filter(param => {
    const matchesSearch = 
      param.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      param.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || param.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryLabels = {
    wet_chemistry: 'Wet Chemistry',
    instrumentation: 'Instrumentation',
    microbiology: 'Microbiology',
  };

  const categoryStyles = {
    wet_chemistry: 'bg-primary/10 text-primary border-primary/20',
    instrumentation: 'bg-accent/10 text-accent border-accent/20',
    microbiology: 'bg-warning/10 text-warning border-warning/20',
  };

  const getConfig = (paramId: string) => 
    parameterConfigs.find(c => c.parameterId === paramId);

  const getMethod = (methodId: string) =>
    methods.find(m => m.id === methodId);

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
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Parameter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Parameter</DialogTitle>
              <DialogDescription>
                Define a new analytical parameter with its detection limits and unit configuration.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Parameter Name</label>
                  <Input placeholder="e.g., Total Nitrogen" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Abbreviation</label>
                  <Input placeholder="e.g., TN" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wet_chemistry">Wet Chemistry</SelectItem>
                      <SelectItem value="instrumentation">Instrumentation</SelectItem>
                      <SelectItem value="microbiology">Microbiology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CAS Number (Optional)</label>
                  <Input placeholder="e.g., 7727-37-9" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">MDL</label>
                  <Input type="number" step="0.001" placeholder="0.001" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LOQ</label>
                  <Input type="number" step="0.001" placeholder="0.005" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="mg/L" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mg_l">mg/L</SelectItem>
                      <SelectItem value="ug_l">µg/L</SelectItem>
                      <SelectItem value="mg_kg">mg/kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save Parameter</Button>
            </div>
          </DialogContent>
        </Dialog>
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
            {parameters.filter(p => p.category === 'wet_chemistry').length}
          </p>
        </div>
        <div className="lab-section-card p-4">
          <p className="text-sm text-muted-foreground">Instrumentation</p>
          <p className="text-2xl font-semibold mt-1">
            {parameters.filter(p => p.category === 'instrumentation').length}
          </p>
        </div>
        <div className="lab-section-card p-4">
          <p className="text-sm text-muted-foreground">Microbiology</p>
          <p className="text-2xl font-semibold mt-1">
            {parameters.filter(p => p.category === 'microbiology').length}
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
            {filteredParams.map((param) => {
              const config = getConfig(param.id);
              const method = config ? getMethod(config.methodId) : null;
              
              return (
                <TableRow key={param.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{param.name}</span>
                      <span className="text-muted-foreground ml-2">({param.abbreviation})</span>
                    </div>
                    {param.casNumber && (
                      <span className="text-xs text-muted-foreground">CAS: {param.casNumber}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs', categoryStyles[param.category])}
                    >
                      {categoryLabels[param.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {param.analyteGroup}
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
                    {config?.canonicalUnit.symbol ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Settings2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
