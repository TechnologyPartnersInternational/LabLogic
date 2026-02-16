import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams, useParams } from 'react-router-dom';

import { ResultsEntryGrid } from '@/components/results/ResultsEntryGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useSample } from '@/hooks/useSamples';
import { StartAnalysisButton } from '@/components/results/StartAnalysisButton';
import { WorkOrderDialog } from '@/components/results/WorkOrderDialog';
import { SubmitForReviewButton } from '@/components/results/SubmitForReviewButton';
import { BulkUploadDialog } from '@/components/results/BulkUploadDialog';
import { ProjectProgressSummary } from '@/components/results/SampleProgressIndicator';
import { useProjectSamplesProgress } from '@/hooks/useSampleProgress';
import { useAuth } from '@/hooks/useAuth';
import { useDepartments, slugToLabSection, type Department } from '@/hooks/useDepartments';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FlaskConical, Beaker, Activity, Microscope, Package, Gauge, Pill,
  Wheat, Eye, Fuel, Droplets, Droplet, Flame, Mountain, Settings, Leaf,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  beaker: Beaker, 'flask-conical': FlaskConical, activity: Activity,
  microscope: Microscope, package: Package, gauge: Gauge, pill: Pill,
  wheat: Wheat, eye: Eye, fuel: Fuel, droplets: Droplets, droplet: Droplet,
  flame: Flame, mountain: Mountain, settings: Settings, leaf: Leaf,
};

export default function ResultsEntry() {
  const { departmentSlug } = useParams<{ departmentSlug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin, getLabSections } = useAuth();
  
  const sampleIdFromUrl = searchParams.get('sample');
  const { data: sampleFromUrl } = useSample(sampleIdFromUrl || '');
  const { data: departments, isLoading: deptsLoading } = useDepartments();
  
  // Determine which departments user can access
  const userDepartments = useMemo(() => {
    if (!departments) return [];
    if (isAdmin) return departments;
    const sections = getLabSections();
    return departments.filter(d => sections.includes(slugToLabSection(d.slug) as any));
  }, [isAdmin, getLabSections, departments]);

  // Active department from URL
  const activeDepartment = useMemo<Department | null>(() => {
    if (!userDepartments.length) return null;
    if (departmentSlug) {
      const found = userDepartments.find(d => d.slug === departmentSlug);
      if (found) return found;
    }
    return userDepartments[0];
  }, [departmentSlug, userDepartments]);

  const [activeGroup, setActiveGroup] = useState<Record<string, string>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Auto-select project from URL
  useEffect(() => {
    if (sampleFromUrl?.project_id && !selectedProjectId) {
      setSelectedProjectId(sampleFromUrl.project_id);
    }
  }, [sampleFromUrl?.project_id, selectedProjectId]);
  
  // Redirect to correct URL
  useEffect(() => {
    if (activeDepartment && userDepartments.length > 0) {
      const expectedPath = `/results/${activeDepartment.slug}`;
      if (location.pathname !== expectedPath) {
        navigate(`${expectedPath}${location.search}`, { replace: true });
      }
    }
  }, [activeDepartment, userDepartments, location.pathname, location.search, navigate]);
  
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: samplesProgress } = useProjectSamplesProgress(selectedProjectId);

  // Get current analyte group for active department
  const currentGroups = activeDepartment?.analyte_groups || [];
  const currentGroupKey = activeGroup[activeDepartment?.id || ''] || currentGroups[0]?.key || '';

  const handleGroupChange = (group: string) => {
    if (activeDepartment) {
      setActiveGroup(prev => ({ ...prev, [activeDepartment.id]: group }));
    }
  };

  if (deptsLoading) {
    return <div className="flex items-center justify-center p-8"><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (userDepartments.length === 0) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Access Restricted</AlertTitle>
        <AlertDescription>
          You do not have permission to access any laboratory departments. 
          Please contact your administrator to be assigned to a department.
        </AlertDescription>
      </Alert>
    );
  }

  if (!activeDepartment) {
    return <div className="flex items-center justify-center p-8"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const DeptIcon = iconMap[activeDepartment.icon] || FlaskConical;
  const labSection = slugToLabSection(activeDepartment.slug);

  return (
    <div className="space-y-6 min-w-0">
      {/* Project Selector and Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">Project:</label>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder="Select a project to enter results" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.code} - {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <BulkUploadDialog
            projectId={selectedProjectId}
            projectCode={projects?.find(p => p.id === selectedProjectId)?.code}
            labSection={labSection}
            labLabel={activeDepartment.name}
            analyteGroups={currentGroups.map(g => g.label)}
          />
          <StartAnalysisButton 
            projectId={selectedProjectId} 
            labSection={labSection}
            labLabel={activeDepartment.name}
          />
          <SubmitForReviewButton
            projectId={selectedProjectId}
            labSection={labSection}
            labLabel={activeDepartment.name}
          />
          <WorkOrderDialog 
            projectId={selectedProjectId} 
            labSection={labSection}
            labLabel={activeDepartment.name}
          />
        </div>
      </div>

      {/* Project Progress Summary */}
      {selectedProjectId && samplesProgress && samplesProgress.length > 0 && (
        <ProjectProgressSummary samplesProgress={samplesProgress} />
      )}

      {/* Department Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <DeptIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{activeDepartment.name}</h2>
        </div>
      </div>

      {/* Analyte Group Tabs or Single Grid */}
      <div className="space-y-4">
        {currentGroups.length > 1 ? (
          <Tabs value={currentGroupKey} onValueChange={handleGroupChange}>
            <TabsList className="mb-4">
              {currentGroups.map((group) => (
                <TabsTrigger key={group.key} value={group.key}>
                  {group.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {currentGroups.map((group) => (
              <TabsContent key={group.key} value={group.key}>
                <ResultsEntryGrid 
                  labSection={labSection}
                  analyteGroups={[group.label]}
                  projectId={selectedProjectId}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <ResultsEntryGrid 
            labSection={labSection}
            analyteGroups={currentGroups.map(g => g.label)}
            projectId={selectedProjectId}
          />
        )}
      </div>
    </div>
  );
}
