import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 1. Create auth user ──
    const email = "chifum@gmail.com";
    const password = "123456789";
    const fullName = "Chifum Ifeadi";

    // Check if user already exists
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u: any) => u.email === email);
    let userId: string;

    if (existing) {
      userId = existing.id;
      console.log("User already exists:", userId);
    } else {
      const { data: authData, error: authErr } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });
      if (authErr) throw authErr;
      userId = authData.user.id;
      console.log("User created:", userId);
    }

    // Ensure profile exists
    await admin.from("profiles").upsert(
      { id: userId, email, full_name: fullName },
      { onConflict: "id" }
    );

    // ── 2. Create organization ──
    const { data: existingOrg } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", "tpi-lab")
      .maybeSingle();

    let orgId: string;
    if (existingOrg) {
      orgId = existingOrg.id;
      console.log("Org already exists:", orgId);
    } else {
      const { data: newOrg, error: orgErr } = await admin
        .from("organizations")
        .insert({
          name: "TPI LAB",
          slug: "tpi-lab",
          industry_suite: "environmental",
          accreditation: "ISO 17025 / EPA",
          created_by: userId,
        })
        .select("id")
        .single();
      if (orgErr) throw orgErr;
      orgId = newOrg.id;
    }

    // Link profile to org
    await admin
      .from("profiles")
      .update({ organization_id: orgId })
      .eq("id", userId);

    // Assign admin role
    const { data: existingRole } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!existingRole) {
      await admin.from("user_roles").insert({
        user_id: userId,
        role: "admin",
        organization_id: orgId,
      });
    }

    // ── 3. Seed departments ──
    const departments = [
      {
        name: "Wet Chemistry",
        slug: "wet-chemistry",
        icon: "beaker",
        analyte_groups: [
          { key: "physico_chemical", label: "Physico-Chemical" },
          { key: "anions", label: "Anions" },
          { key: "cations", label: "Cations" },
        ],
        sort_order: 1,
        organization_id: orgId,
        created_by: userId,
      },
      {
        name: "Instrumentation",
        slug: "instrumentation",
        icon: "activity",
        analyte_groups: [
          { key: "heavy_metals", label: "Heavy Metals (ICP-OES/MS)" },
          { key: "hydrocarbons", label: "Hydrocarbons (GC-FID/MS)" },
          { key: "organics", label: "Organics (HPLC/LC-MS)" },
        ],
        sort_order: 2,
        organization_id: orgId,
        created_by: userId,
      },
      {
        name: "Microbiology",
        slug: "microbiology",
        icon: "microscope",
        analyte_groups: [
          { key: "indicator_organisms", label: "Indicator Organisms" },
          { key: "pathogens", label: "Pathogens" },
          { key: "bod", label: "Biological Oxygen Demand" },
        ],
        sort_order: 3,
        organization_id: orgId,
        created_by: userId,
      },
    ];

    // Upsert departments
    const { data: deptRows } = await admin
      .from("departments")
      .select("id, slug")
      .eq("organization_id", orgId);

    const existingSlugs = new Set((deptRows || []).map((d: any) => d.slug));
    const newDepts = departments.filter((d) => !existingSlugs.has(d.slug));
    if (newDepts.length > 0) {
      await admin.from("departments").insert(newDepts);
    }

    // Re-fetch departments for IDs
    const { data: allDepts } = await admin
      .from("departments")
      .select("id, slug")
      .eq("organization_id", orgId);
    const deptMap: Record<string, string> = {};
    (allDepts || []).forEach((d: any) => {
      deptMap[d.slug] = d.id;
    });

    // ── 4. Seed lab_settings ──
    const { data: existingSetting } = await admin
      .from("lab_settings")
      .select("id")
      .eq("organization_id", orgId)
      .eq("setting_key", "lab_type")
      .maybeSingle();
    if (!existingSetting) {
      await admin.from("lab_settings").insert({
        setting_key: "lab_type",
        setting_value: "environmental",
        organization_id: orgId,
      });
    }

    // ── 5. Seed clients ──
    const clientNames = [
      "Shell Petroleum",
      "Total Energies Nigeria",
      "Lagos State Water Corporation",
      "NESREA",
      "Dangote Industries",
    ];

    const { data: existingClients } = await admin
      .from("clients")
      .select("id, name")
      .eq("organization_id", orgId);
    const existingClientNames = new Set(
      (existingClients || []).map((c: any) => c.name)
    );

    const newClients = clientNames
      .filter((n) => !existingClientNames.has(n))
      .map((name) => ({
        name,
        organization_id: orgId,
        created_by: userId,
        contact_name: `${name} Contact`,
        email: `info@${name.toLowerCase().replace(/\s+/g, "")}.com`,
      }));

    if (newClients.length > 0) {
      await admin.from("clients").insert(newClients);
    }

    // Re-fetch clients
    const { data: allClients } = await admin
      .from("clients")
      .select("id, name")
      .eq("organization_id", orgId);
    const clientIds = (allClients || []).map((c: any) => c.id);

    // ── 6. Seed methods ──
    const methodDefs = [
      { code: "APHA 2120", name: "Color – Visual", organization: "APHA" },
      { code: "APHA 2130", name: "Turbidity – Nephelometric", organization: "APHA" },
      { code: "APHA 4500-H", name: "pH – Electrometric", organization: "APHA" },
      { code: "APHA 2510", name: "Conductivity", organization: "APHA" },
      { code: "APHA 2540C", name: "TDS – Dried at 180°C", organization: "APHA" },
      { code: "APHA 2540D", name: "TSS – Dried at 103–105°C", organization: "APHA" },
      { code: "APHA 5210B", name: "BOD – 5 Day Test", organization: "APHA" },
      { code: "APHA 5220D", name: "COD – Closed Reflux", organization: "APHA" },
      { code: "APHA 4500-NO3", name: "Nitrate – UV Spectrophotometric", organization: "APHA" },
      { code: "APHA 4500-P", name: "Phosphate – Ascorbic Acid", organization: "APHA" },
      { code: "EPA 200.7", name: "Metals by ICP-OES", organization: "EPA" },
      { code: "EPA 524.2", name: "VOCs by GC/MS", organization: "EPA" },
      { code: "APHA 9222B", name: "Total Coliform – MF", organization: "APHA" },
      { code: "APHA 9223B", name: "E. coli – Colilert", organization: "APHA" },
      { code: "APHA 4500-Cl", name: "Chloride – Argentometric", organization: "APHA" },
    ];

    const { data: existingMethods } = await admin
      .from("methods")
      .select("id, code")
      .eq("organization_id", orgId);
    const existingMethodCodes = new Set(
      (existingMethods || []).map((m: any) => m.code)
    );

    const newMethods = methodDefs
      .filter((m) => !existingMethodCodes.has(m.code))
      .map((m) => ({ ...m, organization_id: orgId }));

    if (newMethods.length > 0) {
      await admin.from("methods").insert(newMethods);
    }

    const { data: allMethods } = await admin
      .from("methods")
      .select("id, code")
      .eq("organization_id", orgId);
    const methodMap: Record<string, string> = {};
    (allMethods || []).forEach((m: any) => {
      methodMap[m.code] = m.id;
    });

    // ── 7. Seed parameters ──
    const paramDefs = [
      { name: "pH", abbreviation: "pH", lab_section: "wet_chemistry", analyte_group: "physico_chemical", result_type: "numeric", department_slug: "wet-chemistry" },
      { name: "Turbidity", abbreviation: "Turb", lab_section: "wet_chemistry", analyte_group: "physico_chemical", result_type: "numeric", department_slug: "wet-chemistry" },
      { name: "Total Dissolved Solids", abbreviation: "TDS", lab_section: "wet_chemistry", analyte_group: "physico_chemical", result_type: "numeric", department_slug: "wet-chemistry" },
      { name: "Total Suspended Solids", abbreviation: "TSS", lab_section: "wet_chemistry", analyte_group: "physico_chemical", result_type: "numeric", department_slug: "wet-chemistry" },
      { name: "Conductivity", abbreviation: "EC", lab_section: "wet_chemistry", analyte_group: "physico_chemical", result_type: "numeric", department_slug: "wet-chemistry" },
      { name: "Biochemical Oxygen Demand", abbreviation: "BOD", lab_section: "wet_chemistry", analyte_group: "physico_chemical", result_type: "numeric", department_slug: "wet-chemistry" },
      { name: "Chemical Oxygen Demand", abbreviation: "COD", lab_section: "wet_chemistry", analyte_group: "physico_chemical", result_type: "numeric", department_slug: "wet-chemistry" },
      { name: "Nitrate", abbreviation: "NO3", lab_section: "wet_chemistry", analyte_group: "anions", result_type: "numeric", department_slug: "wet-chemistry" },
      { name: "Phosphate", abbreviation: "PO4", lab_section: "wet_chemistry", analyte_group: "anions", result_type: "numeric", department_slug: "wet-chemistry" },
      { name: "Chloride", abbreviation: "Cl", lab_section: "wet_chemistry", analyte_group: "anions", result_type: "numeric", department_slug: "wet-chemistry" },
      { name: "Lead", abbreviation: "Pb", lab_section: "instrumentation", analyte_group: "heavy_metals", result_type: "numeric", department_slug: "instrumentation" },
      { name: "Cadmium", abbreviation: "Cd", lab_section: "instrumentation", analyte_group: "heavy_metals", result_type: "numeric", department_slug: "instrumentation" },
      { name: "Total Coliform", abbreviation: "TC", lab_section: "microbiology", analyte_group: "indicator_organisms", result_type: "numeric", department_slug: "microbiology" },
      { name: "E. coli", abbreviation: "E.coli", lab_section: "microbiology", analyte_group: "indicator_organisms", result_type: "presence_absence", department_slug: "microbiology" },
      { name: "Color", abbreviation: "Color", lab_section: "wet_chemistry", analyte_group: "physico_chemical", result_type: "numeric", department_slug: "wet-chemistry" },
    ];

    const { data: existingParams } = await admin
      .from("parameters")
      .select("id, abbreviation")
      .eq("organization_id", orgId);
    const existingParamAbbrs = new Set(
      (existingParams || []).map((p: any) => p.abbreviation)
    );

    const newParams = paramDefs
      .filter((p) => !existingParamAbbrs.has(p.abbreviation))
      .map((p) => ({
        name: p.name,
        abbreviation: p.abbreviation,
        lab_section: p.lab_section,
        analyte_group: p.analyte_group,
        result_type: p.result_type,
        organization_id: orgId,
        department_id: deptMap[p.department_slug] || null,
      }));

    if (newParams.length > 0) {
      await admin.from("parameters").insert(newParams);
    }

    const { data: allParams } = await admin
      .from("parameters")
      .select("id, abbreviation")
      .eq("organization_id", orgId);
    const paramMap: Record<string, string> = {};
    (allParams || []).forEach((p: any) => {
      paramMap[p.abbreviation] = p.id;
    });

    // ── 8. Seed parameter_configs ──
    const configDefs = [
      { param: "pH", method: "APHA 4500-H", matrix: "water", unit: "pH units", mdl: 0.1, loq: 0.5, decimal: 1, min: 0, max: 14 },
      { param: "Turb", method: "APHA 2130", matrix: "water", unit: "NTU", mdl: 0.1, loq: 1, decimal: 1 },
      { param: "TDS", method: "APHA 2540C", matrix: "water", unit: "mg/L", mdl: 1, loq: 5, decimal: 0 },
      { param: "TSS", method: "APHA 2540D", matrix: "wastewater", unit: "mg/L", mdl: 1, loq: 5, decimal: 0 },
      { param: "EC", method: "APHA 2510", matrix: "water", unit: "µS/cm", mdl: 1, loq: 5, decimal: 0 },
      { param: "BOD", method: "APHA 5210B", matrix: "wastewater", unit: "mg/L", mdl: 1, loq: 2, decimal: 1 },
      { param: "COD", method: "APHA 5220D", matrix: "wastewater", unit: "mg/L", mdl: 5, loq: 10, decimal: 0 },
      { param: "NO3", method: "APHA 4500-NO3", matrix: "water", unit: "mg/L", mdl: 0.01, loq: 0.05, decimal: 2 },
      { param: "PO4", method: "APHA 4500-P", matrix: "water", unit: "mg/L", mdl: 0.01, loq: 0.05, decimal: 2 },
      { param: "Cl", method: "APHA 4500-Cl", matrix: "water", unit: "mg/L", mdl: 1, loq: 5, decimal: 0 },
      { param: "Pb", method: "EPA 200.7", matrix: "water", unit: "mg/L", mdl: 0.001, loq: 0.005, decimal: 3, max: 0.01 },
      { param: "Cd", method: "EPA 200.7", matrix: "water", unit: "mg/L", mdl: 0.0005, loq: 0.003, decimal: 4, max: 0.003 },
      { param: "TC", method: "APHA 9222B", matrix: "water", unit: "CFU/100mL", mdl: 1, loq: 1, decimal: 0 },
      { param: "E.coli", method: "APHA 9223B", matrix: "water", unit: "MPN/100mL", mdl: 1, loq: 1, decimal: 0 },
      { param: "Color", method: "APHA 2120", matrix: "water", unit: "Pt-Co", mdl: 1, loq: 5, decimal: 0 },
    ];

    const { data: existingConfigs } = await admin
      .from("parameter_configs")
      .select("id")
      .eq("organization_id", orgId);

    if (!existingConfigs || existingConfigs.length === 0) {
      const configRows = configDefs
        .filter((c) => paramMap[c.param] && methodMap[c.method])
        .map((c) => ({
          parameter_id: paramMap[c.param],
          method_id: methodMap[c.method],
          matrix: c.matrix,
          canonical_unit: c.unit,
          mdl: c.mdl,
          loq: c.loq,
          decimal_places: c.decimal,
          min_value: c.min ?? null,
          max_value: c.max ?? null,
          organization_id: orgId,
        }));
      if (configRows.length > 0) {
        await admin.from("parameter_configs").insert(configRows);
      }
    }

    // Re-fetch param configs for results
    const { data: allConfigs } = await admin
      .from("parameter_configs")
      .select("id, parameter_id, matrix")
      .eq("organization_id", orgId);

    // ── 9. Seed 15 projects with samples and results ──
    const projectDefs = [
      { code: "TPI-2026-001", title: "Lagos Lagoon Water Quality Survey", client: 0, status: "active", location: "Lagos Lagoon, Victoria Island", matrix: "water" },
      { code: "TPI-2026-002", title: "Shell Forcados Terminal Effluent", client: 0, status: "active", location: "Forcados Terminal, Delta State", matrix: "wastewater" },
      { code: "TPI-2026-003", title: "Lekki Phase 1 Borehole Analysis", client: 2, status: "active", location: "Lekki Phase 1, Lagos", matrix: "water" },
      { code: "TPI-2026-004", title: "Dangote Refinery Discharge Monitoring", client: 4, status: "active", location: "Dangote Refinery, Lekki FTZ", matrix: "wastewater" },
      { code: "TPI-2026-005", title: "Total Energies OML 58 Produced Water", client: 1, status: "active", location: "OML 58, Rivers State", matrix: "wastewater" },
      { code: "TPI-2026-006", title: "Ikoyi Drinking Water Compliance", client: 2, status: "completed", location: "Ikoyi, Lagos", matrix: "water" },
      { code: "TPI-2026-007", title: "NESREA Ambient Air Baseline - Apapa", client: 3, status: "completed", location: "Apapa Industrial Area", matrix: "water" },
      { code: "TPI-2026-008", title: "Port Harcourt Refinery Cooling Water", client: 0, status: "completed", location: "PHRC, Rivers State", matrix: "water" },
      { code: "TPI-2026-009", title: "Eko Atlantic Groundwater Assessment", client: 2, status: "active", location: "Eko Atlantic City", matrix: "water" },
      { code: "TPI-2026-010", title: "Bonny Island LNG Facility Effluent", client: 0, status: "active", location: "Bonny Island, Rivers", matrix: "wastewater" },
      { code: "TPI-2026-011", title: "Ogoniland Remediation Verification", client: 3, status: "completed", location: "Ogoniland, Rivers State", matrix: "water" },
      { code: "TPI-2026-012", title: "VI Residential Estate Water Audit", client: 2, status: "active", location: "Victoria Island, Lagos", matrix: "water" },
      { code: "TPI-2026-013", title: "Agbara Industrial Zone Discharge", client: 4, status: "active", location: "Agbara, Ogun State", matrix: "wastewater" },
      { code: "TPI-2026-014", title: "Epe Lagoon Sediment Assessment", client: 3, status: "completed", location: "Epe Lagoon, Lagos", matrix: "water" },
      { code: "TPI-2026-015", title: "Ibeju-Lekki New Town Water Study", client: 2, status: "active", location: "Ibeju-Lekki, Lagos", matrix: "water" },
    ];

    const { data: existingProjects } = await admin
      .from("projects")
      .select("id, code")
      .eq("organization_id", orgId);
    const existingCodes = new Set(
      (existingProjects || []).map((p: any) => p.code)
    );

    const projectsToInsert = projectDefs
      .filter((p) => !existingCodes.has(p.code))
      .map((p, i) => {
        const receiptDate = new Date(2026, 0, 10 + i * 2);
        const collectionDate = new Date(receiptDate);
        collectionDate.setDate(collectionDate.getDate() - 1);

        return {
          code: p.code,
          title: p.title,
          client_id: clientIds[p.client % clientIds.length],
          status: p.status,
          location: p.location,
          organization_id: orgId,
          created_by: userId,
          sample_collection_date: collectionDate.toISOString().split("T")[0],
          sample_receipt_date: receiptDate.toISOString().split("T")[0],
          analysis_start_date:
            p.status !== "active"
              ? new Date(receiptDate.getTime() + 86400000)
                  .toISOString()
                  .split("T")[0]
              : null,
          results_issued_date:
            p.status === "completed"
              ? new Date(receiptDate.getTime() + 7 * 86400000)
                  .toISOString()
                  .split("T")[0]
              : null,
        };
      });

    if (projectsToInsert.length > 0) {
      await admin.from("projects").insert(projectsToInsert);
    }

    // Re-fetch all projects
    const { data: allProjects } = await admin
      .from("projects")
      .select("id, code, sample_collection_date")
      .eq("organization_id", orgId);

    // ── 10. Seed samples (2 per project = 30 samples) ──
    const { data: existingSamples } = await admin
      .from("samples")
      .select("id, sample_id, project_id")
      .eq("organization_id", orgId);
    const existingSampleIds = new Set(
      (existingSamples || []).map((s: any) => s.sample_id)
    );

    const samplesToInsert: any[] = [];
    const projectDefMap: Record<string, typeof projectDefs[0]> = {};
    projectDefs.forEach((p) => {
      projectDefMap[p.code] = p;
    });

    (allProjects || []).forEach((proj: any, pi: number) => {
      const def = projectDefMap[proj.code];
      if (!def) return;
      const matrix = def.matrix as string;

      for (let si = 0; si < 2; si++) {
        const sampleId = `${proj.code}-S${si + 1}`;
        if (existingSampleIds.has(sampleId)) continue;

        const statusMap: Record<string, string> = {
          active: si === 0 ? "in_progress" : "received",
          completed: "completed",
        };

        samplesToInsert.push({
          sample_id: sampleId,
          project_id: proj.id,
          matrix,
          collection_date:
            proj.sample_collection_date || "2026-01-10",
          sample_type: si === 0 ? "grab" : "composite",
          status: statusMap[def.status] || "received",
          location: def.location,
          organization_id: orgId,
          created_by: userId,
        });
      }
    });

    if (samplesToInsert.length > 0) {
      await admin.from("samples").insert(samplesToInsert);
    }

    // ── 11. Seed results for completed/in_progress samples ──
    const { data: allSamples } = await admin
      .from("samples")
      .select("id, sample_id, matrix, status")
      .eq("organization_id", orgId);

    const { data: existingResults } = await admin
      .from("results")
      .select("id")
      .eq("organization_id", orgId);

    if (!existingResults || existingResults.length === 0) {
      const resultsToInsert: any[] = [];

      (allSamples || []).forEach((sample: any) => {
        if (sample.status === "received") return; // skip unstarted

        // Pick 5 random configs matching matrix
        const matching = (allConfigs || []).filter(
          (c: any) => c.matrix === sample.matrix
        );
        const selected = matching.slice(0, 5);

        selected.forEach((config: any) => {
          const val = (Math.random() * 100).toFixed(2);
          const resultStatus =
            sample.status === "completed"
              ? "approved"
              : sample.status === "in_progress"
                ? "pending_review"
                : "draft";

          resultsToInsert.push({
            sample_id: sample.id,
            parameter_config_id: config.id,
            entered_value: val,
            entered_unit: "mg/L",
            canonical_value: parseFloat(val),
            canonical_unit: "mg/L",
            status: resultStatus,
            entered_by: userId,
            entered_at: new Date().toISOString(),
            organization_id: orgId,
            analysis_date: new Date().toISOString().split("T")[0],
            ...(resultStatus === "approved"
              ? {
                  reviewed_by: userId,
                  reviewed_at: new Date().toISOString(),
                  approved_by: userId,
                  approved_at: new Date().toISOString(),
                }
              : {}),
            ...(resultStatus === "pending_review"
              ? {
                  reviewed_by: null,
                  reviewed_at: null,
                }
              : {}),
          });
        });
      });

      if (resultsToInsert.length > 0) {
        // Insert in batches of 50
        for (let i = 0; i < resultsToInsert.length; i += 50) {
          const batch = resultsToInsert.slice(i, i + 50);
          const { error: resErr } = await admin
            .from("results")
            .insert(batch);
          if (resErr) {
            console.error("Results insert error batch", i, resErr);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "TPI LAB seeded successfully",
        orgId,
        userId,
        email,
        password,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Seed error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
