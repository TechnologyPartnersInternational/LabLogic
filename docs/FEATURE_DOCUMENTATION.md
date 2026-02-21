# LabLogic LIMS — Comprehensive Feature Documentation

> **Last Updated:** February 2026  
> **Version:** Current production build

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Authentication & Onboarding](#2-authentication--onboarding)
3. [Dashboard](#3-dashboard)
4. [Projects](#4-projects)
5. [Samples](#5-samples)
6. [Results Entry](#6-results-entry)
7. [Review & Approval](#7-review--approval)
8. [Reports & Release](#8-reports--release)
9. [Completed Projects Archive](#9-completed-projects-archive)
10. [Validation Dashboard](#10-validation-dashboard)
11. [Configuration (Admin)](#11-configuration-admin)
12. [User Management (Admin)](#12-user-management-admin)
13. [Profile Settings](#13-profile-settings)
14. [Navigation & Layout](#14-navigation--layout)
15. [Role-Based Access Control](#15-role-based-access-control)
16. [Welcome Tour](#16-welcome-tour)
17. [Global Search](#17-global-search)
18. [Notifications](#18-notifications)

---

## 1. Application Overview

LabLogic is a **multi-tenant Laboratory Information Management System (LIMS)** built for environmental, petrochemical, and food/beverage testing laboratories. It manages the full sample lifecycle from intake to final report release.

### Technology Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Lovable Cloud (Supabase) — PostgreSQL, Edge Functions, Auth, Storage
- **State Management:** TanStack React Query
- **Routing:** React Router v6
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod validation

### Multi-Tenancy
- Every data table is scoped by `organization_id`
- Row-Level Security (RLS) policies enforce tenant isolation
- The `get_my_org_id()` database function returns the current user's organization

---

## 2. Authentication & Onboarding

### 2.1 Sign In (`/auth`)
- **Route:** `/auth`
- **Fields:** Email, Password
- **Features:**
  - Login / Sign Up tabs
  - Password visibility toggle (eye icon)
  - "Forgot Password" flow — sends a reset email, user lands on `/auth/reset-password`
  - Invitation-aware: if URL contains `?invitation=TOKEN`, auto-switches to Sign Up tab and pre-fills the email from the invitation
  - After login, redirects to Dashboard (`/`)

### 2.2 Lab Registration (`/register-lab`)
A **3-step wizard** for founding a new laboratory organization:

| Step | Title | Fields |
|------|-------|--------|
| **1** | Your Details | Full Name, Work Email, Password (min 8 chars) |
| **2** | Lab Details | Laboratory Name, URL Slug (auto-generated from name, editable), Logo Upload (optional, max 2MB) |
| **3** | Select Lab Suite | Choose from pre-defined industry templates (Environmental, Petrochemical, Food & Beverage) |

**What happens on submit:**
1. Creates a user account via auth signup
2. Uploads logo to `org-logos` storage bucket (if provided)
3. Calls `register_organization` RPC — creates organization, assigns admin role
4. Seeds departments from the selected template
5. Saves `lab_type` setting
6. Redirects to Dashboard

### 2.3 Join Organization (`/join/:orgSlug`)
- **Route:** `/join/:orgSlug?token=INVITE_TOKEN`
- Displays the organization name and logo
- Shows the pre-assigned roles from the invitation
- **Fields:** Full Name, Password
- On submit: creates account, calls `accept_invitation` RPC, assigns roles
- Email is pre-filled and locked from the invitation

### 2.4 Password Reset (`/auth/reset-password`)
- Accessible from the "Forgot Password" link on the Auth page
- Fields: New Password, Confirm Password
- Uses Supabase `updateUser` to change password

### 2.5 Setup Guard
- After login, if the user's organization has **no departments configured**, they are redirected to `/setup` (Lab Setup Wizard)
- The wizard is the same template-selection UI as step 3 of registration, but for existing organizations

---

## 3. Dashboard (`/`)

The main landing page after login. Displays real-time operational metrics.

### Components (top to bottom):

| Component | Description |
|-----------|-------------|
| **SampleStatusSyncManager** | Background component that auto-syncs sample statuses when all results are approved |
| **QuickStats** | Row of stat cards showing key workflow metrics (active projects, pending samples, validation errors, pending approvals, samples this week, completed this month) |
| **TodaySummary** | Activity summary for the current day |
| **UrgentActionsList** | Items requiring immediate attention (overdue samples, rejected results, etc.) |
| **LabActivityChart** | Bar/line chart showing lab activity over time (Recharts) |
| **RecentProjects** | Table of recently created/updated active projects |
| **LabSectionPerformance** | Per-department performance metrics |
| **WorkflowFunnel** | Visual funnel showing results pipeline (Draft → Pending → Reviewed → Approved) |
| **TurnaroundMetrics** | TAT performance indicators |
| **PendingSamples** | Full-width table of samples awaiting action |

**Layout:** 2-column grid on desktop (2/3 left, 1/3 right), single column on mobile.

---

## 4. Projects

### 4.1 Projects List (`/projects`)
- **Search:** Text filter by project code, title, or client name
- **Table columns:** Project Code (link to detail), Title, Client, Location, Receipt Date, Status, Actions
- **Actions per row:**
  - View (navigate to detail)
  - Document icon (placeholder)
  - Delete (with confirmation dialog — warns about cascading deletion of samples and results)
- **"New Project" button** (top right) → navigates to `/projects/new`

### 4.2 Create Project (`/projects/new`)
Two modes via tab selector:

#### Quick Create Mode
Minimal fields for fast entry:
| Field | Type | Validation |
|-------|------|------------|
| Project Code | Text | Min 3 chars, max 50 |
| Client | Dropdown (select from existing) + "+" button to create new client inline | Required (UUID) |
| Project Title | Text | Min 3 chars, max 200 |
| Location | Text | Optional, max 200 |

#### Full Details Mode (COC Compliance)
All Quick Create fields plus:

| Field | Type | Validation |
|-------|------|------------|
| Sample Collection Date | Date picker | Optional |
| Sample Receipt Date | Date picker | Optional |
| Notes | Textarea | Optional, max 1000 |
| **COC Section** | | |
| Sampler Name | Text | Optional, max 100 |
| Sampler Company | Text | Optional, max 100 |
| TAT (Turnaround Time) | Dropdown | Options: 24h, 48h, 72h, 5d, 7d, 10d, 14d, 21d, 30d |
| Regulatory Program(s) | Multi-checkbox | NUPRC, NMDPRA, NOSDRA, FMEnv, IFC |
| Special Instructions | Textarea | Optional, max 2000 |
| Receipt Discrepancies | Textarea | Optional, max 2000 |
| Relinquished By | Text | Optional, max 100 |
| Received By | Text | Optional, max 100 |

#### Inline Client Creation Dialog
Triggered by the "+" button next to client dropdown:
| Field | Type | Validation |
|-------|------|------------|
| Name | Text | Min 2 chars, max 100, required |
| Contact Name | Text | Optional, max 100 |
| Email | Email | Optional, max 255 |
| Phone | Text | Optional, max 50 |
| Address | Text | Optional, max 500 |

After creation, the new client is auto-selected in both Quick and Full forms.

### 4.3 Project Detail (`/projects/:id`)
- **Back button** → returns to projects list
- **Project metadata card:** Code, Title, Client, Location, Status badge, Sample dates
- **Samples table:** Lists all samples registered under this project
  - Columns: Sample ID, Field ID, Matrix, Location, Collection Date, Status
  - Each sample row shows status badge with icon

---

## 5. Samples

### 5.1 Samples List (`/samples`)
- **Search bar:** Filter by sample ID, field ID, or location
- **Filters:**
  - Project dropdown (all projects)
  - Status dropdown: All, Received, In Progress, Completed, On Hold
- **Stats row:** 4 cards showing Total, Received, In Progress, Completed counts
- **Table columns:** Sample ID (with field ID subtitle), Project (link), Matrix (badge), Location, Collection Date, Progress (bar + percentage), Status (badge)
- **Progress calculation:** Per-sample — `approved results / total results × 100%`

### 5.2 Register Samples Dialog
Triggered by "Register Samples" button. A large modal dialog (max-w-4xl).

#### Step 1: Select Project
- Dropdown of all active projects

#### Step 2: Add Samples
Three ways to add samples:
1. **Generate Series** (SampleIdGenerator) — enter a prefix and count to bulk-create sequential Field IDs
2. **Add QC Sample** (ControlSampleButton) — adds a QC sample with type selection:
   - Trip Blank
   - Equipment Blank
   - Field Duplicate
   - Method Blank
   - Lab Control Sample (LCS)
   - Matrix Spike
3. **Copy from Previous** — copies metadata from the preceding sample row

#### Per-Sample Fields (displayed in compact grid per sample row):
| Field | Type | Notes |
|-------|------|-------|
| Lab ID | Auto-generated (read-only) | Format: `{ProjectCode}-{NNN}` (sequential, padded to 3 digits) |
| Field ID | Text input | Required. Client's sample identifier |
| Matrix | Dropdown | Water, Wastewater, Sediment, Soil, Air, Sludge |
| Location | Text | Optional |
| Depth | Text | Optional |
| Collection Date | Date | Required |
| Collection Time | Time | Optional |
| Preservation Types | Multi-select checkboxes | None, Ice (4°C), HNO₃, H₂SO₄, HCl, NaOH, Na₂S₂O₃, Zinc Acetate |
| Container Types | Multi-select checkboxes | Plastic, Glass, Amber, HDPE, Sterile |
| Sample Condition | Dropdown | Intact, Damaged, Leaking, Seal Broken, Frozen, Warm (>6°C) |
| Container Count | Number | Min 1 |

QC samples are highlighted with amber background.

#### Step 3: Select Parameters
- Grouped by analyte group (checkboxes)
- Only shows parameter configs matching the selected matrix
- Toggle entire group with group-level checkbox
- Each checkbox represents a `parameter_config` (parameter + method + matrix combination)

#### On Submit:
1. Creates sample records in `samples` table
2. Creates result placeholder records in `results` table (one per sample × selected parameter config, status = "draft")
3. Shows success toast with count

---

## 6. Results Entry (`/results/:departmentSlug`)

### Access Control
- Users only see departments they are assigned to
- Admins see all departments
- If user has no department access, shows "Access Restricted" alert

### Page Layout

#### Top Bar
- **Project selector:** Dropdown of all active projects
- **Action buttons:**
  - **Bulk Upload** — dialog to import results from file
  - **Start Analysis** — transitions sample statuses from "received" → "in_progress" for the selected project/department
  - **Submit for Review** — transitions result statuses from "draft" → "pending_review"
  - **Work Order** — generates a printable worksheet showing sample × parameter matrix

#### Department Navigation
- If user has access to multiple departments, a tab-like selector appears
- URL updates to `/results/{department-slug}` (e.g., `/results/wet-chemistry`)

#### Analyte Group Tabs
- Within each department, analyte groups appear as tabs (e.g., "Heavy Metals", "Hydrocarbons")
- Defined by department configuration

#### Results Entry Grid (ResultsEntryGrid)
- Spreadsheet-style data grid
- **Rows:** Samples (filtered by project + department)
- **Columns:** Parameters in the selected analyte group
- **Per-cell entry:**
  - Value (numeric or text depending on parameter result_type)
  - Unit (from allowed units list)
  - Qualifier (dropdown: <MDL, ND, etc.)
  - Analysis Date
  - Batch ID
  - Instrument ID
  - Analyst Notes
- **Real-time validation:** Checks against MDL/LOQ and min/max range from parameter_config
- **Visual indicators:** Below-MDL values highlighted, validation errors shown inline

#### Project Progress Summary
- When a project is selected, shows per-sample progress bars
- Displays entered/approved counts

---

## 7. Review & Approval (`/review`)

**Access:** Lab Supervisors, QA Officers, Admins only.

### Page Layout

#### Top Bar
- **Project selector:** Filter results by project
- **Action buttons** (appear when results are loaded):
  - **Reject All** — opens rejection dialog
  - **Approve All** — approves all visible results (blocked if any comments exist)

#### Role-Based Tabs (Lab Supervisors only)
- **Pending Review** — results submitted by analysts (status = `pending_review`)
- **Reviewed (QA Pending)** — results already reviewed, waiting for QA approval (status = `reviewed`)

QA Officers see only the `reviewed` status results by default.

#### Review Grid (ReviewGrid)
- Table showing results organized by sample
- Columns: Sample ID, Parameter, Value, Unit, MDL, Qualifier, Analyst Notes, Comment
- **Per-result comment field:** Reviewers can add inline comments for specific results
- Comment count badge shows in action bar

#### Approval Flow
| Reviewer Role | Action | Status Change |
|---------------|--------|---------------|
| Lab Supervisor | Approve | `pending_review` → `reviewed` |
| Lab Supervisor | Reject | `pending_review` → `draft` |
| QA Officer | Approve | `reviewed` → `approved` |
| QA Officer | Reject | `reviewed` → `draft` |

#### Rejection Dialog
- **General Rejection Reason:** Required textarea
- **Individual Comments:** Shows summary of per-result comments (if any)
- Each result gets the general reason + its specific comment in `rejection_reason` field
- Status reverts to `draft`, `rejected_by` and `rejected_at` are recorded

---

## 8. Reports & Release (`/reports`)

**Access:** Lab Supervisors, QA Officers, Admins.

### Summary Cards
- Ready for Release (count)
- Pending Approval (count)
- Active Projects (count)

### Filters
- Search by project code, title, or client name
- Status filter: All Active, Ready for Release, Pending Approval

### Projects Table
| Column | Description |
|--------|-------------|
| Project Code | Text |
| Title | Truncated to 200px |
| Client | Client name |
| Samples | `{completed}/{total} completed` |
| Status | "Ready" (green badge) or "Pending" (grey badge) |
| Actions | COA Export button, Release Project button |

### COA Export (COAExportDialog)
- Generates a Certificate of Analysis as an Excel file (.xlsx)
- Uses the `exceljs` library
- Includes project metadata, sample data, and all approved results

### Release Project (ReleaseProjectDialog)
- Marks a project as `completed`
- Sets `results_issued_date`
- Changes all associated sample statuses to `released`
- Only enabled when all results are approved (`isReadyForRelease`)

---

## 9. Completed Projects Archive (`/completed`)

- Lists all projects with `status = 'completed'`
- Searchable by code, title, or client
- Table columns: Project Code, Title, Client, Location, Samples Count, Collection Date, Results Issued Date
- Actions: View detail, Re-export COA

---

## 10. Validation Dashboard (`/validations`)

**Access:** QA Officers, Admins only.

### Purpose
Displays automated scientific validation checks across all project results.

### Layout
- **Stats cards:** Total warnings, total errors, passed checks
- **Filters:** Search, project filter, severity filter
- **Results grouped by category** (collapsible sections):
  - Hydrocarbons (e.g., TPH vs BTEX ratios)
  - Oxygen Demand (BOD vs COD)
  - Conductivity (TDS vs conductivity)
  - Nitrogen Species (TKN vs NH₃)
  - Solids (TSS vs TDS vs TS)
  - Ionic Balance
  - Alkalinity/pH
  - Hardness

### Validation Logic
Defined in `src/lib/scientificValidation.ts` — performs inter-parameter consistency checks using configurable thresholds stored in `validation_rule_configs` table.

---

## 11. Configuration (Admin Only)

### 11.1 Department Management (`/config/departments`)

#### Department List Table
| Column | Description |
|--------|-------------|
| # | Sort handle (drag indicator) |
| Department | Icon + Name |
| Slug | URL-friendly identifier |
| Analyte Groups | Badges showing configured groups |
| Actions | Edit, Delete |

#### Add/Edit Department Dialog
| Field | Type | Notes |
|-------|------|-------|
| Name | Text | Required. Slug auto-generated |
| Icon | Dropdown | 16 icon options (Beaker, Flask, Microscope, etc.) |
| Analyte Groups | Comma-separated text | e.g., "Heavy Metals, Hydrocarbons, Organics" |

#### Load Template
- Opens LabTemplateSelector dialog
- Pre-defined templates: Environmental, Petrochemical, Food & Beverage
- Each template defines departments with icons, slugs, and analyte groups
- **Replaces** all existing departments

### 11.2 Parameter Library (`/config/parameters`)
Managed by `ParameterLibrary` component.

#### Parameter Fields
| Field | Type | Options |
|-------|------|---------|
| Name | Text | e.g., "Lead" |
| Abbreviation | Text | e.g., "Pb" |
| CAS Number | Text | Optional |
| Lab Section | Dropdown | wet_chemistry, instrumentation, microbiology |
| Department | Dropdown | From configured departments |
| Analyte Group | Text | e.g., "Heavy Metals" |
| Result Type | Dropdown | numeric, presence_absence, mpn, cfu, text |

### 11.3 Methods Library (`/config/methods`)
Managed by `MethodsLibrary` component.

#### Method Fields
| Field | Type | Options |
|-------|------|---------|
| Code | Text | e.g., "EPA 8260" |
| Name | Text | e.g., "Volatile Organic Compounds by GC/MS" |
| Organization | Dropdown | APHA, ASTM, EPA, ISO, Internal |
| Description | Text | Optional |

### 11.4 Parameter Configs (`AddParameterConfigDialog`)
Links a Parameter + Method + Matrix with analytical limits.

#### Parameter Config Fields
| Field | Type | Notes |
|-------|------|-------|
| Parameter | Dropdown | From parameter library |
| Method | Dropdown | From methods library |
| Matrix | Dropdown | Water, Wastewater, Sediment, Soil, Air, Sludge |
| Canonical Unit | Text | e.g., "mg/L" |
| Allowed Units | Text (comma-separated) | e.g., "mg/L, µg/L, ppm" |
| MDL | Number | Minimum Detection Limit |
| LOQ | Number | Limit of Quantification |
| Min Value | Number | Optional validation range |
| Max Value | Number | Optional validation range |
| Decimal Places | Number | Reporting precision |
| Report Below MDL As | Dropdown | `<MDL`, `ND`, or `value` |

### 11.5 Validation Rules (`/config/validations`)
Configure scientific validation rules.

#### Per-Rule Card
- **Toggle switch:** Enable/disable the rule
- **Status badge:** Active or Disabled
- **Threshold inputs:** Configurable numeric thresholds (e.g., typical_ratio_min, tolerance_percent)
- **Save Thresholds button:** Appears when values are modified

#### Rule Categories
- Hydrocarbons, Oxygen Demand, Conductivity, Nitrogen Species, Solids, Alkalinity/pH, Hardness, Ionic Balance

---

## 12. User Management (`/admin/users`)

**Access:** Admins only.

### Page Sections

#### 12.1 Pending Invitations Card
Shows invitations that have been sent but not yet accepted.
| Column | Description |
|--------|-------------|
| Email | Invitee email |
| Assigned Roles | Role badges with department names |
| Sent | Date sent |
| Expires | Expiry date |
| Actions | Cancel (delete) button |

#### 12.2 Lab Staff Table
| Column | Description |
|--------|-------------|
| Name | Full name or "Not set" |
| Email | User email |
| Roles | Role badges (click to remove) |
| Joined | Registration date |
| Actions | "Add Role" button |

#### 12.3 Invite User Dialog
| Field | Type | Notes |
|-------|------|-------|
| Email | Text | Required |
| Role | Dropdown | Analyst, Lab Supervisor, QA Officer, Administrator |
| Department | Dropdown | Required for Analyst and Lab Supervisor roles |
| Role List | Badge list | Can add multiple roles before sending |

**Process:**
1. Enter email and select role(s)
2. Click "Add Role" for each role assignment
3. Click "Send Invitation"
4. Edge function `send-invitation` is called
5. Creates `pending_invitations` record with token
6. Invitation appears in Pending Invitations section

#### 12.4 Add Role Dialog (for existing users)
- Select user → Select role → Select department (if applicable) → Assign
- Maps simple roles to legacy `lab_role` enum values:
  - Analyst + Wet Chemistry dept → `wet_chemistry_analyst`
  - Analyst + Instrumentation dept → `instrumentation_analyst`
  - Analyst + Microbiology dept → `microbiology_analyst`
  - Lab Supervisor → `lab_supervisor`
  - QA Officer → `qa_officer`
  - Admin → `admin`

#### 12.5 Admin Sub-Features
The User Management page also includes:
- **Lab Settings Card** — configure lab-wide settings
- **Compliance Documents Card** — manage regulatory documents (certifications, licenses)
- **Data Purge Dialog** — bulk delete data for maintenance

---

## 13. Profile Settings (`/settings/profile`)

All users can access their own profile settings.

### Sections

#### Profile Picture
- Upload avatar (max 5MB, image files only)
- Remove existing avatar
- Displays initials fallback

#### Basic Information
- **Email:** Read-only, displayed but not editable
- **Full Name:** Editable with Edit/Save/Cancel buttons

#### Assigned Roles
- Read-only display of all assigned roles with department names
- Note: "Contact an administrator to request role changes"

#### Change Password
| Field | Validation |
|-------|------------|
| New Password | Min 8 characters |
| Confirm Password | Must match |

#### Account Information
- Account created date
- Last updated date

---

## 14. Navigation & Layout

### Sidebar (`AppSidebar`)
Collapsible sidebar (toggle with chevron button). Shows:
- **Logo & Organization Name** (from organization settings)
- **Navigation items:**

| Item | Route | Access |
|------|-------|--------|
| Dashboard | `/` | All |
| Projects | `/projects` | All |
| Samples | `/samples` | All |
| Results Entry | `/results/{dept}` | All (filtered by department access) |
| ↳ Sub-items per department | `/results/{dept-slug}` | Based on role |
| Review & Approval | `/review` | Supervisors, QA, Admin |
| Validation Dashboard | `/validations` | QA Officers, Admin |
| Reports | `/reports` | Supervisors, QA, Admin |
| ↳ Reports & Release | `/reports` | |
| ↳ Completed Projects | `/completed` | |
| Configuration | `/config/*` | Admin only |
| ↳ Departments | `/config/departments` | |
| ↳ Parameter Library | `/config/parameters` | |
| ↳ Methods Library | `/config/methods` | |
| ↳ Validation Rules | `/config/validations` | |
| User Management | `/admin/users` | Admin only |

- **Accreditation note** in footer (if configured)
- **Collapsed mode:** Icons only with tooltips on hover

### Header (`AppHeader`)
- **Back button** (visible on all pages except Dashboard)
- **Page title & subtitle** (auto-detected from route)
- **Global Search Bar**
- **Notification dropdown**
- **Help button** (placeholder)
- **User menu dropdown:**
  - Profile Settings link
  - User Management link (admin only)
  - Replay Welcome Tour
  - Sign Out

---

## 15. Role-Based Access Control

### Roles

| Role | Enum Value | Permissions |
|------|------------|-------------|
| **Administrator** | `admin` | Full access to all features, configuration, user management |
| **Lab Supervisor** | `lab_supervisor` | Project/sample management, results review for assigned departments, reports |
| **QA Officer** | `qa_officer` | Final approval authority, validation dashboard access |
| **Wet Chemistry Analyst** | `wet_chemistry_analyst` | Enter results for Wet Chemistry department only |
| **Instrumentation Analyst** | `instrumentation_analyst` | Enter results for Instrumentation department only |
| **Microbiology Analyst** | `microbiology_analyst` | Enter results for Microbiology department only |

### Route Protection
- `ProtectedRoute` component wraps all authenticated routes
- Props: `requireAdmin`, `requireSupervisor`, `requireQaOfficer`
- `SetupGuard` redirects to setup wizard if no departments are configured

### Data-Level Access
- Results Entry page filters departments by user's assigned lab sections
- Review Queue shows results based on reviewer role
- Configuration and User Management routes are admin-only

---

## 16. Welcome Tour

Implemented with `react-joyride`. A guided 4-step onboarding:

| Step | Target | Content |
|------|--------|---------|
| 1 | Center (no target) | Welcome message with organization name |
| 2 | `#app-sidebar` | Explains sidebar navigation |
| 3 | `#new-project-link` | Shows how to create a new project |
| 4 | `#global-search-bar` | Introduces global search |

### Behavior
- Automatically runs for new users (`has_completed_tour = false` in profiles)
- Sets `has_completed_tour = true` on completion or skip
- Can be replayed from User Menu → "Replay Welcome Tour"

---

## 17. Global Search

Located in the header (`GlobalSearchBar`).

- **Searches across:** Projects (code, title), Samples (sample_id, field_id), Clients (name)
- **Real-time filtering** as user types
- **Results grouped** by entity type
- **Click result** → navigates to the relevant page

---

## 18. Notifications

### NotificationDropdown (Header)
- Bell icon with unread count badge
- Dropdown showing recent notifications
- Mark as read / dismiss functionality
- Notification types: result approvals, rejections, system alerts

### Database-Backed
- Stored in `notifications` table
- Created via `create_notification` RPC function
- Fields: title, message, type, link, entity_type, entity_id, read, dismissed

---

## Appendix: Sample Status Lifecycle

```
RECEIVED → IN_PROGRESS → COMPLETED → RELEASED
```

| Status | Trigger |
|--------|---------|
| `received` | Sample registered |
| `in_progress` | "Start Analysis" button clicked |
| `completed` | Auto-set when 100% of results are approved (SampleStatusSyncManager) |
| `released` | Project released via Reports page |

## Appendix: Result Status Lifecycle

```
DRAFT → PENDING_REVIEW → REVIEWED → APPROVED
  ↑                                      │
  └──────── REJECTED (returns to DRAFT) ──┘
```

| Status | Set By |
|--------|--------|
| `draft` | Created automatically during sample registration; or reset after rejection |
| `pending_review` | Analyst clicks "Submit for Review" |
| `reviewed` | Lab Supervisor approves |
| `approved` | QA Officer gives final approval |
| `rejected` | Any reviewer rejects (returns to draft with reason) |
| `revision_required` | Alternative rejection status |

---

## Appendix: Database Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant orgs with name, slug, logo, accreditation |
| `profiles` | User profiles linked to auth.users |
| `user_roles` | Role assignments with department scoping |
| `departments` | Lab departments with icons and analyte groups |
| `clients` | Client/customer records |
| `projects` | Work orders with COC metadata |
| `samples` | Individual samples with matrix, container, preservation info |
| `results` | Analytical results with full audit trail |
| `parameter_configs` | Parameter + Method + Matrix configurations with limits |
| `parameters` | Analyte definitions |
| `methods` | Analytical method records |
| `test_packages` | Bundled parameter groups |
| `test_package_parameters` | Junction table for test packages |
| `validation_errors` | Stored validation issues per result |
| `validation_rule_configs` | Configurable validation rule thresholds |
| `notifications` | User notification records |
| `audit_logs` | Full audit trail for all entity changes |
| `lab_settings` | Key-value lab configuration |
| `compliance_documents` | Regulatory document tracking |
| `pending_invitations` | Token-based user invitations |
