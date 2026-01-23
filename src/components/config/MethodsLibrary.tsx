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
import { Plus, Search, Filter, Beaker, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMethods } from '@/hooks/useMethods';
import { useParameterConfigs } from '@/hooks/useParameterConfigs';
import { AddMethodDialog } from './AddMethodDialog';

const organizationStyles: Record<string, string> = {
  APHA: 'bg-primary/10 text-primary border-primary/20',
  EPA: 'bg-success/10 text-success border-success/20',
  ASTM: 'bg-warning/10 text-warning border-warning/20',
  ISO: 'bg-info/10 text-info border-info/20',
  Internal: 'bg-muted text-muted-foreground border-muted',
};

export function MethodsLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  const { data: methods = [], isLoading } = useMethods();
  const { data: configs = [] } = useParameterConfigs();
  
  const filteredMethods = methods.filter(method => {
    const matchesSearch = 
      method.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      method.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOrg = orgFilter === 'all' || method.organization === orgFilter;
    return matchesSearch && matchesOrg;
  });

  // Get linked parameters for each method
  const getLinkedParameters = (methodId: string) => {
    return configs
      .filter(c => c.method_id === methodId)
      .map(c => c.parameter)
      .filter(Boolean);
  };

  const organizations = ['APHA', 'EPA', 'ASTM', 'ISO', 'Internal'];

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
          <h1 className="text-2xl font-semibold text-foreground">Methods Library</h1>
          <p className="text-muted-foreground mt-1">
            Standard analytical methods (APHA, EPA, ASTM, ISO) and internal methods
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Method
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search methods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Organizations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {organizations.map(org => (
              <SelectItem key={org} value={org}>{org}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4">
        <div className="lab-section-card p-4">
          <p className="text-sm text-muted-foreground">Total Methods</p>
          <p className="text-2xl font-semibold mt-1">{methods.length}</p>
        </div>
        {organizations.map(org => (
          <div key={org} className="lab-section-card p-4">
            <p className="text-sm text-muted-foreground">{org}</p>
            <p className="text-2xl font-semibold mt-1">
              {methods.filter(m => m.organization === org).length}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="lab-section-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Method Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Linked Parameters</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMethods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {methods.length === 0 
                    ? 'No methods configured. Add your first method to get started.'
                    : 'No methods match your search criteria.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredMethods.map((method) => {
                const linkedParams = getLinkedParameters(method.id);
                
                return (
                  <TableRow key={method.id}>
                    <TableCell>
                      <span className="font-mono font-medium">{method.code}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{method.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', organizationStyles[method.organization] || '')}
                      >
                        {method.organization}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {linkedParams.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {linkedParams.slice(0, 3).map((param, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              <Beaker className="w-3 h-3 mr-1" />
                              {param?.abbreviation}
                            </Badge>
                          ))}
                          {linkedParams.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{linkedParams.length - 3} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No linked parameters</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {method.description || '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AddMethodDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
