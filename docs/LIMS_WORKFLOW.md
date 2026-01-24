# TPI LIMS - Application Workflow Documentation

## Overview

This document outlines the complete workflow for the TPI Laboratory Information Management System (LIMS), from initial configuration to final result approval.

---

## Workflow Stages

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              TPI LIMS WORKFLOW                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   STAGE 1    │    │   STAGE 2    │    │   STAGE 3    │    │   STAGE 4    │       │
│  │              │    │              │    │              │    │              │       │
│  │ CONFIGURATION│───▶│   PROJECT    │───▶│   SAMPLE     │───▶│   RESULTS    │       │
│  │   (Admin)    │    │    SETUP     │    │  REGISTRATION│    │    ENTRY     │       │
│  │              │    │              │    │              │    │              │       │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                   │                │
│         ▼                   ▼                   ▼                   ▼                │
│  • Parameters        • Client Info       • Lab ID Gen        • Select Project       │
│  • Methods           • Project Code      • Field ID Series   • Choose Lab Section   │
│  • Parameter Configs • COC Metadata      • Matrix/Container  • Enter Values         │
│  • Test Packages     • Regulatory Body   • Test Selection    • Add Qualifiers       │
│                                          • QC Samples                                │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                           STAGE 5: APPROVAL WORKFLOW                          │   │
│  │                                                                               │   │
│  │   ┌─────────┐      ┌─────────────┐      ┌──────────┐      ┌──────────┐       │   │
│  │   │  DRAFT  │─────▶│   PENDING   │─────▶│ REVIEWED │─────▶│ APPROVED │       │   │
│  │   │         │      │   REVIEW    │      │          │      │          │       │   │
│  │   └─────────┘      └─────────────┘      └──────────┘      └──────────┘       │   │
│  │    (Analyst)       (Lab Supervisor)     (QA Officer)        (Final)          │   │
│  │                                                                               │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Configuration (Admin Only)

**Location:** Configuration Menu → Parameters / Methods

**Purpose:** Define laboratory standards, analytical methods, and validation rules before any work begins.

### 1.1 Define Parameters
| Action | Description |
|--------|-------------|
| Add Parameter | Create analyte definitions (name, abbreviation, CAS number) |
| Assign Lab Section | Wet Chemistry, Instrumentation, or Microbiology |
| Set Analyte Group | Categorize by group (Heavy Metals, TPH, Anions, etc.) |
| Result Type | Numeric or Text |

### 1.2 Define Methods
| Action | Description |
|--------|-------------|
| Add Method | Create method records (EPA, ASTM, APHA, etc.) |
| Method Code | Unique identifier (e.g., EPA 8260, APHA 4500) |
| Organization | Standards body (EPA, ASTM, APHA, ISO) |

### 1.3 Configure Parameter Configs
| Action | Description |
|--------|-------------|
| Link Parameter + Method + Matrix | Create valid combinations |
| Set MDL/LOQ | Detection and quantitation limits |
| Define Units | Canonical and allowed units |
| Validation Range | Min/Max acceptable values |
| Decimal Places | Reporting precision |

### 1.4 Create Test Packages (Optional)
| Action | Description |
|--------|-------------|
| Bundle Parameters | Group commonly ordered tests |
| Assign to Matrix | Water, Soil, Wastewater, etc. |
| Lab Section | Department assignment |

---

## Stage 2: Project Setup

**Location:** Projects → Create New Project

**Purpose:** Register client work orders and chain of custody information.

### 2.1 Quick Create Mode
- Project Code (auto-generated)
- Project Title
- Client Selection

### 2.2 Full Details Mode (COC Compliance)
| Field | Description |
|-------|-------------|
| Client Information | Name, Contact, Address |
| Sampler Details | Name, Company |
| Sample Collection Date | Date samples were collected |
| Sample Receipt Date | Date received at lab |
| TAT | Turnaround time requirements |
| Regulatory Program | NUPRC, NMDPRA, NOSDRA, FMEnv, IFC |
| Special Instructions | Client-specific notes |
| Relinquished/Received By | COC signatures |

---

## Stage 3: Sample Registration

**Location:** Samples → Register Samples

**Purpose:** Log incoming samples with full metadata and define analytical scope.

### 3.1 Sample Identification
| Field | Description |
|-------|-------------|
| Lab ID | Auto-generated sequential number |
| Field ID | Client's sample identifier |
| Generate Series | Bulk create sequential IDs |

### 3.2 Sample Metadata
| Field | Description |
|-------|-------------|
| Matrix | Water, Wastewater, Soil, Sediment, Air, Sludge |
| Location | Sampling point description |
| Depth | Sample depth (if applicable) |
| Collection Date/Time | When sample was collected |

### 3.3 Container & Preservation
| Field | Description |
|-------|-------------|
| Container Type | Glass, Plastic, VOA vial, etc. (multi-select) |
| Container Count | Number of containers |
| Preservation | HNO₃, H₂SO₄, NaOH, Ice, None (multi-select) |
| Sample Condition | Intact, Damaged, Leaking |

### 3.4 Test Selection
| Action | Description |
|-------|-------------|
| Select Parameters | Choose individual tests |
| Select Test Package | Apply bundled test groups |
| Auto-populate Results | Creates placeholder records for entry |

