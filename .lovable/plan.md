

# Generalize LabLogic: Dynamic Departments with Industry Templates

## Overview

Replace all hardcoded lab sections (Wet Chemistry, Instrumentation, Microbiology) with an admin-defined `departments` table. On first setup, admins select from industry-standard laboratory templates to pre-populate their department structure. Clinical/Diagnostic is excluded per your request.

## Template Library

Each template includes departments with their analyte groups, following real-world industry standards and regulatory frameworks.

### 1. Environmental Laboratory (ISO 17025 / EPA)
- **Wet Chemistry**: Physico-Chemical, Anions, Cations
- **Instrumentation**: Heavy Metals (ICP-OES/MS), Hydrocarbons (GC-FID/MS), Organics (HPLC/LC-MS)
- **Microbiology**: Indicator Organisms, Pathogens, Biological Oxygen Demand

### 2. Pharmaceutical / QC Laboratory (GMP / USP / ICH)
- **Raw Materials Testing**: Identity Testing, Purity Analysis, Assay/Potency
- **In-Process Controls**: Blend Uniformity, Content Uniformity, Dissolution
- **Finished Product**: Assay, Related Substances/Impurities, Stability Indicating
- **Microbiology**: Bioburden, Sterility Testing, Endotoxin (LAL)

### 3. Food & Beverage Laboratory (ISO 22000 / Codex)
- **Proximate Analysis**: Moisture, Ash, Protein, Fat, Fiber, Carbohydrates
- **Chemical Analysis**: Additives, Preservatives, Contaminants, Pesticide Residues
- **Microbiology**: Pathogens (Salmonella, Listeria, E. coli), Indicator Organisms, Yeast & Mold
- **Sensory & Physical**: Texture, Color, Viscosity, Particle Size

### 4. Petrochemical / Fuels Laboratory (ASTM / IP)
- **Fuel Testing**: Octane/Cetane, Sulfur Content, Distillation, Flash Point
- **Lubricants**: Viscosity, Wear Metals, Total Acid/Base Number, Oxidation Stability
- **Water & Effluent**: Process Water, Cooling Water, Discharge Monitoring

### 5. Mining & Metallurgical Laboratory (ISO 17025 / JORC)
- **Fire Assay**: Gold, PGMs, Silver
- **Geochemistry**: Multi-Element (ICP-OES/MS), Trace Analysis, Whole Rock
- **Process Control**: Grade Control, Recovery Testing, Particle Size Distribution
- **Environmental Monitoring**: Tailings, Acid Mine Drainage, Water Quality

### 6. Custom (Blank)
- Start from scratch -- no pre-populated departments

---

## Technical Plan

### Phase 1: Database Migration

**1a. Create `departments` table:**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT | e.g. "Wet Chemistry" |
| slug | TEXT UNIQUE | URL-safe, e.g. "wet-chemistry" |
| icon | TEXT | Lucide icon name |
| analyte_groups | JSONB | Array of {key, label} objects |
| sort_order | INTEGER | Display ordering |
| is_active | BOOLEAN | Soft delete |
| created_at | TIMESTAMPTZ | |
| created_by | UUID | |

RLS: All authenticated can SELECT; Admins can INSERT/UPDATE/DELETE.

**1b. Seed existing sections** into departments so current data stays valid:
- wet_chemistry, instrumentation, microbiology with their current analyte groups.

**1c. Add `department_id` FK column** to `parameters`, `test_packages`, and `user_roles`. Migrate data by matching existing `lab_section` enum values to seeded department rows. Then drop old `lab_section` enum columns.

**1d. Simplify `lab_role` enum** -- replace `wet_chemistry_analyst`, `instrumentation_analyst`, `microbiology_analyst` with a single `analyst` role. The department assignment on `user_roles.department_id` controls which department they belong to.

**1e. Update database functions:**
- `is_analyst_for_section(user_id, section)` becomes `is_analyst_for_department(user_id, department_id)` -- checks `user_roles` by `department_id` instead of enum.
- `get_user_lab_sections(user_id)` becomes `get_user_departments(user_id)` -- returns department IDs.

### Phase 2: Template Data + Selector UI

**New files:**

- `src/data/labTemplates.ts` -- static TypeScript constant with all 6 template definitions (departments + analyte groups per industry).
- `src/components/config/LabTemplateSelector.tsx` -- grid of industry cards. Each shows the industry name, a brief description, and a collapsible list of departments with their analyte groups. "Use This Template" button on each card.

### Phase 3: Department Management Page

**New page: `/config/departments`** (Admin only)

- Lists current departments with drag-to-reorder (sort_order)
- Add/Edit department: name, slug (auto-generated), icon picker (dropdown of relevant Lucide icons), analyte groups (tag input)
- Delete department (blocked if parameters or users are assigned)
- "Load Template" button opens LabTemplateSelector (warns that it adds departments, doesn't replace)
- If no departments exist, automatically shows the template selector

### Phase 4: Dynamic Results Entry

- Replace hardcoded `/results/wet-chemistry` etc. routes with a single `/results/:departmentSlug` dynamic route in `App.tsx`.
- `ResultsEntry.tsx` -- fetch departments from DB, derive tabs from department's `analyte_groups` JSON instead of hardcoded `labSections` constant.
- `ResultsEntryGrid.tsx` -- accept `departmentId` prop instead of category string. Filter parameter configs by `department_id` FK. Derive analyte group filtering from the department record.
- `AppSidebar.tsx` -- query departments table to dynamically build the Results Entry sub-menu instead of hardcoded links.

### Phase 5: Update User Management

- Replace fixed role dropdowns with dynamic ones:
  - Role picker: `analyst`, `lab_supervisor`, `qa_officer`, `admin`
  - Department picker (shown for analyst/supervisor): populated from `departments` table
- Update `send-invitation` edge function to use department ID instead of enum.

### Phase 6: Update Supporting Components

| Component | Change |
|-----------|--------|
| `useAuth.tsx` | Return department IDs instead of enum sections; `canEnterResults` checks department_id |
| `BulkUploadDialog.tsx` | Derive analyte groups from department record instead of hardcoded map |
| `WorkOrderDialog.tsx` | Accept departmentId, filter by it |
| `SampleProgressIndicator.tsx` | Use department names from DB |
| `ProfileSettings.tsx` | Display department name from DB |
| `src/types/lims.ts` | Remove `LabCategory` type; add `Department` interface |

### Phase 7: Cleanup

- Remove all hardcoded `labSections`, `categoryToLabSection`, `labSectionToAnalyteGroups` constants
- Remove old enum references from TypeScript types
- Drop unused database enum types after migration confirmed

---

## Files Summary

| Category | Files |
|----------|-------|
| New | `src/data/labTemplates.ts`, `src/components/config/LabTemplateSelector.tsx`, `src/pages/DepartmentManagement.tsx`, `src/hooks/useDepartments.ts` |
| Database | 1 migration (departments table, data migration, function updates, enum changes) |
| Modified | `App.tsx`, `AppSidebar.tsx`, `ResultsEntry.tsx`, `ResultsEntryGrid.tsx`, `BulkUploadDialog.tsx`, `WorkOrderDialog.tsx`, `UserManagement.tsx`, `useAuth.tsx`, `ProfileSettings.tsx`, `SampleProgressIndicator.tsx`, `lims.ts`, `send-invitation/index.ts` |

## Migration Safety

- Existing data is migrated by mapping current enum values to seeded department rows -- zero data loss.
- Old columns dropped only after FK migration confirmed.
- Template selection is additive (never destructive).

