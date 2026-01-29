import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

export type SearchResultType = 'project' | 'sample' | 'parameter' | 'method' | 'client';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  url: string;
}

interface UseGlobalSearchResult {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  currentPageResults: SearchResult[];
  otherResults: SearchResult[];
  isLoading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const getPageContext = (pathname: string): SearchResultType | null => {
  if (pathname.includes('/projects')) return 'project';
  if (pathname.includes('/samples')) return 'sample';
  if (pathname.includes('/config/parameters')) return 'parameter';
  if (pathname.includes('/config/methods')) return 'method';
  return null;
};

export function useGlobalSearch(): UseGlobalSearchResult {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const currentContext = getPageContext(location.pathname);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const searchTerm = `%${query}%`;
      const results: SearchResult[] = [];

      // Search projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, code, title, client:clients(name)')
        .or(`code.ilike.${searchTerm},title.ilike.${searchTerm}`)
        .limit(5);

      if (projects) {
        projects.forEach(p => {
          results.push({
            id: p.id,
            type: 'project',
            title: p.code,
            subtitle: p.title,
            url: `/projects/${p.id}`,
          });
        });
      }

      // Search samples
      const { data: samples } = await supabase
        .from('samples')
        .select('id, sample_id, field_id, matrix, project:projects(code)')
        .or(`sample_id.ilike.${searchTerm},field_id.ilike.${searchTerm}`)
        .limit(5);

      if (samples) {
        samples.forEach(s => {
          results.push({
            id: s.id,
            type: 'sample',
            title: s.sample_id,
            subtitle: s.field_id || s.matrix,
            url: `/samples`,
          });
        });
      }

      // Search parameters
      const { data: parameters } = await supabase
        .from('parameters')
        .select('id, name, abbreviation, analyte_group')
        .or(`name.ilike.${searchTerm},abbreviation.ilike.${searchTerm}`)
        .limit(5);

      if (parameters) {
        parameters.forEach(p => {
          results.push({
            id: p.id,
            type: 'parameter',
            title: p.name,
            subtitle: p.abbreviation,
            url: `/config/parameters`,
          });
        });
      }

      // Search methods
      const { data: methods } = await supabase
        .from('methods')
        .select('id, code, name, organization')
        .or(`code.ilike.${searchTerm},name.ilike.${searchTerm}`)
        .limit(5);

      if (methods) {
        methods.forEach(m => {
          results.push({
            id: m.id,
            type: 'method',
            title: m.code,
            subtitle: m.name,
            url: `/config/methods`,
          });
        });
      }

      // Search clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, contact_name')
        .or(`name.ilike.${searchTerm},contact_name.ilike.${searchTerm}`)
        .limit(5);

      if (clients) {
        clients.forEach(c => {
          results.push({
            id: c.id,
            type: 'client',
            title: c.name,
            subtitle: c.contact_name || undefined,
            url: `/projects`,
          });
        });
      }

      return results;
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 30,
  });

  const { currentPageResults, otherResults } = useMemo(() => {
    if (!currentContext) {
      return { currentPageResults: [], otherResults: searchResults };
    }

    const current = searchResults.filter(r => r.type === currentContext);
    const other = searchResults.filter(r => r.type !== currentContext);

    return { currentPageResults: current, otherResults: other };
  }, [searchResults, currentContext]);

  return {
    query,
    setQuery,
    results: searchResults,
    currentPageResults,
    otherResults,
    isLoading,
    isOpen,
    setIsOpen,
  };
}
