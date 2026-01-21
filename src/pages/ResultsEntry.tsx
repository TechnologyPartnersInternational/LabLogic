import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ResultsEntryGrid } from '@/components/results/ResultsEntryGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Beaker, Activity, Microscope } from 'lucide-react';

export default function ResultsEntry() {
  const [activeTab, setActiveTab] = useState('physico_chemical');

  return (
    <MainLayout title="Results Entry" subtitle="Enter and validate laboratory results">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="physico_chemical" className="flex items-center gap-2">
              <Beaker className="w-4 h-4" />
              <span className="hidden sm:inline">Physico-Chem</span>
            </TabsTrigger>
            <TabsTrigger value="cations_anions" className="flex items-center gap-2">
              <Beaker className="w-4 h-4" />
              <span className="hidden sm:inline">Ions</span>
            </TabsTrigger>
            <TabsTrigger value="heavy_metals" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Metals</span>
            </TabsTrigger>
            <TabsTrigger value="hydrocarbons" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Hydrocarbons</span>
            </TabsTrigger>
            <TabsTrigger value="microbiology" className="flex items-center gap-2">
              <Microscope className="w-4 h-4" />
              <span className="hidden sm:inline">Micro</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="physico_chemical" className="mt-6">
            <ResultsEntryGrid category="physico_chemical" />
          </TabsContent>

          <TabsContent value="cations_anions" className="mt-6">
            <ResultsEntryGrid category="cations_anions" />
          </TabsContent>

          <TabsContent value="heavy_metals" className="mt-6">
            <ResultsEntryGrid category="heavy_metals" />
          </TabsContent>

          <TabsContent value="hydrocarbons" className="mt-6">
            <ResultsEntryGrid category="hydrocarbons" />
          </TabsContent>

          <TabsContent value="microbiology" className="mt-6">
            <ResultsEntryGrid category="microbiology" />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
