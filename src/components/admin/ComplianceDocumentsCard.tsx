import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  FileCheck, 
  Plus, 
  Loader2, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  CalendarIcon
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  useComplianceDocuments,
  useAddComplianceDocument,
  useDeleteComplianceDocument,
  getDocumentTypeLabel,
  type ComplianceDocumentInsert,
} from '@/hooks/useComplianceDocuments';

const documentTypes = [
  { value: 'accreditation', label: 'Accreditation' },
  { value: 'calibration_certificate', label: 'Calibration Certificate' },
  { value: 'regulatory_permit', label: 'Regulatory Permit' },
  { value: 'license', label: 'License' },
  { value: 'other', label: 'Other' },
];

export function ComplianceDocumentsCard() {
  const { data: documents, isLoading } = useComplianceDocuments();
  const addDocument = useAddComplianceDocument();
  const deleteDocument = useDeleteComplianceDocument();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<ComplianceDocumentInsert>>({
    document_type: '',
    name: '',
    issuing_authority: '',
    document_number: '',
    issue_date: '',
    expiry_date: '',
    reminder_days: 30,
    notes: '',
  });

  const handleAddDocument = () => {
    if (!formData.name || !formData.document_type || !formData.issue_date || !formData.expiry_date) {
      return;
    }

    addDocument.mutate(formData as ComplianceDocumentInsert, {
      onSuccess: () => {
        setShowAddDialog(false);
        setFormData({
          document_type: '',
          name: '',
          issuing_authority: '',
          document_number: '',
          issue_date: '',
          expiry_date: '',
          reminder_days: 30,
          notes: '',
        });
      },
    });
  };

  const getStatusBadge = (status: string, expiryDate: string) => {
    const daysUntilExpiry = differenceInDays(parseISO(expiryDate), new Date());
    
    if (status === 'expired') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Expired
        </Badge>
      );
    }
    if (status === 'expiring_soon') {
      return (
        <Badge variant="outline" className="gap-1 border-warning text-warning">
          <Clock className="w-3 h-3" />
          {daysUntilExpiry} days left
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 border-success text-success">
        <CheckCircle className="w-3 h-3" />
        Active
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Compliance & Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const expiringSoon = documents?.filter(d => d.status === 'expiring_soon' || d.status === 'expired') || [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Compliance & Certifications
            </CardTitle>
            <CardDescription>
              Track calibration certificates, regulatory permits, and accreditations
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Document
          </Button>
        </CardHeader>
        <CardContent>
          {expiringSoon.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-2 text-warning font-medium text-sm">
                <AlertTriangle className="w-4 h-4" />
                {expiringSoon.length} document(s) need attention
              </div>
            </div>
          )}

          {documents && documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Issuing Authority</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div>
                        {doc.name}
                        {doc.document_number && (
                          <span className="text-xs text-muted-foreground block">
                            #{doc.document_number}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getDocumentTypeLabel(doc.document_type)}</TableCell>
                    <TableCell>{doc.issuing_authority || '-'}</TableCell>
                    <TableCell>{format(parseISO(doc.expiry_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{getStatusBadge(doc.status, doc.expiry_date)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this document?')) {
                            deleteDocument.mutate(doc.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No compliance documents tracked yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Document Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Compliance Document</DialogTitle>
            <DialogDescription>
              Track a new certificate, permit, or accreditation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Document Type <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(v) => setFormData({ ...formData, document_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Document Number</Label>
                <Input
                  value={formData.document_number || ''}
                  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                  placeholder="e.g., ACC-2024-001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Document Name <span className="text-destructive">*</span></Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., ISO 17025:2017 Accreditation"
              />
            </div>

            <div className="space-y-2">
              <Label>Issuing Authority</Label>
              <Input
                value={formData.issuing_authority || ''}
                onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
                placeholder="e.g., Standards Organisation of Nigeria"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.issue_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.issue_date ? format(parseISO(formData.issue_date), 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.issue_date ? parseISO(formData.issue_date) : undefined}
                      onSelect={(date) => setFormData({ ...formData, issue_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.expiry_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiry_date ? format(parseISO(formData.expiry_date), 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.expiry_date ? parseISO(formData.expiry_date) : undefined}
                      onSelect={(date) => setFormData({ ...formData, expiry_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reminder Days Before Expiry</Label>
              <Input
                type="number"
                value={formData.reminder_days || 30}
                onChange={(e) => setFormData({ ...formData, reminder_days: parseInt(e.target.value) || 30 })}
                min={1}
                max={365}
              />
              <p className="text-xs text-muted-foreground">
                Show warning this many days before expiry
              </p>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddDocument}
              disabled={!formData.name || !formData.document_type || !formData.issue_date || !formData.expiry_date || addDocument.isPending}
            >
              {addDocument.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
