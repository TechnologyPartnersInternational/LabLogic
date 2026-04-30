import { useState } from 'react';
import { useProjectReportData } from '@/hooks/useReportData';
import { useLabSettings } from '@/hooks/useLabSettings';
import { useOrganization } from '@/hooks/useOrganization';
import { buildCOAWorkbook, downloadWorkbook } from '@/lib/coaExcelBuilder';
import { buildCOAPdf, downloadPdf } from '@/lib/coaPdfBuilder';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface COAExportDialogProps {
  projectId: string;
  projectCode: string;
}

type ExportFormat = 'excel' | 'csv';

export function COAExportDialog({ projectId, projectCode }: COAExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [includeMethodInfo, setIncludeMethodInfo] = useState(true);
  const [includeMDLs, setIncludeMDLs] = useState(true);
  const [groupByLabSection, setGroupByLabSection] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const { data: reportData, isLoading, error } = useProjectReportData(projectId);
  const { data: labSettings } = useLabSettings();

  const handleExport = async () => {
    if (!reportData || reportData.results.length === 0) {
      toast.error('No approved results to export');
      return;
    }

    setIsExporting(true);
    const sanitizedCode = projectCode.replace(/[^a-zA-Z0-9-_]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    try {
      if (format === 'excel') {
        // Use ExcelJS for styled Excel export
        const workbook = await buildCOAWorkbook(reportData, {
          includeMethodInfo,
          includeMDLs,
          groupByLabSection,
          labSettings,
        });
        const fileName = `COA_${sanitizedCode}_${dateStr}.xlsx`;
        await downloadWorkbook(workbook, fileName);
        toast.success(`Report exported: ${fileName}`);
      } else {
        // Generate CSV using native JavaScript (no xlsx dependency)
        const csv = createCSVContent(
          reportData.results,
          reportData.samples,
          includeMethodInfo,
          includeMDLs
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `COA_${sanitizedCode}_${dateStr}.csv`;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`Report exported: ${fileName}`);
      }

      setOpen(false);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Export COA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Export Certificate of Analysis
          </DialogTitle>
          <DialogDescription>
            Export approved results for project {projectCode}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
            Error loading report data
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {reportData.summary.allApproved ? (
                  <Badge className="gap-1 bg-emerald-500">
                    <CheckCircle className="w-3 h-3" />
                    All Approved
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {reportData.summary.pendingResults} Pending
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Samples</span>
                <span className="font-medium">{reportData.summary.totalSamples}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Approved Results</span>
                <span className="font-medium">{reportData.summary.approvedResults}</span>
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-4">
              <div>
                <Label>Export Format</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx) - Styled</SelectItem>
                    <SelectItem value="csv">CSV (.csv) - Plain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeMethodInfo"
                    checked={includeMethodInfo}
                    onCheckedChange={(c) => setIncludeMethodInfo(c === true)}
                  />
                  <Label htmlFor="includeMethodInfo" className="font-normal">
                    Include analytical method codes
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeMDLs"
                    checked={includeMDLs}
                    onCheckedChange={(c) => setIncludeMDLs(c === true)}
                  />
                  <Label htmlFor="includeMDLs" className="font-normal">
                    Include MDL/LOQ values
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="groupByLabSection"
                    checked={groupByLabSection}
                    onCheckedChange={(c) => setGroupByLabSection(c === true)}
                    disabled={format === 'csv'}
                  />
                  <Label htmlFor="groupByLabSection" className="font-normal">
                    Separate sheets by lab section (Excel only)
                  </Label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={reportData.summary.approvedResults === 0 || isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export Report
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// Simple matrix builder for CSV export
interface SampleInfo {
  id: string;
  sample_id: string;
  field_id: string | null;
  matrix: string;
  depth: string | null;
}

interface ResultInfo {
  sample_name: string;
  parameter_abbr: string;
  entered_value: string | null;
  canonical_unit: string | null;
  is_below_mdl: boolean | null;
  mdl: number;
  loq: number;
  method_code: string;
}

// Escape CSV cell value
function escapeCSVCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function createCSVContent(
  results: ResultInfo[],
  samples: SampleInfo[],
  includeMethodInfo: boolean,
  includeMDLs: boolean
): string {
  const parameterSet = new Map<string, { unit: string; mdl: number; loq: number; method: string }>();
  for (const r of results) {
    if (!parameterSet.has(r.parameter_abbr)) {
      parameterSet.set(r.parameter_abbr, {
        unit: r.canonical_unit || '',
        mdl: r.mdl,
        loq: r.loq,
        method: r.method_code,
      });
    }
  }
  const parameters = Array.from(parameterSet.keys());
  const paramMetadata = Array.from(parameterSet.values());

  const sampleIdsWithResults = new Set(results.map(r => r.sample_name));
  const orderedSamples = samples.filter(s => sampleIdsWithResults.has(s.sample_id));

  const resultMap = new Map<string, Map<string, ResultInfo>>();
  for (const r of results) {
    if (!resultMap.has(r.sample_name)) {
      resultMap.set(r.sample_name, new Map());
    }
    resultMap.get(r.sample_name)!.set(r.parameter_abbr, r);
  }

  const rows: string[][] = [];

  const headerRow = ['Sample ID', 'Field ID', 'Depth', ...parameters];
  rows.push(headerRow);

  const unitsRow = ['', '', 'Unit:', ...paramMetadata.map(p => p.unit)];
  rows.push(unitsRow);

  if (includeMDLs) {
    rows.push(['', '', 'MDL:', ...paramMetadata.map(p => p.mdl.toString())]);
    rows.push(['', '', 'LOQ:', ...paramMetadata.map(p => p.loq.toString())]);
  }

  if (includeMethodInfo) {
    rows.push(['', '', 'Method:', ...paramMetadata.map(p => p.method)]);
  }

  rows.push(Array(headerRow.length).fill(''));

  let prevSampleId = '';
  let prevFieldId = '';

  for (const sample of orderedSamples) {
    const sampleResults = resultMap.get(sample.sample_id);
    
    // Check if this row shares the exact same Sample ID and Field ID as the previous row
    const isVisuallyGrouped = sample.sample_id === prevSampleId && sample.field_id === prevFieldId;

    // Apply grouping logic to the CSV (leave cell blank if grouped, else print the ID)
    const displaySampleId = isVisuallyGrouped ? '' : sample.sample_id;
    const displayFieldId = isVisuallyGrouped ? '' : (sample.field_id || '');

    const row = [displaySampleId, displayFieldId, sample.depth || ''];

    for (const param of parameters) {
      const result = sampleResults?.get(param);
      if (result) {
        row.push(result.is_below_mdl ? `<${result.mdl}` : (result.entered_value || ''));
      } else {
        row.push('');
      }
    }

    rows.push(row);

    // Update trackers for the next iteration
    prevSampleId = sample.sample_id;
    prevFieldId = sample.field_id || '';
  }

  // Convert to CSV string
  return rows.map(row => row.map(cell => escapeCSVCell(cell)).join(',')).join('\n');
}
