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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Unauthorized");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || roleData?.role !== "admin") {
      throw new Error("Unauthorized - Admin only");
    }

    const { adminEmail, pharmacyName }: SendCodeRequest = await req.json();

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in database with 10 minute expiration
    const { error: insertError } = await supabase
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

    // Send email with code
    const emailResponse = await resend.emails.send({
      from: "OndeTem <onboarding@resend.dev>",
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
