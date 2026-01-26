import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Building2, Save, Loader2, Pencil, X, Phone, Mail, MapPin } from 'lucide-react';
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

  const renderField = (key: string, label: string, currentValue: string, icon?: React.ReactNode) => {
    const isEditing = editingField === key;

    return (
      <div className="flex items-center gap-3">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="flex-1 min-w-0">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          {isEditing ? (
            <div className="flex gap-2 mt-1">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 h-8"
                autoFocus
              />
              <Button
                size="sm"
                className="h-8"
                onClick={handleSave}
                disabled={updateSetting.isPending}
              >
                {updateSetting.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={handleCancel}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <span className="text-sm">
                {currentValue || <span className="text-muted-foreground italic">Not set</span>}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleStartEdit(key, currentValue)}
              >
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Laboratory Settings
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Laboratory Settings
        </CardTitle>
        <CardDescription>
          Configure laboratory information displayed in reports and COA documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Identity Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Identity</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted/50 space-y-3">
              {renderField('lab_name', 'Laboratory Name', settings?.lab_name || '')}
            </div>
            <div className="p-3 rounded-lg bg-muted/50 space-y-3">
              {renderField('lab_short_name', 'Short Name', settings?.lab_short_name || '')}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted/50 space-y-3">
              {renderField('lab_tagline', 'Tagline', settings?.lab_tagline || '')}
            </div>
            <div className="p-3 rounded-lg bg-muted/50 space-y-3">
              {renderField('lab_accreditation', 'Accreditation', settings?.lab_accreditation || '')}
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact Information Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Contact Information</h3>
          <div className="p-3 rounded-lg bg-muted/50 space-y-4">
            {renderField('lab_address', 'Address', settings?.lab_address || '', <MapPin className="w-4 h-4" />)}
            <Separator className="my-2" />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                {renderField('lab_phone', 'Phone', settings?.lab_phone || '', <Phone className="w-4 h-4" />)}
              </div>
              <div>
                {renderField('lab_email', 'Email', settings?.lab_email || '', <Mail className="w-4 h-4" />)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
