import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { differenceInDays, parseISO } from 'date-fns';

export interface ComplianceDocument {
  id: string;
  document_type: string;
  name: string;
  description: string | null;
  issuing_authority: string | null;
  document_number: string | null;
  issue_date: string;
  expiry_date: string;
  status: string;
  reminder_days: number;
  file_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ComplianceDocumentInsert = Omit<ComplianceDocument, 'id' | 'created_at' | 'updated_at' | 'status'>;

const documentTypeLabels: Record<string, string> = {
  calibration_certificate: 'Calibration Certificate',
  regulatory_permit: 'Regulatory Permit',
  accreditation: 'Accreditation',
  license: 'License',
  other: 'Other',
};

export function getDocumentTypeLabel(type: string): string {
  return documentTypeLabels[type] || type;
}

export function calculateStatus(expiryDate: string, reminderDays: number): 'active' | 'expiring_soon' | 'expired' {
  const today = new Date();
  const expiry = parseISO(expiryDate);
  const daysUntilExpiry = differenceInDays(expiry, today);

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= reminderDays) return 'expiring_soon';
  return 'active';
}

export function useComplianceDocuments() {
  return useQuery({
    queryKey: ['compliance-documents'],
    queryFn: async (): Promise<ComplianceDocument[]> => {
      const { data, error } = await supabase
        .from('compliance_documents')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (error) {
        console.error('Error fetching compliance documents:', error);
        throw error;
      }

      // Calculate computed status for each document
      return (data || []).map(doc => ({
        ...doc,
        status: calculateStatus(doc.expiry_date, doc.reminder_days || 30),
      }));
    },
  });
}

export function useAddComplianceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: ComplianceDocumentInsert) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('compliance_documents')
        .insert({
          ...document,
          created_by: userData.user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-documents'] });
      toast.success('Document added successfully');
    },
    onError: (error) => {
      console.error('Error adding compliance document:', error);
      toast.error('Failed to add document');
    },
  });
}

export function useUpdateComplianceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ComplianceDocument> }) => {
      const { error } = await supabase
        .from('compliance_documents')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-documents'] });
      toast.success('Document updated successfully');
    },
    onError: (error) => {
      console.error('Error updating compliance document:', error);
      toast.error('Failed to update document');
    },
  });
}

export function useDeleteComplianceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('compliance_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-documents'] });
      toast.success('Document deleted');
    },
    onError: (error) => {
      console.error('Error deleting compliance document:', error);
      toast.error('Failed to delete document');
    },
  });
}
