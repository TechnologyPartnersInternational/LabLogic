

# Lab Suite Setup Wizard

## Overview

After an admin logs in, if no `lab_type` has been configured yet, they are intercepted by a full-screen setup wizard before reaching the Dashboard. They choose one of three laboratory suites, which configures their entire workspace. Future work will add full URL isolation per lab type, but for now it is a post-login guard.

## Supported Suites (3 only)

1. **Environmental Laboratory** -- ISO 17025 / EPA -- Wet Chemistry, Instrumentation, Microbiology
2. **Petrochemical / Industrial Laboratory** -- ASTM / IP Standards -- Fuel Testing, Lubricants, Water & Effluent
3. **Food & Beverage Laboratory** -- ISO 22000 / Codex Alimentarius -- Proximate Analysis, Chemical Analysis, Microbiology, Sensory & Physical

## User Flow

1. Admin logs in normally via `/auth`
2. `ProtectedRoute` / `SetupGuard` checks if `lab_type` exists in `lab_settings`
3. If missing and user is admin: redirect to `/setup`
4. Wizard shows 3 large cards with suite name, standard, description, and department list
5. Admin selects one, confirms
6. On confirm: existing seeded departments are deleted, chosen template departments are inserted, `lab_type` is saved to `lab_settings`, `lab_tagline` and `lab_accreditation` are updated
7. Redirect to Dashboard -- sidebar, results entry, everything now reflects their lab type
8. Non-admin users without a `lab_type` configured see a "Contact your administrator" message instead

## Technical Details

### New Files

**`src/pages/LabSetupWizard.tsx`**
- Full-screen page (no sidebar/header), LabLogic logo at top
- 3 large responsive cards, each showing: icon, lab type name, regulatory standard, description, expandable department list with analyte groups
- "Select This Suite" button per card
- Confirmation dialog: "This will configure your workspace as a [type] with [N] departments."
- On confirm: calls `replaceWithTemplate` mutation, upserts `lab_type`/`lab_tagline`/`lab_accreditation` into `lab_settings`, then navigates to `/`

**`src/components/auth/SetupGuard.tsx`**
- Wraps the `MainLayout` route group
- Queries `lab_settings` for `lab_type` key
- If no `lab_type` and user is admin: `<Navigate to="/setup" />`
- If no `lab_type` and user is NOT admin: shows "Your administrator has not configured the lab yet" message
- If `lab_type` exists: renders children normally

### Modified Files

**`src/data/labTemplates.ts`**
- Remove `pharmaceutical`, `mining`, and `custom` templates
- Keep only `environmental`, `petrochemical`, `food_beverage`

**`src/App.tsx`**
- Add `/setup` as a protected route (requires auth but no layout) pointing to `LabSetupWizard`
- Wrap the `MainLayout` element with `SetupGuard`

**`src/hooks/useLabSettings.ts`**
- Add `lab_type` to the `LabSettings` interface and defaults
- Add `useUpsertLabSetting` mutation that does upsert (insert on conflict update) since `lab_type` row may not exist yet

**`src/hooks/useDepartments.ts`**
- Add `useReplaceWithTemplate` mutation: deletes all existing departments, then inserts the chosen template's departments

### Database

No schema changes needed. We use the existing `lab_settings` table to store `lab_type` via upsert. The `lab_settings` RLS already allows admin INSERT/UPDATE/DELETE and authenticated SELECT.

One small migration: add an upsert-friendly unique constraint on `lab_settings.setting_key` (it may already be unique -- if not, we add it so the upsert works).

### What Happens After Setup

- Sidebar dynamically shows departments from the database (already implemented)
- Results Entry routes dynamically via `/results/:departmentSlug` (already implemented)
- Dashboard stats work with whatever departments exist (already implemented)
- Admin can still customize departments later via `/config/departments`

