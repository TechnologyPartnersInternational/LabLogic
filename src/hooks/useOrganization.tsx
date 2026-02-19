import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry_suite: string | null;
  accreditation: string | null;
  created_at: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  organizationId: string | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const orgId = (profile as any)?.organization_id as string | null;

  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('organizations' as any)
        .select('*')
        .eq('id', orgId)
        .single();
      if (error) {
        console.error('Error fetching organization:', error);
        return null;
      }
      return data as unknown as Organization;
    },
    enabled: !!user && !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <OrganizationContext.Provider value={{ organization: organization ?? null, isLoading, organizationId: orgId }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
