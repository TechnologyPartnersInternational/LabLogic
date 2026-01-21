// Core LIMS Types for Environmental Laboratory

export type Matrix = 'water' | 'wastewater' | 'sediment' | 'soil' | 'air' | 'sludge';

export type LabCategory = 'wet_chemistry' | 'instrumentation' | 'microbiology';

export type ResultType = 'numeric' | 'presence_absence' | 'mpn' | 'cfu' | 'text';

export type SampleStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Unit {
  id: string;
  symbol: string;
  name: string;
  conversionFactor: number; // relative to canonical unit
  isCanonical: boolean;
}

export interface Parameter {
  id: string;
  name: string;
  abbreviation: string;
  category: LabCategory;
  casNumber?: string;
  analyteGroup: string;
  resultType: ResultType;
}

export interface Method {
  id: string;
  code: string;
  name: string;
  organization: 'APHA' | 'ASTM' | 'EPA' | 'ISO' | 'Internal';
  description?: string;
}

export interface ParameterConfig {
  id: string;
  parameterId: string;
  matrixId: Matrix;
  methodId: string;
  canonicalUnit: Unit;
  allowedUnits: Unit[];
  mdl: number; // Minimum Detection Limit
  loq: number; // Limit of Quantification
  minValue?: number;
  maxValue?: number;
  decimalPlaces: number;
  reportBelowMdlAs: '<MDL' | 'ND' | 'value'; // How to display below MDL
}

export interface Client {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Project {
  id: string;
  code: string;
  title: string;
  clientId: string;
  status: ProjectStatus;
  sampleCollectionDate: string;
  sampleReceiptDate: string;
  analysisStartDate?: string;
  analysisEndDate?: string;
  resultsIssuedDate?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sample {
  id: string;
  projectId: string;
  sampleId: string; // Lab-assigned ID
  fieldId?: string; // Field sample ID
  matrix: Matrix;
  sampleType: 'grab' | 'composite';
  collectionDate: string;
  collectionTime?: string;
  location?: string;
  depth?: string;
  preservationType?: string;
  containerType?: string;
  status: SampleStatus;
  assignedTests: string[]; // TestPackage IDs
}

export interface TestPackage {
  id: string;
  name: string;
  description: string;
  category: LabCategory;
  parameterIds: string[];
  matrix: Matrix[];
}

export interface Result {
  id: string;
  sampleId: string;
  parameterId: string;
  methodId: string;
  enteredValue: number | string;
  enteredUnit: string;
  canonicalValue: number | null;
  canonicalUnit: string;
  qualifier?: string; // <MDL, ND, etc.
  isBelowMdl: boolean;
  status: 'draft' | 'validated' | 'approved' | 'rejected';
  validationErrors: ValidationError[];
  validationWarnings: ValidationError[];
  analystId?: string;
  analysisDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  field?: string;
}

export interface AuditLog {
  id: string;
  entityType: 'result' | 'sample' | 'project' | 'parameter';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject';
  userId: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
}

// UI-specific types
export interface DashboardStats {
  activeProjects: number;
  pendingSamples: number;
  validationErrors: number;
  pendingApprovals: number;
  samplesThisWeek: number;
  completedThisMonth: number;
}

export interface ResultEntry {
  sampleId: string;
  sampleLabel: string;
  results: Record<string, {
    value: string;
    qualifier: string;
    isBelowMdl: boolean;
  }>;
}
