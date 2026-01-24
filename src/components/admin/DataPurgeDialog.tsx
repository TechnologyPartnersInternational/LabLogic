import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function DataPurgeDialog() {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState<{ samples: number; results: number; validationErrors: number } | null>(null);
  const { toast } = useToast();

  const CONFIRM_PHRASE = 'DELETE ALL DATA';

  const fetchStats = async () => {
    const [samplesRes, resultsRes, validationRes] = await Promise.all([
      supabase.from('samples').select('*', { count: 'exact', head: true }),
      supabase.from('results').select('*', { count: 'exact', head: true }),
      supabase.from('validation_errors').select('*', { count: 'exact', head: true }),
    ]);

    setStats({
      samples: samplesRes.count || 0,
      results: resultsRes.count || 0,
      validationErrors: validationRes.count || 0,
    });
  };

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      await fetchStats();
    } else {
      setConfirmText('');
    }
  };

  const handleProceed = () => {
    setOpen(false);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (confirmText !== CONFIRM_PHRASE) {
      toast({
        title: 'Confirmation Failed',
        description: `Please type "${CONFIRM_PHRASE}" exactly to confirm.`,
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Delete in order: validation_errors -> results -> samples (due to FK constraints)
      const { error: validationError } = await supabase
        .from('validation_errors')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (validationError) throw validationError;

      const { error: resultsError } = await supabase
        .from('results')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (resultsError) throw resultsError;

      const { error: samplesError } = await supabase
        .from('samples')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (samplesError) throw samplesError;

      toast({
        title: 'Data Purged Successfully',
        description: `Deleted ${stats?.results || 0} results, ${stats?.samples || 0} samples, and ${stats?.validationErrors || 0} validation errors.`,
      });

      setConfirmOpen(false);
      setConfirmText('');
    } catch (error: any) {
      console.error('Purge error:', error);
      toast({
        title: 'Purge Failed',
        description: error.message || 'An error occurred while purging data.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Initial Warning Dialog */}
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="gap-2">
            <Trash2 className="w-4 h-4" />
            Purge All Sample Data
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone: Data Purge
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action will <strong>permanently delete</strong> all sample-related data from the system:
              </p>
              
              {stats && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Samples:</span>
                    <span className="font-bold text-destructive">{stats.samples.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Results:</span>
                    <span className="font-bold text-destructive">{stats.results.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validation Errors:</span>
                    <span className="font-bold text-destructive">{stats.validationErrors.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <p className="text-sm">
                <strong>Configuration data will be preserved:</strong> Parameters, methods, clients, projects, and user accounts will remain intact.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button 
              variant="destructive" 
              onClick={handleProceed}
              disabled={!stats || (stats.samples === 0 && stats.results === 0)}
            >
              Proceed to Confirmation
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Final Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={(isOpen) => {
        if (!isDeleting) {
          setConfirmOpen(isOpen);
          if (!isOpen) setConfirmText('');
        }
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Final Confirmation Required
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action <strong>cannot be undone</strong>. All sample data, results, and validation errors will be permanently removed.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-text">
                  Type <code className="bg-muted px-1 py-0.5 rounded font-mono text-destructive">{CONFIRM_PHRASE}</code> to confirm:
                </Label>
                <Input
                  id="confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type confirmation phrase..."
                  className="font-mono"
                  disabled={isDeleting}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmText !== CONFIRM_PHRASE || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Permanently Delete All Data'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