### 3.5 QC Samples
| Type | Description |
|------|-------------|
| Trip Blank | Field contamination check |
| Equipment Blank | Cleaning verification |
| Field Duplicate | Precision assessment |
| Control Sample | Lab accuracy verification |

### 3.6 Copy from Previous
- Clone metadata from preceding sample for rapid entry

---

## Stage 4: Results Entry

**Location:** Result Entry → [Lab Section]

**Purpose:** Analysts enter analytical data for their assigned department.

### 4.1 Access Control
| Role | Access |
|------|--------|
| Wet Chemistry Analyst | Wet Chemistry tab only |
| Instrumentation Analyst | Instrumentation tab only |
| Microbiology Analyst | Microbiology tab only |
| Lab Supervisor | Assigned section(s) |
| Admin | All sections |

### 4.2 Entry Workflow
```
1. Select Project from dropdown
2. Click "Start Analysis" to transition samples (Received → In Progress)
3. Choose Analyte Group (Heavy Metals, TPH, etc.)
4. Enter results in data grid:
   - Value (numeric or text)
   - Unit (from allowed list)
   - Qualifier (if applicable)
   - Analysis Date
   - Batch ID
   - Instrument ID
   - Analyst Notes
5. System validates against MDL/LOQ and range limits
6. Submit for review
```

### 4.3 Work Order Generation
- Print lab-specific worksheets for bench work
- Shows sample × parameter matrix for department

---

## Stage 5: Approval Workflow

**Location:** Review Queue

**Purpose:** Multi-tier review ensures data quality and regulatory compliance.

### 5.1 Status Progression

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   DRAFT ────────▶ PENDING REVIEW ────────▶ REVIEWED ────────▶ APPROVED
│     │                   │                     │                 │   │
│     │                   │                     │                 │   │
│  Analyst            Lab Supervisor        QA Officer          Final │
│  enters data        reviews for           final approval     Sample │
│                     accuracy              and compliance     marked │
│                                                              complete│
│                                                                      │
│   ◄──── REJECTED (with reason, returns to previous status) ◄────    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 Role Responsibilities

| Role | Action | Result Status |
|------|--------|---------------|
| Analyst | Enter data, submit | Draft → Pending Review |
| Lab Supervisor | Review accuracy, methodology | Pending Review → Reviewed |
| QA Officer | Final compliance check | Reviewed → Approved |

### 5.3 Rejection Flow
- Any reviewer can reject with documented reason
- Result returns to previous status
- Original analyst corrects and resubmits

---

## Sample Status Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  RECEIVED   │────▶│ IN PROGRESS │────▶│  COMPLETED  │────▶│  DISPOSED   │
│             │     │             │     │             │     │             │
│ Sample      │     │ Analysis    │     │ All results │     │ Sample      │
│ logged      │     │ underway    │     │ approved    │     │ discarded   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │    Start Analysis │   Auto-transition │
      │    (manual)       │   when 100%       │
      │                   │   approved        │
```

---

## User Roles Summary

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, configuration, user management |
| **Lab Supervisor** | Project/sample management, result review (own section) |
| **QA Officer** | Final approval authority |
| **Wet Chemistry Analyst** | Enter results for wet chemistry only |
| **Instrumentation Analyst** | Enter results for instrumentation only |
| **Microbiology Analyst** | Enter results for microbiology only |

---

## Visual Workflow Summary (For Graphic Design)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           TPI LIMS WORKFLOW                                    ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────────────┐ ║
║  │    1    │   │    2    │   │    3    │   │    4    │   │        5        │ ║
║  │  CONFIG │ → │ PROJECT │ → │ SAMPLES │ → │ RESULTS │ → │     APPROVAL    │ ║
║  │  SETUP  │   │  SETUP  │   │ INTAKE  │   │  ENTRY  │   │    WORKFLOW     │ ║
║  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────────────┘ ║
║       │             │             │             │               │            ║
║       ▼             ▼             ▼             ▼               ▼            ║
║  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌───┬───┬───┬───┐  ║
║  │Parameters│   │ Client  │   │ Lab ID  │   │ Select  │   │ D │ P │ R │ A │  ║
║  │ Methods │   │ Project │   │Field ID │   │ Project │   │ R │ E │ E │ P │  ║
║  │ Configs │   │   COC   │   │ Matrix  │   │  Lab    │   │ A │ N │ V │ P │  ║
║  │Packages │   │Metadata │   │ Tests   │   │ Section │   │ F │ D │ I │ R │  ║
║  └─────────┘   └─────────┘   │   QC    │   │ Values  │   │ T │ I │ E │ O │  ║
║                              └─────────┘   └─────────┘   │   │ N │ W │ V │  ║
║                                                          │   │ G │ E │ E │  ║
║                                                          │   │   │ D │ D │  ║
║                                                          └───┴───┴───┴───┘  ║
║                                                                               ║
║  ROLES:  Admin ─────────────────────────────────────────────────────────────▶║
║          Supervisor ────────────────────────────────────────────────────────▶║
║          Analyst ──────────────────────────────────────▶                     ║
║          QA Officer ──────────────────────────────────────────────────▶      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## Key Metrics Tracked

| Metric | Location |
|--------|----------|
| Sample Progress | Dashboard, Samples tab |
| Results Entered/Approved | Progress bars per sample |
| Lab Section Workload | Results Entry page |
| Pending Reviews | Review Queue |
| Validation Alerts | Dashboard |

---

*Document Version: 1.0*  
*Last Updated: January 2026*
