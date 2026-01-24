import { useState } from 'react';
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
import { Beaker, Activity, Microscope } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { StartAnalysisButton } from '@/components/results/StartAnalysisButton';
import { WorkOrderDialog } from '@/components/results/WorkOrderDialog';
import { ProjectProgressSummary } from '@/components/results/SampleProgressIndicator';
import { useProjectSamplesProgress } from '@/hooks/useSampleProgress';

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
  const [activeLabSection, setActiveLabSection] = useState<LabSection>('wet_chemistry');
  const [activeGroup, setActiveGroup] = useState<Record<LabSection, string>>({
    wet_chemistry: 'physico_chemical',
    instrumentation: 'heavy_metals',
    microbiology: 'microbiology',
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: samplesProgress } = useProjectSamplesProgress(selectedProjectId);

  const handleLabSectionChange = (section: string) => {
    setActiveLabSection(section as LabSection);
  };

  const handleGroupChange = (group: string) => {
    setActiveGroup(prev => ({
      ...prev,
      [activeLabSection]: group,
    }));
  };

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

        {/* Lab Section Tabs */}
        <Tabs value={activeLabSection} onValueChange={handleLabSectionChange}>
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            {Object.entries(labSections).map(([key, section]) => {
              const Icon = section.icon;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{section.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(labSections).map(([sectionKey, section]) => (
            <TabsContent key={sectionKey} value={sectionKey} className="mt-6">
              {/* Analyte Group Sub-tabs */}
              {section.groups.length > 1 ? (
                <Tabs value={activeGroup[sectionKey as LabSection]} onValueChange={handleGroupChange}>
                  <TabsList className="mb-4">
                    {section.groups.map((group) => (
                      <TabsTrigger key={group.key} value={group.key}>
                        {group.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {section.groups.map((group) => (
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
                  category={section.groups[0].key as AnalyteGroup} 
                  projectId={selectedProjectId}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
