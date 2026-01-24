import React, { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ResultsEntryGrid } from '@/components/results/ResultsEntryGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Beaker, Activity, Microscope, ShieldAlert } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { StartAnalysisButton } from '@/components/results/StartAnalysisButton';
import { WorkOrderDialog } from '@/components/results/WorkOrderDialog';
import { ProjectProgressSummary } from '@/components/results/SampleProgressIndicator';
import { useProjectSamplesProgress } from '@/hooks/useSampleProgress';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Lab sections with their analyte groups
const labSections = {
  wet_chemistry: {
    label: 'Wet Chemistry',
    icon: Beaker,
    groups: [
      { key: 'physico_chemical', label: 'Physico-Chem' },
      { key: 'cations_anions', label: 'Ions' },
    ],
  },
  instrumentation: {
    label: 'Instrumentation',
    icon: Activity,
    groups: [
      { key: 'heavy_metals', label: 'Heavy Metals' },
      { key: 'hydrocarbons', label: 'Hydrocarbons' },
    ],
  },
  microbiology: {
    label: 'Microbiology',
    icon: Microscope,
    groups: [
      { key: 'microbiology', label: 'Microbiology' },
    ],
  },
};

type LabSection = keyof typeof labSections;
type AnalyteGroup = 'physico_chemical' | 'cations_anions' | 'heavy_metals' | 'hydrocarbons' | 'microbiology';

export default function ResultsEntry() {
  const { isAdmin, getLabSections, canEnterResults } = useAuth();
  
  // Get user's allowed lab sections
  const userLabSections = useMemo(() => {
    if (isAdmin) {
      // Admins can see all lab sections
      return Object.keys(labSections) as LabSection[];
    }
    // Filter to only sections the user has access to
    const sections = getLabSections();
    return (Object.keys(labSections) as LabSection[]).filter(key => 
      sections.includes(key as any)
    );
  }, [isAdmin, getLabSections]);

  // Default to first allowed section
  const [activeLabSection, setActiveLabSection] = useState<LabSection | null>(null);
  const [activeGroup, setActiveGroup] = useState<Record<LabSection, string>>({
    wet_chemistry: 'physico_chemical',
    instrumentation: 'heavy_metals',
    microbiology: 'microbiology',
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Set initial lab section when user sections are loaded
  useEffect(() => {
    if (userLabSections.length > 0 && !activeLabSection) {
      setActiveLabSection(userLabSections[0]);
    }
  }, [userLabSections, activeLabSection]);
  
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: samplesProgress } = useProjectSamplesProgress(selectedProjectId);

  const handleLabSectionChange = (section: string) => {
    if (canEnterResults(section as any)) {
      setActiveLabSection(section as LabSection);
    }
  };

  const handleGroupChange = (group: string) => {
    if (activeLabSection) {
      setActiveGroup(prev => ({
        ...prev,
        [activeLabSection]: group,
      }));
    }
  };

  // Show access denied if user has no lab sections
  if (userLabSections.length === 0) {
    return (
      <MainLayout title="Results Entry" subtitle="Enter and validate laboratory results">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            You do not have permission to access any laboratory sections. 
            Please contact your administrator to be assigned to a lab section.
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  // Wait for active section to be set
  if (!activeLabSection) {
    return (
      <MainLayout title="Results Entry" subtitle="Enter and validate laboratory results">
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </MainLayout>
    );
  }

  const currentSection = labSections[activeLabSection];
  const currentGroup = activeGroup[activeLabSection] as AnalyteGroup;

  return (
    <MainLayout title="Results Entry" subtitle="Enter and validate laboratory results">
      <div className="space-y-6">
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
          
          {/* Lab-specific Actions */}
          <div className="flex items-center gap-2">
            <StartAnalysisButton 
              projectId={selectedProjectId} 
              labSection={activeLabSection}
              labLabel={currentSection.label}
            />
            <WorkOrderDialog 
              projectId={selectedProjectId} 
              labSection={activeLabSection}
              labLabel={currentSection.label}
            />
          </div>
        </div>

        {/* Project Progress Summary */}
        {selectedProjectId && samplesProgress && samplesProgress.length > 0 && (
          <ProjectProgressSummary samplesProgress={samplesProgress} />
        )}

        {/* Lab Section Selector - Dropdown for users with multiple sections */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            {React.createElement(currentSection.icon, { className: "w-5 h-5 text-primary" })}
            <h2 className="text-lg font-semibold">{currentSection.label}</h2>
          </div>
          
          {userLabSections.length > 1 && (
            <Select value={activeLabSection} onValueChange={handleLabSectionChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select lab section" />
              </SelectTrigger>
              <SelectContent>
                {userLabSections.map((key) => {
                  const section = labSections[key];
                  return (
                    <SelectItem key={key} value={key}>
                      {section.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Active Lab Section Content Only */}
        <div className="space-y-4">
          {currentSection.groups.length > 1 ? (
            <Tabs value={currentGroup} onValueChange={handleGroupChange}>
              <TabsList className="mb-4">
                {currentSection.groups.map((group) => (
                  <TabsTrigger key={group.key} value={group.key}>
                    {group.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {currentSection.groups.map((group) => (
                <TabsContent key={group.key} value={group.key}>
                  <ResultsEntryGrid 
                    category={group.key as AnalyteGroup} 
                    projectId={selectedProjectId}
                  />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <ResultsEntryGrid 
              category={currentSection.groups[0].key as AnalyteGroup} 
              projectId={selectedProjectId}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
