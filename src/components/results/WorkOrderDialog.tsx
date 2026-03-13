import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Printer, Loader2, CheckCircle } from 'lucide-react';
import { useLabWorkOrder } from '@/hooks/useSampleProgress';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface WorkOrderDialogProps {
  projectId: string;
  labSection: string;
  labLabel: string;
}

export function WorkOrderDialog({ projectId, labSection, labLabel }: WorkOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { data: workOrder, isLoading } = useLabWorkOrder(projectId, labSection);

  // Helper function to escape HTML entities to prevent XSS
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    
    // Clone the DOM node instead of using innerHTML to prevent XSS
    const clonedContent = printRef.current.cloneNode(true) as HTMLElement;
    
    // Create a safe serialization by extracting only text content from data fields
    // and rebuilding the structure safely
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build safe HTML document with escaped content
    const safeProjectCode = escapeHtml(workOrder?.project.code || '');
    const safeLabLabel = escapeHtml(labLabel);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Work Order - ${safeProjectCode} - ${safeLabLabel}</title>
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'unsafe-inline';">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; font-size: 12px; }
            .header { margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header h1 { font-size: 18px; margin-bottom: 4px; }
            .header p { color: #666; font-size: 11px; }
            .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
            .meta-item { padding: 8px; background: #f5f5f5; border-radius: 4px; }
            .meta-item label { font-size: 10px; color: #666; display: block; }
            .meta-item span { font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 11px; }
            th { background: #f0f0f0; font-weight: 600; }
            .sample-id { font-family: monospace; font-weight: 600; }
            .param-header { text-align: center; font-size: 10px; }
            .param-cell { text-align: center; }
            .check { color: #22c55e; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; color: #666; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body></body>
      </html>
    `);
    
    // Safely append the cloned content to the document body
    printWindow.document.body.appendChild(clonedContent);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const { matrixLabels } = await import('@/constants/matrices');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={!projectId}>
          <FileText className="w-4 h-4" />
          Work Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Work Order - {labLabel}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={!workOrder}>
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Printable work order showing all samples and required analyses for this lab section
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !workOrder ? (
            <div className="p-8 text-center text-muted-foreground">
              No samples with tests for this lab section
            </div>
          ) : (
            <div ref={printRef} className="p-4 space-y-4">
              {/* Header */}
              <div className="header">
                <h1 style={{ fontSize: '18px', marginBottom: '4px', fontWeight: 'bold' }}>
                  LABORATORY WORK ORDER
                </h1>
                <p style={{ color: '#666', fontSize: '12px' }}>
                  {workOrder.labLabel} Section
                </p>
              </div>

              {/* Meta info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <label style={{ fontSize: '10px', color: '#666', display: 'block' }}>Project Code</label>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{workOrder.project.code}</span>
                </div>
                <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <label style={{ fontSize: '10px', color: '#666', display: 'block' }}>Project Title</label>
                  <span style={{ fontWeight: 600 }}>{workOrder.project.title}</span>
                </div>
                <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <label style={{ fontSize: '10px', color: '#666', display: 'block' }}>Client</label>
                  <span style={{ fontWeight: 600 }}>{workOrder.project.clientName}</span>
                </div>
                <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <label style={{ fontSize: '10px', color: '#666', display: 'block' }}>Total Samples</label>
                  <span style={{ fontWeight: 600 }}>{workOrder.totalSamples}</span>
                </div>
                <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <label style={{ fontSize: '10px', color: '#666', display: 'block' }}>Total Tests</label>
                  <span style={{ fontWeight: 600 }}>{workOrder.totalTests}</span>
                </div>
                <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <label style={{ fontSize: '10px', color: '#666', display: 'block' }}>Generated</label>
                  <span style={{ fontWeight: 600 }}>{format(new Date(workOrder.generatedAt), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              </div>

              {/* Sample/Test Matrix */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ddd', padding: '6px 8px', background: '#f0f0f0', fontWeight: 600, textAlign: 'left' }}>
                        Lab ID
                      </th>
                      <th style={{ border: '1px solid #ddd', padding: '6px 8px', background: '#f0f0f0', fontWeight: 600, textAlign: 'left' }}>
                        Field ID
                      </th>
                      <th style={{ border: '1px solid #ddd', padding: '6px 8px', background: '#f0f0f0', fontWeight: 600, textAlign: 'left' }}>
                        Matrix
                      </th>
                      <th style={{ border: '1px solid #ddd', padding: '6px 8px', background: '#f0f0f0', fontWeight: 600, textAlign: 'center' }}>
                        Date
                      </th>
                      {workOrder.parameters.map(param => (
                        <th 
                          key={param.abbreviation} 
                          style={{ 
                            border: '1px solid #ddd', 
                            padding: '6px 4px', 
                            background: '#f0f0f0', 
                            fontWeight: 600, 
                            textAlign: 'center',
                            fontSize: '10px',
                            minWidth: '50px',
                          }}
                        >
                          {param.abbreviation}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {workOrder.samples.map(sample => (
                      <tr key={sample.sampleId}>
                        <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontFamily: 'monospace', fontWeight: 600 }}>
                          {sample.labId}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                          {sample.fieldId || '-'}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                          {matrixLabels[sample.matrix] || sample.matrix}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'center' }}>
                          {format(new Date(sample.collectionDate), 'MM/dd')}
                        </td>
                        {workOrder.parameters.map(param => {
                          const sampleParam = sample.parameters.find(p => p.abbreviation === param.abbreviation);
                          return (
                            <td 
                              key={param.abbreviation} 
                              style={{ 
                                border: '1px solid #ddd', 
                                padding: '6px 4px', 
                                textAlign: 'center',
                              }}
                            >
                              {sampleParam ? (
                                sampleParam.hasValue ? (
                                  <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span>
                                ) : (
                                  <span style={{ color: '#666' }}>○</span>
                                )
                              ) : (
                                <span style={{ color: '#ccc' }}>—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div style={{ marginTop: '15px', fontSize: '10px', color: '#666' }}>
                <strong>Legend:</strong> ○ = Pending | ✓ = Complete | — = Not applicable
              </div>

              {/* Footer */}
              <div style={{ marginTop: '30px', paddingTop: '10px', borderTop: '1px solid #ddd', fontSize: '10px', color: '#666' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Analyst Signature: _______________________</span>
                  <span>Date: _____________</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
