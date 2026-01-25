import { useState } from 'react';
import { useProjectReportData, ProjectReportData } from '@/hooks/useReportData';
import * as XLSX from 'xlsx';
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

  const { data: reportData, isLoading, error } = useProjectReportData(projectId);

  const handleExport = () => {
    if (!reportData || reportData.results.length === 0) {
      toast.error('No approved results to export');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      const projectTitle = reportData.project.title;

      // Create Cover Sheet with professional layout
      const coverWs = createCoverSheet(reportData);
      XLSX.utils.book_append_sheet(wb, coverWs, 'Cover Page');

      // Create Results Sheet(s) - Matrix layout with project-titled tabs
      if (groupByLabSection) {
        // Group results by lab section
        const resultsBySection = new Map<string, typeof reportData.results>();
        for (const result of reportData.results) {
          const section = result.lab_section || 'Other';
          if (!resultsBySection.has(section)) {
            resultsBySection.set(section, []);
          }
          resultsBySection.get(section)!.push(result);
        }

        for (const [section, sectionResults] of resultsBySection) {
          const { sheetData, colWidths } = createMatrixResultsSheet(
            sectionResults, 
            reportData.samples,
            includeMethodInfo, 
            includeMDLs
          );
          
          // Create sheet with project title header
          const ws = createResultsSheetWithHeader(sheetData, colWidths, projectTitle, section);
          
          // Tab name: "Section - Project Title" (truncated to 31 chars)
          const sectionName = section.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const tabName = `${sectionName} - ${projectTitle}`.substring(0, 31);
          XLSX.utils.book_append_sheet(wb, ws, tabName);
        }
      } else {
        const { sheetData, colWidths } = createMatrixResultsSheet(
          reportData.results, 
          reportData.samples,
          includeMethodInfo, 
          includeMDLs
        );
        
        // Create sheet with project title header
        const ws = createResultsSheetWithHeader(sheetData, colWidths, projectTitle, 'All Results');
        const tabName = `Results - ${projectTitle}`.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, tabName);
      }

      // Download
      const sanitizedCode = projectCode.replace(/[^a-zA-Z0-9-_]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `COA_${sanitizedCode}_${dateStr}.${format === 'excel' ? 'xlsx' : 'csv'}`;

      if (format === 'csv') {
        // Export only the results as CSV
        const { sheetData } = createMatrixResultsSheet(
          reportData.results, 
          reportData.samples,
          includeMethodInfo, 
          includeMDLs
        );
        const csvWs = XLSX.utils.aoa_to_sheet(sheetData);
        const csv = XLSX.utils.sheet_to_csv(csvWs);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        XLSX.writeFile(wb, fileName);
      }

      toast.success(`Report exported: ${fileName}`);
      setOpen(false);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export report');
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
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
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
                disabled={reportData.summary.approvedResults === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface SampleInfo {
  id: string;
  sample_id: string;
  field_id: string | null;
  matrix: string;
}

interface ResultInfo {
  sample_id: string;
  sample_name: string;
  field_id: string | null;
  matrix: string;
  parameter_abbr: string;
  entered_value: string | null;
  canonical_unit: string | null;
  is_below_mdl: boolean | null;
  mdl: number;
  loq: number;
  method_code: string;
}

// Create professional cover sheet with styled layout
function createCoverSheet(reportData: ProjectReportData): XLSX.WorkSheet {
  const coverData: (string | number)[][] = [
    [''],
    [''],
    ['TECHNOLOGY PARTNERS INTERNATIONAL'],
    ['Environmental Laboratory Services'],
    [''],
    ['═══════════════════════════════════════════════════════════════'],
    [''],
    ['CERTIFICATE OF ANALYSIS'],
    [''],
    ['═══════════════════════════════════════════════════════════════'],
    [''],
    [''],
    ['PROJECT INFORMATION'],
    ['────────────────────────────────────────'],
    ['Project Code:', reportData.project.code],
    ['Project Title:', reportData.project.title],
    ['Location:', reportData.project.location || 'N/A'],
    ['Regulatory Program:', reportData.project.regulatory_program || 'N/A'],
    [''],
    [''],
    ['CLIENT INFORMATION'],
    ['────────────────────────────────────────'],
    ['Client Name:', reportData.client?.name || 'N/A'],
    ['Address:', reportData.client?.address || 'N/A'],
    ['Contact Person:', reportData.client?.contact_name || 'N/A'],
    ['Email:', reportData.client?.email || 'N/A'],
    [''],
    [''],
    ['ANALYSIS SUMMARY'],
    ['────────────────────────────────────────'],
    ['Sample Collection Date:', reportData.project.sample_collection_date || 'N/A'],
    ['Sample Receipt Date:', reportData.project.sample_receipt_date || 'N/A'],
    ['Analysis Start Date:', reportData.project.analysis_start_date || 'N/A'],
    ['Analysis End Date:', reportData.project.analysis_end_date || 'N/A'],
    ['Report Issue Date:', new Date().toLocaleDateString()],
    [''],
    ['Total Samples Analyzed:', reportData.summary.totalSamples],
    ['Total Parameters Reported:', reportData.summary.approvedResults],
    [''],
    [''],
    ['═══════════════════════════════════════════════════════════════'],
    [''],
    ['This report shall not be reproduced except in full,'],
    ['without written approval from TPI Laboratory.'],
    [''],
    [''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(coverData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 28 }, // Label column
    { wch: 45 }, // Value column
  ];

  // Set row heights for visual spacing
  ws['!rows'] = coverData.map((_, i) => {
    if (i === 2) return { hpt: 24 }; // Company name
    if (i === 7) return { hpt: 28 }; // COA title
    if (i === 12 || i === 20 || i === 28) return { hpt: 20 }; // Section headers
    return { hpt: 16 };
  });

  // Merge cells for centered headers
  ws['!merges'] = [
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },  // Company name
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },  // Tagline
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },  // Divider
    { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } },  // COA Title
    { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } },  // Divider
    { s: { r: 12, c: 0 }, e: { r: 12, c: 1 } }, // Project Info header
    { s: { r: 13, c: 0 }, e: { r: 13, c: 1 } }, // Divider
    { s: { r: 20, c: 0 }, e: { r: 20, c: 1 } }, // Client Info header
    { s: { r: 21, c: 0 }, e: { r: 21, c: 1 } }, // Divider
    { s: { r: 28, c: 0 }, e: { r: 28, c: 1 } }, // Analysis header
    { s: { r: 29, c: 0 }, e: { r: 29, c: 1 } }, // Divider
    { s: { r: 40, c: 0 }, e: { r: 40, c: 1 } }, // Footer divider
    { s: { r: 42, c: 0 }, e: { r: 42, c: 1 } }, // Disclaimer 1
    { s: { r: 43, c: 0 }, e: { r: 43, c: 1 } }, // Disclaimer 2
  ];

  return ws;
}

