import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, FlaskConical, TestTube, Beaker, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useGlobalSearch, SearchResultType } from '@/hooks/useGlobalSearch';
import { cn } from '@/lib/utils';

const typeIcons: Record<SearchResultType, React.ReactNode> = {
  project: <FileText className="w-4 h-4" />,
  sample: <FlaskConical className="w-4 h-4" />,
  parameter: <TestTube className="w-4 h-4" />,
  method: <Beaker className="w-4 h-4" />,
  client: <Users className="w-4 h-4" />,
};

const typeLabels: Record<SearchResultType, string> = {
  project: 'Projects',
  sample: 'Samples',
  parameter: 'Parameters',
  method: 'Methods',
  client: 'Clients',
};

export function GlobalSearchBar() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    query,
    setQuery,
    currentPageResults,
    otherResults,
    isLoading,
    isOpen,
    setIsOpen,
  } = useGlobalSearch();

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(url);
  };

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  const hasResults = currentPageResults.length > 0 || otherResults.length > 0;
  const showPopover = isOpen && query.length >= 2;

  return (
    <Popover open={showPopover} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search samples, projects..."
            className="pl-9 bg-background border-border"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length >= 2) {
                setIsOpen(true);
              }
            }}
            onFocus={() => {
              if (query.length >= 2) {
                setIsOpen(true);
              }
            }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {isLoading && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Searching...
              </div>
            )}
            
            {!isLoading && !hasResults && query.length >= 2 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}

            {currentPageResults.length > 0 && (
              <CommandGroup heading="On this page">
                {currentPageResults.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => handleSelect(result.url)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <span className="text-muted-foreground">
                      {typeIcons[result.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {typeLabels[result.type]}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {otherResults.length > 0 && (
              <CommandGroup heading={currentPageResults.length > 0 ? "Other results" : "Results"}>
                {otherResults.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => handleSelect(result.url)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <span className="text-muted-foreground">
                      {typeIcons[result.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {typeLabels[result.type]}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
