# EnviroLab LIMS (LabLogic)

> A comprehensive, multi-tenant Laboratory Information Management System (LIMS) built for environmental, petrochemical, and food/beverage testing laboratories.

EnviroLab (internally LabLogic) manages the full sample lifecycle from intake to final report release, providing a robust solution for modern laboratory operations.

![Application Overview](https://via.placeholder.com/800x400.png?text=EnviroLab+LIMS)

## 🚀 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Edge Functions, Auth, Storage)
- **State Management:** TanStack React Query
- **Routing:** React Router v6
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod validation

## ✨ Key Features

- **Multi-Tenancy:** Secure data isolation via Row-Level Security (RLS) per organization.
- **Onboarding & Authentication:** Self-service lab registration with pre-defined industry suites, team invitations, and role-based access control.
- **Dashboard & Analytics:** Real-time visibility into lab activity, turnaround times (TAT), active projects, and operational bottlenecks.
- **Project & Sample Management:** Comprehensive project intake with Chain of Custody (COC) compliance. Bulk sample registration and QC sample generation (Blanks, Spikes, Duplicates).
- **Results Entry:** Spreadsheet-style entry grids with real-time validation against Minimum Detection Limits (MDL) and Limit of Quantification (LOQ).
- **Review & Approval Workflow:** Multi-tier approval process (Draft → Pending Review → Reviewed → Approved).
- **Automated Scientific Validation:** Built-in validation dashboard for inter-parameter consistency checks (e.g., BOD vs COD, ionic balances).
- **Reports & COA Generation:** Automated generation and export of Certificates of Analysis (COA) to Excel.
- **Admin Configuration:** Fully customizable departments, parameter libraries, analytical methods, and validation rules.

## 👥 Role-Based Access

The system enforces strict access control across the following roles:

- **Administrator:** Full system access, configuration, and user management.
- **QA Officer:** Final approval authority and validation dashboard access.
- **Lab Supervisor:** Project management, results review, and report generation.
- **Analysts (Wet Chemistry, Instrumentation, Microbiology):** Enter results specific to their assigned departments.

## 🛠️ Getting Started

### Prerequisites

- Node.js installed
- A Supabase project

### Installation

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Link your Supabase project (ensure you have the CLI installed):

   ```bash
   npx supabase link --project-ref your-project-ref
   ```

3. Configure your environment variables in `.env` (use `.env.example` as a template).

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📖 Documentation

For a full breakdown of the application architecture, workflows, and database tables, please consult the [Feature Documentation](./docs/FEATURE_DOCUMENTATION.md).
