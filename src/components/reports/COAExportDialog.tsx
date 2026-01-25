import { useState } from 'react';
import { useProjectReportData } from '@/hooks/useReportData';
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

      // Create Cover Sheet
      const coverData = [
        ['CERTIFICATE OF ANALYSIS'],
        [''],
        ['Laboratory:', 'Technology Partners International'],
        ['Report Date:', new Date().toLocaleDateString()],
        [''],
        ['Project Information'],
        ['Project Code:', reportData.project.code],
        ['Project Title:', reportData.project.title],
        ['Location:', reportData.project.location || 'N/A'],
        ['Regulatory Program:', reportData.project.regulatory_program || 'N/A'],
        [''],
        ['Client Information'],
        ['Client Name:', reportData.client?.name || 'N/A'],
        ['Address:', reportData.client?.address || 'N/A'],
        ['Contact:', reportData.client?.contact_name || 'N/A'],
        [''],
        ['Analysis Information'],
        ['Sample Collection Date:', reportData.project.sample_collection_date || 'N/A'],
        ['Sample Receipt Date:', reportData.project.sample_receipt_date || 'N/A'],
        ['Analysis Start Date:', reportData.project.analysis_start_date || 'N/A'],
        ['Analysis End Date:', reportData.project.analysis_end_date || 'N/A'],
        ['Total Samples:', reportData.summary.totalSamples.toString()],
        ['Total Parameters Analyzed:', reportData.summary.approvedResults.toString()],
      ];

      const coverWs = XLSX.utils.aoa_to_sheet(coverData);
      coverWs['!cols'] = [{ wch: 25 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, coverWs, 'Cover Page');

      // Create Results Sheet(s)
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
          const sheetData = createResultsSheet(sectionResults, includeMethodInfo, includeMDLs);
          const ws = XLSX.utils.aoa_to_sheet(sheetData);
          ws['!cols'] = [
            { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
            ...(includeMDLs ? [{ wch: 10 }, { wch: 10 }] : []),
            ...(includeMethodInfo ? [{ wch: 15 }] : []),
          ];
          const sectionName = section.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          XLSX.utils.book_append_sheet(wb, ws, sectionName.substring(0, 31));
        }
      } else {
        const sheetData = createResultsSheet(reportData.results, includeMethodInfo, includeMDLs);
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!cols'] = [
          { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
          ...(includeMDLs ? [{ wch: 10 }, { wch: 10 }] : []),
          ...(includeMethodInfo ? [{ wch: 15 }] : []),
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Results');
      }

      // Download
      const sanitizedCode = projectCode.replace(/[^a-zA-Z0-9-_]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `COA_${sanitizedCode}_${dateStr}.${format === 'excel' ? 'xlsx' : 'csv'}`;

      if (format === 'csv') {
        // Export only the results as CSV
        const sheetData = createResultsSheet(reportData.results, includeMethodInfo, includeMDLs);
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

function createResultsSheet(
  results: Array<{
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
  }>,
  includeMethodInfo: boolean,
  includeMDLs: boolean
): string[][] {
  const headers = [
    'Sample ID',
    'Field ID',
    'Matrix',
    'Parameter',
    'Result',
    'Unit',
    ...(includeMDLs ? ['MDL', 'LOQ'] : []),
    ...(includeMethodInfo ? ['Method'] : []),
  ];

  const rows = results.map((r) => [
    r.sample_name,
    r.field_id || '',
    r.matrix,
    r.parameter_abbr,
    r.is_below_mdl ? `<${r.mdl}` : (r.entered_value || ''),
    r.canonical_unit || '',
    ...(includeMDLs ? [r.mdl.toString(), r.loq.toString()] : []),
    ...(includeMethodInfo ? [r.method_code] : []),
  ]);

  return [headers, ...rows];
}
