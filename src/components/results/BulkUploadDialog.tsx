import { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useSamplesByProject } from '@/hooks/useSamples';
import { useResultsByProject, useUpdateResultsBatch } from '@/hooks/useResults';
import { useParameterConfigs } from '@/hooks/useParameterConfigs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BulkUploadDialogProps {
  projectId: string;
  projectCode?: string;
  labSection: string;
  labLabel: string;
}

// Maps lab section to analyte groups
const labSectionToAnalyteGroups: Record<string, string[]> = {
  wet_chemistry: ['Physico-Chemical', 'Anions', 'Cations'],
  instrumentation: ['Heavy Metals', 'Hydrocarbons'],
  microbiology: ['Microbiology'],
};

export function BulkUploadDialog({ projectId, projectCode, labSection, labLabel }: BulkUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploadedData, setUploadedData] = useState<Record<string, Record<string, string>> | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { data: samples } = useSamplesByProject(projectId);
  const { data: allResults } = useResultsByProject(projectId);
  const { data: parameterConfigs } = useParameterConfigs();
  const updateResults = useUpdateResultsBatch();

  // Get relevant configs for this lab section
  const getRelevantConfigs = () => {
    if (!allResults || !parameterConfigs) return [];
    
    const analyteGroups = labSectionToAnalyteGroups[labSection] || [];
    
    const configIds = new Set<string>();
    allResults.forEach((result) => {
      const resultLabSection = result.parameter_config?.parameter?.lab_section;
      const resultAnalyteGroup = result.parameter_config?.parameter?.analyte_group;
      if (resultLabSection === labSection && analyteGroups.includes(resultAnalyteGroup || '')) {
        configIds.add(result.parameter_config_id);
      }
    });
    
    return parameterConfigs.filter(config => configIds.has(config.id));
  };

  // Get samples with results for this lab section
  const getSamplesWithResults = () => {
    if (!samples || !allResults) return [];
    
    const analyteGroups = labSectionToAnalyteGroups[labSection] || [];
    const sampleIds = new Set<string>();
    
    allResults.forEach((result) => {
      const resultLabSection = result.parameter_config?.parameter?.lab_section;
      const resultAnalyteGroup = result.parameter_config?.parameter?.analyte_group;
      if (resultLabSection === labSection && analyteGroups.includes(resultAnalyteGroup || '')) {
        sampleIds.add(result.sample_id);
      }
    });
    
    return samples.filter(s => sampleIds.has(s.id));
  };

  // Build result map for lookup
  const buildResultMap = () => {
    if (!allResults) return new Map<string, Map<string, typeof allResults[0]>>();
    
    const map = new Map<string, Map<string, typeof allResults[0]>>();
    allResults.forEach((result) => {
      if (!map.has(result.sample_id)) {
        map.set(result.sample_id, new Map());
      }
      map.get(result.sample_id)!.set(result.parameter_config_id, result);
    });
    
    return map;
  };

  const handleDownloadTemplate = async () => {
    const relevantConfigs = getRelevantConfigs();
    const samplesWithResults = getSamplesWithResults();

    if (samplesWithResults.length === 0 || relevantConfigs.length === 0) {
      toast.error('No samples or parameters available for this lab section');
      return;
    }

    // Create workbook using ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(labLabel);

    // Build headers: Sample ID, Field ID, Matrix, then each parameter abbreviation with unit
    const headers = ['Sample ID', 'Field ID', 'Matrix'];
    const subHeaders = ['', '', '']; // For units
    
    // Group configs by parameter
    const paramGroups = new Map<string, typeof relevantConfigs[0][]>();
    relevantConfigs.forEach(config => {
      const paramId = config.parameter_id;
      if (!paramGroups.has(paramId)) {
        paramGroups.set(paramId, []);
      }
      paramGroups.get(paramId)!.push(config);
    });

    // For each unique parameter, add a column
    const paramColumns: Array<{ paramId: string; abbreviation: string; configsByMatrix: Map<string, typeof relevantConfigs[0]> }> = [];
    paramGroups.forEach((configs, paramId) => {
      const abbreviation = configs[0].parameter?.abbreviation || '';
      const configsByMatrix = new Map<string, typeof relevantConfigs[0]>();
      configs.forEach(c => configsByMatrix.set(c.matrix, c));
      paramColumns.push({ paramId, abbreviation, configsByMatrix });
      
      // Use first config's unit for header
      const unit = configs[0].canonical_unit || '';
      headers.push(abbreviation);
      subHeaders.push(`(${unit})`);
    });

    // Add header rows
    worksheet.addRow(headers);
    worksheet.addRow(subHeaders);

    // Style header rows
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    worksheet.getRow(2).font = { italic: true };

    // Set column widths
    worksheet.columns = [
      { width: 15 }, // Sample ID
      { width: 15 }, // Field ID
      { width: 12 }, // Matrix
      ...paramColumns.map(() => ({ width: 12 })),
    ];

    // Build data rows
    samplesWithResults.forEach(sample => {
      const row = [sample.sample_id, sample.field_id || '', sample.matrix];
      paramColumns.forEach(col => {
        const config = col.configsByMatrix.get(sample.matrix);
        if (config) {
          // Leave cell empty for analyst to fill
          row.push('');
        } else {
          row.push('N/A');
        }
      });
      worksheet.addRow(row);
    });

    // Create a mapping sheet for reference
    const mappingSheet = workbook.addWorksheet('Parameter Reference');
    mappingSheet.addRow(['Parameter', 'Abbreviation', 'Unit', 'MDL', 'Matrix', 'Config ID']);
    mappingSheet.getRow(1).font = { bold: true };
    
    relevantConfigs.forEach(config => {
      mappingSheet.addRow([
        config.parameter?.name || '',
        config.parameter?.abbreviation || '',
        config.canonical_unit,
        config.mdl.toString(),
        config.matrix,
        config.id,
      ]);
    });

    // Download with project code in filename
    const filePrefix = projectCode || 'Project';
    const sanitizedPrefix = filePrefix.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizedPrefix}_${labLabel}_Template.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Template downloaded');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Get first sheet (the data sheet)
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        setParseErrors(['File appears to be empty']);
        return;
      }
      
      // Convert to array of rows
      const jsonData: (string | number | null)[][] = [];
      worksheet.eachRow((row, rowNumber) => {
        const rowValues: (string | number | null)[] = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          // Pad with nulls if there are gaps
          while (rowValues.length < colNumber - 1) {
            rowValues.push(null);
          }
          rowValues.push(cell.value as string | number | null);
        });
        jsonData.push(rowValues);
      });
      
      if (jsonData.length < 3) {
        setParseErrors(['File appears to be empty or missing data rows']);
        return;
      }

      const headers = jsonData[0] as string[];
      // Skip units row (index 1)
      const dataRows = jsonData.slice(2);

      // Parse the data
      const errors: string[] = [];
      const parsedData: Record<string, Record<string, string>> = {};

      // Get parameter abbreviations from headers (skip Sample ID, Field ID, and Matrix)
      const paramAbbreviations = headers.slice(3);

      dataRows.forEach((row, rowIndex) => {
        if (!row || row.length < 2) return;
        
        const sampleId = String(row[0] || '').trim();
        // Field ID at index 1 is informational only, skip it
        const matrix = String(row[2] || '').trim().toLowerCase();
        
        if (!sampleId || sampleId === '') return;

        // Find the sample
        const sample = getSamplesWithResults().find(s => s.sample_id === sampleId);
        if (!sample) {
          errors.push(`Row ${rowIndex + 3}: Sample ID "${sampleId}" not found`);
          return;
        }

        if (sample.matrix.toLowerCase() !== matrix) {
          errors.push(`Row ${rowIndex + 3}: Matrix mismatch for ${sampleId} (expected ${sample.matrix}, got ${matrix})`);
        }

        parsedData[sample.id] = {};

        // Process each parameter column (offset by 3 for Sample ID, Field ID, Matrix)
        paramAbbreviations.forEach((abbr, colIndex) => {
          const cellValue = row[colIndex + 3];
          if (cellValue === undefined || cellValue === null || cellValue === '' || cellValue === 'N/A') {
            return;
          }

          // Find the config for this parameter and matrix
          const relevantConfigs = getRelevantConfigs();
          const config = relevantConfigs.find(c => 
            c.parameter?.abbreviation === abbr && c.matrix === sample.matrix
          );

          if (config) {
            parsedData[sample.id][config.id] = String(cellValue).trim();
          }
        });
      });

      setParseErrors(errors);
      setUploadedData(parsedData);

      // Count valid entries
      let entryCount = 0;
      Object.values(parsedData).forEach(configs => {
        entryCount += Object.keys(configs).length;
      });

      if (entryCount > 0) {
        toast.success(`Parsed ${entryCount} results from ${Object.keys(parsedData).length} samples`);
      } else {
        toast.warning('No valid results found in the file');
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      setParseErrors(['Failed to parse the Excel file. Please check the format.']);
    }
  };

  const handleUploadResults = async () => {
    if (!uploadedData || !user) return;

    setIsUploading(true);
    const resultMap = buildResultMap();
    const updates: Array<{ 
      id: string; 
      entered_value: string; 
      entered_by: string; 
      entered_at: string; 
      canonical_value: number | null; 
      is_below_mdl: boolean;
    }> = [];

    const relevantConfigs = getRelevantConfigs();
    const configMap = new Map(relevantConfigs.map(c => [c.id, c]));

    Object.entries(uploadedData).forEach(([sampleId, configs]) => {
      Object.entries(configs).forEach(([configId, value]) => {
        const sampleResults = resultMap.get(sampleId);
        const result = sampleResults?.get(configId);
        
        if (result && result.status === 'draft') {
          const config = configMap.get(configId);
          const numValue = parseFloat(value);
          const isBelowMdl = !isNaN(numValue) && config && numValue < config.mdl;

          updates.push({
            id: result.id,
            entered_value: value,
            entered_by: user.id,
            entered_at: new Date().toISOString(),
            canonical_value: isNaN(numValue) ? null : numValue,
            is_below_mdl: isBelowMdl || false,
          });
        }
      });
    });

    if (updates.length === 0) {
      toast.warning('No results to update (results may not be in draft status)');
      setIsUploading(false);
      return;
    }

    try {
      await updateResults.mutateAsync(updates);
      toast.success(`${updates.length} results uploaded successfully`);
      setOpen(false);
      setUploadedData(null);
      setParseErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading results:', error);
      toast.error('Failed to upload results');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setUploadedData(null);
    setParseErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Count entries in uploaded data
  const uploadedCount = uploadedData 
    ? Object.values(uploadedData).reduce((sum, configs) => sum + Object.keys(configs).length, 0)
    : 0;

  const isDisabled = !projectId;

  return (
    <Dialog open={open} onOpenChange={(o) => o ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={isDisabled}>
          <Upload className="w-4 h-4 mr-2" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Bulk Upload Results - {labLabel}
          </DialogTitle>
          <DialogDescription>
            Download the template, fill in your results, then upload to populate the grid.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Download Template */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Step 1: Download Template</Label>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
              <Download className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Get the Excel template</p>
                <p className="text-xs text-muted-foreground">
                  Pre-populated with samples and parameters for this project and lab section
                </p>
              </div>
              <Button onClick={handleDownloadTemplate} variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Step 2: Upload Completed File */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Step 2: Upload Completed File</Label>
            <div className="p-4 border rounded-lg bg-muted/30">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Accepts .xlsx or .xls files
              </p>
            </div>
          </div>

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Some issues were found:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {parseErrors.slice(0, 5).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {parseErrors.length > 5 && (
                    <li>...and {parseErrors.length - 5} more issues</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {uploadedData && uploadedCount > 0 && (
            <Alert className="border-success/50 bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Ready to upload <Badge variant="secondary">{uploadedCount}</Badge> results 
                  for <Badge variant="secondary">{Object.keys(uploadedData).length}</Badge> samples
                </span>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUploadResults} 
            disabled={!uploadedData || uploadedCount === 0 || isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload Results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
