import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Info, 
  FlaskConical,
  FolderKanban,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Droplets,
  Zap,
  Atom,
  Scale,
  Beaker,
  TestTube,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAllValidations, useValidationSummary } from '@/hooks/useAllValidations';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/scientificValidation';

const categoryIcons: Record<string, React.ElementType> = {
  hydrocarbons: FlaskConical,
  oxygen_demand: Droplets,
  conductivity: Zap,
  nitrogen: Atom,
  solids: Scale,
  ionic_balance: Beaker,
  alkalinity: TestTube,
  hardness: Scale,
  metals: Atom,
};

export default function ValidationDashboard() {
  const { data: validations = [], isLoading } = useAllValidations();
  const { summary } = useValidationSummary();
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedSamples, setExpandedSamples] = useState<Set<string>>(new Set());

  // Get unique categories
  const categories = Array.from(
    new Set(validations.flatMap(v => v.validations.map(val => val.category)))
  );

  // Filter validations
  const filteredValidations = validations.filter(sample => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSample = sample.sampleName.toLowerCase().includes(query);
      const matchesProject = sample.projectCode.toLowerCase().includes(query) ||
        sample.projectTitle.toLowerCase().includes(query);
      if (!matchesSample && !matchesProject) return false;
    }

    // Severity filter
    if (severityFilter !== 'all') {
      const hasMatchingSeverity = sample.validations.some(v => v.severity === severityFilter);
      if (!hasMatchingSeverity) return false;
    }

    // Category filter
    if (categoryFilter !== 'all') {
      const hasMatchingCategory = sample.validations.some(v => v.category === categoryFilter);
      if (!hasMatchingCategory) return false;
    }

    return true;
  });

  // Filter individual validations within samples
  const getFilteredValidations = (sampleValidations: typeof validations[0]['validations']) => {
    return sampleValidations.filter(v => {
      if (severityFilter !== 'all' && v.severity !== severityFilter) return false;
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      return true;
    });
  };

  const toggleSample = (sampleId: string) => {
    setExpandedSamples(prev => {
      const next = new Set(prev);
      if (next.has(sampleId)) {
        next.delete(sampleId);
      } else {
        next.add(sampleId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSamples(new Set(filteredValidations.map(v => v.sampleId)));
  };

  const collapseAll = () => {
    setExpandedSamples(new Set());
  };

  return (
    <MainLayout 
      title="Validation Dashboard" 
      subtitle="Scientific validation warnings across all projects"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StatsCard
                title="Total Warnings"
                value={summary.totalWarnings}
                description="Require attention"
                icon={AlertTriangle}
                variant="warning"
              />
              <StatsCard
                title="Info Notices"
                value={summary.totalInfo}
                description="For review"
                icon={Info}
                variant="default"
              />
              <StatsCard
                title="Projects Affected"
                value={summary.projectsAffected}
                description="With validation issues"
                icon={FolderKanban}
                variant="accent"
              />
              <StatsCard
                title="Samples Affected"
                value={summary.samplesAffected}
                description="Need review"
                icon={FlaskConical}
                variant="default"
              />
            </>
          )}
        </div>

        {/* Filters */}
        <div className="lab-section-card">
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search samples or projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryLabel(cat as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </div>

          {/* Validations List */}
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : filteredValidations.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {validations.length === 0 ? 'No Validation Issues' : 'No Matching Results'}
                </h3>
                <p className="text-muted-foreground">
                  {validations.length === 0 
                    ? 'All samples pass scientific validation checks.' 
                    : 'Try adjusting your filters to see more results.'}
                </p>
              </div>
            ) : (
              filteredValidations.map(sample => {
                const isExpanded = expandedSamples.has(sample.sampleId);
                const filteredSampleValidations = getFilteredValidations(sample.validations);
                const warningCount = filteredSampleValidations.filter(v => v.severity === 'warning').length;
                const infoCount = filteredSampleValidations.filter(v => v.severity === 'info').length;

                return (
                  <Collapsible
                    key={sample.sampleId}
                    open={isExpanded}
                    onOpenChange={() => toggleSample(sample.sampleId)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium text-foreground">
                                {sample.sampleName}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {sample.matrix}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Link 
                                to={`/projects/${sample.projectId}`}
                                className="text-sm text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {sample.projectCode}
                              </Link>
                              <span className="text-sm text-muted-foreground">
                                — {sample.projectTitle}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {warningCount > 0 && (
                              <div className="flex items-center gap-1.5 text-warning">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-medium">{warningCount}</span>
                              </div>
                            )}
                            {infoCount > 0 && (
                              <div className="flex items-center gap-1.5 text-info">
                                <Info className="w-4 h-4" />
                                <span className="text-sm font-medium">{infoCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 pl-14 space-y-3">
                        {filteredSampleValidations.map((validation, idx) => {
                          const CategoryIcon = categoryIcons[validation.category] || AlertTriangle;
                          
                          return (
                            <div
                              key={`${validation.ruleId}-${idx}`}
                              className={cn(
                                'p-3 rounded-lg border',
                                validation.severity === 'warning'
                                  ? 'bg-warning/10 border-warning/20'
                                  : 'bg-info/10 border-info/20'
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <CategoryIcon 
                                  className={cn(
                                    'w-5 h-5 mt-0.5 flex-shrink-0',
                                    validation.severity === 'warning' 
                                      ? 'text-warning' 
                                      : 'text-info'
                                  )} 
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-mono text-muted-foreground">
                                      {validation.ruleId}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                      {getCategoryLabel(validation.category)}
                                    </Badge>
                                  </div>
                                  <h5 className="font-medium text-foreground text-sm mt-1">
                                    {validation.ruleName}
                                  </h5>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {validation.message}
                                  </p>
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {validation.affectedParameters.map(param => (
                                      <Badge 
                                        key={param} 
                                        variant="outline" 
                                        className="text-xs"
                                      >
                                        {param}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
