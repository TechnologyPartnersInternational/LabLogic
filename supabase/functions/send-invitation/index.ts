import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InvitationRequest {
  email: string;
  roles: Array<{ role: string; lab_section?: string; department_id?: string }>;
}

const roleLabels: Record<string, string> = {
  wet_chemistry_analyst: 'Analyst', instrumentation_analyst: 'Analyst',
  microbiology_analyst: 'Analyst', analyst: 'Analyst',
  lab_supervisor: 'Lab Supervisor', qa_officer: 'QA Officer', admin: 'Administrator',
};

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function getDepartmentNames(supabase: any, departmentIds: string[]): Promise<Record<string, string>> {
  if (departmentIds.length === 0) return {};
  const { data } = await supabase.from('departments').select('id, name').in('id', departmentIds);
  const map: Record<string, string> = {};
  data?.forEach((d: any) => { map[d.id] = d.name; });
  return map;
}

function formatRolesForEmail(roles: Array<{ role: string; department_id?: string }>, deptNames: Record<string, string>): string {
  return roles.map(r => {
    const label = roleLabels[r.role] || r.role;
    if (r.department_id && deptNames[r.department_id]) return `${label} (${deptNames[r.department_id]})`;
    return label;
  }).join(', ');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth client to verify user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Service client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Only administrators can send invitations" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get the admin's organization
    const { data: profileData } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    const orgId = profileData?.organization_id;
    if (!orgId) {
      return new Response(JSON.stringify({ error: "No organization found for user" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get org slug for vanity URL
    const { data: orgData } = await supabase.from('organizations').select('slug, name').eq('id', orgId).single();

    const { email, roles }: InvitationRequest = await req.json();
    if (!email || !roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Email and at least one role are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const invitationToken = generateToken();

    const { data: invitation, error: insertError } = await supabase
      .from('pending_invitations')
      .insert({
        email: email.toLowerCase().trim(),
        token: invitationToken,
        roles,
        invited_by: user.id,
        organization_id: orgId,
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: "Failed to create invitation: " + insertError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const deptIds = roles.filter(r => r.department_id).map(r => r.department_id!);
    const deptNames = await getDepartmentNames(supabase, deptIds);

    const appUrl = Deno.env.get("APP_URL") || "https://envirolab.lovable.app";
    const orgSlug = orgData?.slug || 'lab';
    const orgName = orgData?.name || 'the laboratory';
    const signupUrl = `${appUrl}/join/${orgSlug}?token=${invitationToken}`;
    const rolesDisplay = formatRolesForEmail(roles, deptNames);

    const emailResponse = await resend.emails.send({
      from: `${orgName} <noreply@tpinigeria.com>`,
      to: [email],
      subject: `You've been invited to join ${orgName}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">${orgName}</h1>
    <p style="color: #666; margin-top: 5px;">Laboratory Information Management</p>
  </div>
  <div style="background-color: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #1e293b;">You've Been Invited!</h2>
    <p>You have been invited to join <strong>${orgName}</strong> as a lab staff member.</p>
    <div style="background-color: #e0f2fe; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <strong style="color: #0369a1;">Your assigned role(s):</strong>
      <p style="margin: 5px 0 0 0; color: #0c4a6e;">${rolesDisplay}</p>
    </div>
    <p>Click the button below to create your account and get started:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${signupUrl}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600;">Accept Invitation & Sign Up</a>
    </div>
    <p style="font-size: 14px; color: #64748b;">If the button doesn't work, copy and paste this link:<br><a href="${signupUrl}" style="color: #2563eb; word-break: break-all;">${signupUrl}</a></p>
  </div>
  <div style="text-align: center; font-size: 12px; color: #94a3b8;">
    <p>This invitation will expire in 7 days.</p>
    <p>If you didn't expect this, you can safely ignore this email.</p>
  </div>
</body></html>`,
    });

    if (emailResponse.error) {
      await supabase.from('pending_invitations').delete().eq('id', invitation.id);
      return new Response(JSON.stringify({ error: "Failed to send email: " + emailResponse.error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, message: "Invitation sent successfully", invitation_id: invitation.id }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("Error in send-invitation:", error);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
