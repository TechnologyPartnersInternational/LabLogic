import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, X, Save } from 'lucide-react';
import { useMatrixDepths, MatrixDepthsConfig } from '@/hooks/useMatrixDepths';
import { matrices } from '@/constants/matrices';

export default function MatrixConfig() {
  const { data: matrixDepths, isLoading, updateConfig } = useMatrixDepths();
  const [config, setConfig] = useState<MatrixDepthsConfig>({});
  const [newDepthName, setNewDepthName] = useState('');
  const [activeTab, setActiveTab] = useState<string>('water');

  // Load initial config
  useEffect(() => {
    if (matrixDepths) {
      // Default to empty arrays for matrices that might not be in the map
      const initialConfig: MatrixDepthsConfig = { ...matrixDepths };
      matrices.forEach((m) => {
        if (!initialConfig[m.value]) {
          initialConfig[m.value] = [];
        }
      });
      setConfig(initialConfig);
    } else {
      const initialConfig: MatrixDepthsConfig = {};
      matrices.forEach((m) => {
        initialConfig[m.value] = [];
      });
      setConfig(initialConfig);
    }
  }, [matrixDepths]);

  const handleAddDepth = (matrix: string) => {
    const trimmedVal = newDepthName.trim();
    if (!trimmedVal) return;

    setConfig((prev) => {
      const currentList = prev[matrix] || [];
      if (!currentList.includes(trimmedVal)) {
        return {
          ...prev,
          [matrix]: [...currentList, trimmedVal],
        };
      }
      return prev;
    });
    setNewDepthName('');
  };

  const handleRemoveDepth = (matrix: string, oldDepth: string) => {
    setConfig((prev) => {
      const currentList = prev[matrix] || [];
      return {
        ...prev,
        [matrix]: currentList.filter((d) => d !== oldDepth),
      };
    });
  };

  const handleSave = async () => {
    await updateConfig.mutateAsync(config);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matrix Depths Configuration</h1>
          <p className="text-muted-foreground">
            Configure default depth values available during sample registration for each matrix.
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateConfig.isPending}>
          {updateConfig.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Depth Options by Matrix Type</CardTitle>
          <CardDescription>
            These depth options will be presented as checkboxes when an analyst is registering samples.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 flex flex-wrap h-auto bg-muted">
              {matrices.map((m) => (
                <TabsTrigger key={m.value} value={m.value} className="flex-1 sm:flex-none">
                  {m.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {matrices.map((m) => (
              <TabsContent key={m.value} value={m.value}>
                <div className="space-y-4">
                  <div className="flex gap-2 max-w-sm">
                    <Input
                      placeholder={`Add new depth for ${m.label} (e.g. Top)`}
                      value={newDepthName}
                      onChange={(e) => setNewDepthName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddDepth(m.value);
                      }}
                    />
                    <Button type="button" onClick={() => handleAddDepth(m.value)} variant="secondary">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label className="text-sm font-medium text-muted-foreground">Configured Depths ({config[m.value]?.length || 0})</Label>
                    {!config[m.value] || config[m.value].length === 0 ? (
                      <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground bg-muted/20">
                        No depths configured for this matrix. Analysts will only see a custom input format.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {config[m.value].map((depth) => (
                          <div
                            key={depth}
                            className="flex items-center justify-between p-2 pl-3 border rounded-md bg-background shadow-sm group"
                          >
                            <span className="text-sm font-medium">{depth}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-50 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveDepth(m.value, depth)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
