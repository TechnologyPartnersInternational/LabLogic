import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ListPlus } from 'lucide-react';

interface SampleIdGeneratorProps {
  onGenerate: (fieldIds: string[]) => void;
}

export function SampleIdGenerator({ onGenerate }: SampleIdGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [startNumber, setStartNumber] = useState(1);
  const [count, setCount] = useState(5);

  const handleGenerate = () => {
    const fieldIds: string[] = [];
    const prefixPart = prefix.trim() ? `${prefix.trim()}-` : '';
    for (let i = 0; i < count; i++) {
      const num = startNumber + i;
      const paddedNum = num.toString().padStart(3, '0');
      fieldIds.push(`${prefixPart}${paddedNum}`);
    }
    onGenerate(fieldIds);
    setOpen(false);
  };

  const previewIds = () => {
    const prefixPart = prefix.trim() ? `${prefix.trim()}-` : '';
    const first = `${prefixPart}${startNumber.toString().padStart(3, '0')}`;
    const last = `${prefixPart}${(startNumber + count - 1).toString().padStart(3, '0')}`;
    return count > 1 ? `${first} to ${last}` : first;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <ListPlus className="w-4 h-4 mr-1" />
          Generate Series
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Generate Sample IDs</Label>
            <p className="text-xs text-muted-foreground">
              Quickly add multiple samples with sequential Field IDs
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Prefix (optional)</Label>
              <Input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="e.g. SW, GW, WW, SL, SD"
                maxLength={10}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Start Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={startNumber}
                  onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Count</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>
            </div>

            <div className="p-2 bg-muted rounded text-xs">
              <span className="text-muted-foreground">Preview: </span>
              <span className="font-medium">{previewIds()}</span>
            </div>

            <Button type="button" className="w-full" onClick={handleGenerate}>
              Generate {count} Sample{count !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
