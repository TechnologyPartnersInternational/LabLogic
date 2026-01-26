import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Save, Loader2, Pencil, X } from 'lucide-react';
import { useLabSettings, useUpdateLabSetting } from '@/hooks/useLabSettings';

export function LabSettingsCard() {
  const { data: settings, isLoading } = useLabSettings();
  const updateSetting = useUpdateLabSetting();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (key: string, currentValue: string) => {
    setEditingField(key);
    setEditValue(currentValue);
  };

  const handleSave = () => {
    if (!editingField) return;
    
    updateSetting.mutate(
      { key: editingField, value: editValue },
      {
        onSuccess: () => {
          setEditingField(null);
          setEditValue('');
        },
      }
    );
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Lab Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const settingsFields = [
    { key: 'lab_name', label: 'Laboratory Name', description: 'Full name displayed on reports' },
    { key: 'lab_short_name', label: 'Short Name', description: 'Abbreviated name for UI display' },
    { key: 'lab_tagline', label: 'Tagline', description: 'Displayed under the logo' },
    { key: 'lab_accreditation', label: 'Accreditation', description: 'Certification displayed on reports' },
    { key: 'lab_address', label: 'Address', description: 'Physical address for reports' },
    { key: 'lab_phone', label: 'Phone', description: 'Contact phone number' },
    { key: 'lab_email', label: 'Email', description: 'Contact email address' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Lab Settings
        </CardTitle>
        <CardDescription>
          Configure laboratory information displayed in reports and COA documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {settingsFields.map((field) => {
            const currentValue = settings?.[field.key as keyof typeof settings] || '';
            const isEditing = editingField === field.key;

            return (
              <div key={field.key} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-medium">{field.label}</Label>
                  <p className="text-xs text-muted-foreground mb-2">{field.description}</p>
                  
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateSetting.isPending}
                      >
                        {updateSetting.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancel}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate">
                        {currentValue || <span className="text-muted-foreground italic">Not set</span>}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => handleStartEdit(field.key, currentValue)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
