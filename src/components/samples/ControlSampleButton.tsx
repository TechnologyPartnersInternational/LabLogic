import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FlaskConical } from 'lucide-react';

interface ControlSampleButtonProps {
  matrix: string;
  onAddControl: (controlType: string, fieldId: string) => void;
}

const controlTypes = [
  { value: 'FB', label: 'Field Blank', description: 'Blank collected in the field' },
  { value: 'TB', label: 'Trip Blank', description: 'Blank accompanying samples during transport' },
  { value: 'EB', label: 'Equipment Blank', description: 'Rinse water from sampling equipment' },
  { value: 'DUP', label: 'Field Duplicate', description: 'Duplicate sample from same location' },
  { value: 'MS', label: 'Matrix Spike', description: 'Sample fortified with known analytes' },
  { value: 'MSD', label: 'Matrix Spike Duplicate', description: 'Duplicate of matrix spike' },
];

export function ControlSampleButton({ matrix, onAddControl }: ControlSampleButtonProps) {
  const getMatrixPrefix = (matrix: string) => {
    const prefixMap: Record<string, string> = {
      water: 'SW',
      wastewater: 'WW',
      sediment: 'SD',
      soil: 'SL',
      air: 'AM',
      sludge: 'SG',
    };
    return prefixMap[matrix] || 'QC';
  };

  const handleAddControl = (controlType: string) => {
    const prefix = getMatrixPrefix(matrix);
    const fieldId = `${prefix}-${controlType}`;
    onAddControl(controlType, fieldId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <FlaskConical className="w-4 h-4 mr-1" />
          Add QC Sample
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {controlTypes.map((control) => (
          <DropdownMenuItem
            key={control.value}
            onClick={() => handleAddControl(control.value)}
            className="flex flex-col items-start py-2"
          >
            <span className="font-medium">{control.label}</span>
            <span className="text-xs text-muted-foreground">{control.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