// Create results sheet with project title header
function createResultsSheetWithHeader(
  sheetData: string[][],
  colWidths: { wch: number }[],
  projectTitle: string,
  sectionName: string
): XLSX.WorkSheet {
  // Add header rows with project title and section
  const formattedSection = sectionName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const headerRows: string[][] = [
    [`${formattedSection} Results for ${projectTitle}`],
    [''],
    [''], // Separator before data
  ];
  
  // Combine header with data
  const fullSheetData = [...headerRows, ...sheetData];
  
  // Add footer
  fullSheetData.push(['']);
  fullSheetData.push(['─── End of Results ───']);
  
  const ws = XLSX.utils.aoa_to_sheet(fullSheetData);
  ws['!cols'] = colWidths;
  
  // Merge the title row across all columns
  const totalCols = colWidths.length;
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // Title row
    { s: { r: fullSheetData.length - 1, c: 0 }, e: { r: fullSheetData.length - 1, c: totalCols - 1 } }, // Footer
  ];
  
  return ws;
}

function createMatrixResultsSheet(
  results: ResultInfo[],
  samples: SampleInfo[],
  includeMethodInfo: boolean,
  includeMDLs: boolean
): { sheetData: string[][]; colWidths: { wch: number }[] } {
  // Get unique parameters preserving order
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

  // Get unique samples that have results
  const sampleIdsWithResults = new Set(results.map(r => r.sample_name));
  const orderedSamples = samples.filter(s => sampleIdsWithResults.has(s.sample_id));

  // Build result lookup: sample_name -> parameter_abbr -> result
  const resultMap = new Map<string, Map<string, ResultInfo>>();
  for (const r of results) {
    if (!resultMap.has(r.sample_name)) {
      resultMap.set(r.sample_name, new Map());
    }
    resultMap.get(r.sample_name)!.set(r.parameter_abbr, r);
  }

  // Build sheet data
  const sheetData: string[][] = [];

  // Row 1: Header row with parameter names
  const headerRow = ['Sample ID', 'Field ID', 'Matrix', ...parameters];
  sheetData.push(headerRow);

  // Row 2: Units row
  const unitsRow = ['', '', 'Unit:', ...paramMetadata.map(p => p.unit)];
  sheetData.push(unitsRow);

  // Row 3: MDL row (optional)
  if (includeMDLs) {
    const mdlRow = ['', '', 'MDL:', ...paramMetadata.map(p => p.mdl.toString())];
    sheetData.push(mdlRow);

    const loqRow = ['', '', 'LOQ:', ...paramMetadata.map(p => p.loq.toString())];
    sheetData.push(loqRow);
  }

  // Row 4: Method row (optional)
  if (includeMethodInfo) {
    const methodRow = ['', '', 'Method:', ...paramMetadata.map(p => p.method)];
    sheetData.push(methodRow);
  }

  // Blank separator row
  sheetData.push(Array(headerRow.length).fill(''));

  // Data rows: one per sample
  for (const sample of orderedSamples) {
    const sampleResults = resultMap.get(sample.sample_id);
    const row = [
      sample.sample_id,
      sample.field_id || '',
      sample.matrix,
    ];

    for (const param of parameters) {
      const result = sampleResults?.get(param);
      if (result) {
        const displayValue = result.is_below_mdl 
          ? `<${result.mdl}` 
          : (result.entered_value || '');
        row.push(displayValue);
      } else {
        row.push(''); // No result for this parameter
      }
    }

    sheetData.push(row);
  }

  // Column widths
  const colWidths = [
    { wch: 15 }, // Sample ID
    { wch: 15 }, // Field ID
    { wch: 12 }, // Matrix
    ...parameters.map(() => ({ wch: 12 })), // Parameter columns
  ];

  return { sheetData, colWidths };
}
