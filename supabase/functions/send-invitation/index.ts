import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  roles: Array<{
    role: string;
    lab_section?: string;
  }>;
}

const roleLabels: Record<string, string> = {
  wet_chemistry_analyst: 'Wet Chemistry Analyst',
  instrumentation_analyst: 'Instrumentation Analyst',
  microbiology_analyst: 'Microbiology Analyst',
  lab_supervisor: 'Lab Supervisor',
  qa_officer: 'QA Officer',
  admin: 'Administrator',
};

const sectionLabels: Record<string, string> = {
  wet_chemistry: 'Wet Chemistry',
  instrumentation: 'Instrumentation',
  microbiology: 'Microbiology',
};

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function formatRolesForEmail(roles: Array<{ role: string; lab_section?: string }>): string {
  return roles.map(r => {
    const roleLabel = roleLabels[r.role] || r.role;
    if (r.lab_section) {
      return `${roleLabel} (${sectionLabels[r.lab_section] || r.lab_section})`;
    }
    return roleLabel;
  }).join(', ');
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-invitation function called");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user and check admin role
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Failed to get claims:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("User ID:", userId);

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { _user_id: userId });
    
    if (adminError || !isAdmin) {
      console.error("User is not admin:", adminError);
      return new Response(
        JSON.stringify({ error: "Only administrators can send invitations" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email, roles }: InvitationRequest = await req.json();
    console.log("Invitation request for:", email, "with roles:", roles);

    if (!email || !roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Email and at least one role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate invitation token
    const invitationToken = generateToken();
    console.log("Generated invitation token");

    // Store invitation in database
    const { data: invitation, error: insertError } = await supabase
      .from('pending_invitations')
      .insert({
        email: email.toLowerCase().trim(),
        token: invitationToken,
        roles: roles,
        invited_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create invitation:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create invitation: " + insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Invitation stored in database:", invitation.id);

    // Build signup URL with invitation token
    const appUrl = Deno.env.get("APP_URL") || "https://lab-flow-assist.lovable.app";
    const signupUrl = `${appUrl}/auth?invitation=${invitationToken}`;

    // Format roles for email display
    const rolesDisplay = formatRolesForEmail(roles);

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "LabFlow LIMS <noreply@tpinigeria.com>",
      to: [email],
      subject: "You've been invited to join LabFlow LIMS",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">LabFlow LIMS</h1>
            <p style="color: #666; margin-top: 5px;">Environmental Laboratory Management</p>
          </div>
          
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #1e293b;">You've Been Invited!</h2>
            <p>You have been invited to join LabFlow LIMS as a lab staff member.</p>
            
            <div style="background-color: #e0f2fe; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <strong style="color: #0369a1;">Your assigned role(s):</strong>
              <p style="margin: 5px 0 0 0; color: #0c4a6e;">${rolesDisplay}</p>
            </div>
            
            <p>Click the button below to create your account and get started:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signupUrl}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600;">
                Accept Invitation & Sign Up
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${signupUrl}" style="color: #2563eb; word-break: break-all;">${signupUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #94a3b8;">
            <p>This invitation will expire in 7 days.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error("Failed to send email:", emailResponse.error);
      // Delete the invitation since email failed
      await supabase.from('pending_invitations').delete().eq('id', invitation.id);
      return new Response(
        JSON.stringify({ error: "Failed to send invitation email: " + emailResponse.error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Invitation email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully",
        invitation_id: invitation.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
