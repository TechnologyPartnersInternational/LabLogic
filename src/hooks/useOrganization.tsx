import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry_suite: string | null;
  accreditation: string | null;
}

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  isLoading: true,
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const orgId = (profile as any)?.organization_id;

  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, logo_url, industry_suite, accreditation')
        .eq('id', orgId)
        .single();
      if (error) throw error;
      return data as Organization;
    },
    enabled: !!user && !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <OrganizationContext.Provider value={{ organization: organization ?? null, isLoading }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  return useContext(OrganizationContext);
}
