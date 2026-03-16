import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListPlus } from 'lucide-react';

interface SampleIdGeneratorProps {
  onGenerate: (fieldIds: string[]) => void;
}

type NumberFormat = 'none' | 'two' | 'three';

const NUMBER_FORMAT_OPTIONS: { value: NumberFormat; label: string; example: string }[] = [
  { value: 'none', label: 'No padding', example: '1, 2, 3...' },
  { value: 'two', label: '2 digits', example: '01, 02, 03...' },
  { value: 'three', label: '3 digits', example: '001, 002, 003...' },
];

export function SampleIdGenerator({ onGenerate }: SampleIdGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [startNumber, setStartNumber] = useState(1);
  const [count, setCount] = useState(5);
  const [numberFormat, setNumberFormat] = useState<NumberFormat>('three');

  const formatNumber = (num: number): string => {
    switch (numberFormat) {
      case 'none':
        return num.toString();
      case 'two':
        return num.toString().padStart(2, '0');
      case 'three':
        return num.toString().padStart(3, '0');
      default:
        return num.toString().padStart(3, '0');
    }
  };

  const handleGenerate = () => {
    const fieldIds: string[] = [];
    const prefixPart = prefix.trim() ? `${prefix.trim()}-` : '';
    for (let i = 0; i < count; i++) {
      const num = startNumber + i;
      fieldIds.push(`${prefixPart}${formatNumber(num)}`);
    }
    onGenerate(fieldIds);
    setOpen(false);
  };

  const previewIds = () => {
    const prefixPart = prefix.trim() ? `${prefix.trim()}-` : '';
    const first = `${prefixPart}${formatNumber(startNumber)}`;
    const last = `${prefixPart}${formatNumber(startNumber + count - 1)}`;
    return count > 1 ? `${first} to ${last}` : first;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <ListPlus className="w-4 h-4 mr-1" />
          Generate Series
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Sample IDs</DialogTitle>
          <DialogDescription>
            Quickly add multiple samples with sequential Field IDs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Prefix (optional)</Label>
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="e.g. SW, GW, WW, SL, SD"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label>Number Format</Label>
            <Select value={numberFormat} onValueChange={(v) => setNumberFormat(v as NumberFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NUMBER_FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <span>{opt.label}</span>
                      <span className="text-muted-foreground text-xs">({opt.example})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Number</Label>
              <Input
                type="number"
                min={1}
                value={startNumber}
                onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-2">
              <Label>Count</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              />
            </div>
          </div>

          <div className="p-3 bg-muted rounded-md text-sm">
            <span className="text-muted-foreground">Preview: </span>
            <span className="font-medium">{previewIds()}</span>
          </div>

          <Button type="button" className="w-full" onClick={handleGenerate}>
            Generate {count} Sample{count !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
