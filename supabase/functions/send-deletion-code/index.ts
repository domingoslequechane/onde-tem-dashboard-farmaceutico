import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCodeRequest {
  adminEmail: string;
  pharmacyName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      throw new Error("Unauthorized");
    }

    const token = authHeader.replace("Bearer ", "");

    // Create Supabase clients
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Create admin client for querying user_roles (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user authentication using the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      throw new Error("Unauthorized");
    }

    console.log("User authenticated:", user.id);

    // Verify user is admin using service role to bypass RLS
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError) {
      console.error("Role query error:", roleError);
      throw new Error("Unauthorized - Admin only");
    }

    if (!roleData || (roleData.role !== "admin" && roleData.role !== "super_admin")) {
      console.error("User is not admin or super_admin. Role:", roleData?.role);
      throw new Error("Unauthorized - Admin only");
    }

    console.log("User verified as admin");

    const { adminEmail, pharmacyName }: SendCodeRequest = await req.json();

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated verification code");

    // Store code in database with 10 minute expiration (use admin client to bypass RLS)
    const { error: insertError } = await supabaseAdmin
      .from("deletion_codes")
      .insert({
        admin_id: user.id,
        code: code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      console.error("Error storing code:", insertError);
      throw new Error("Failed to generate verification code");
    }

    console.log("Code stored in database");

    // Send email with code
    const fromEmail = Deno.env.get("FROM_EMAIL") || "OndeTem <onboarding@resend.dev>";
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [adminEmail],
      subject: "Código de Verificação - Eliminação de Farmácia",
      html: `
        <h1>Código de Verificação</h1>
        <p>Você solicitou a eliminação da farmácia: <strong>${pharmacyName}</strong></p>
        <p>Seu código de verificação é:</p>
        <h2 style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #dc2626;">${code}</h2>
        <p>Este código expira em 10 minutos.</p>
        <p><strong>AVISO:</strong> Esta ação é irreversível e eliminará permanentemente todos os dados da farmácia.</p>
        <br>
        <p>Se você não solicitou esta ação, ignore este email.</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Código enviado com sucesso" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-deletion-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === "Unauthorized" || error.message === "Unauthorized - Admin only" ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
