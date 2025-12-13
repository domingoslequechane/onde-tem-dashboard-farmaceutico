import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RecoveryRequest {
  email: string;
  redirectTo: string;
  userType: 'farmacia' | 'admin';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo, userType }: RecoveryRequest = await req.json();

    console.log(`Processing password recovery for: ${email}, type: ${userType}`);

    if (!email || !redirectTo || !userType) {
      throw new Error("Email, redirectTo e userType são obrigatórios");
    }

    // Create admin client to generate password reset link
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      throw new Error("Erro ao verificar usuário");
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      console.log("User not found, returning success for security");
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate password reset link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo,
      },
    });

    if (linkError) {
      console.error("Error generating recovery link:", linkError);
      throw new Error("Erro ao gerar link de recuperação");
    }

    const recoveryLink = linkData.properties.action_link;
    const fromEmail = Deno.env.get("FROM_EMAIL") || "ONDTem <noreply@ondtem.com>";
    
    const isAdmin = userType === 'admin';
    const userTypeLabel = isAdmin ? 'Administrador' : 'Farmácia';
    const accentColor = isAdmin ? '#ef4444' : '#22c55e';

    console.log(`Sending recovery email to: ${email}`);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `ONDTem - Recuperação de Senha (${userTypeLabel})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperação de Senha - ONDTem</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 3px solid ${accentColor};">
                      <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: ${accentColor};">
                        ONDTem
                      </h1>
                      <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                        Plataforma de Vendas e Inteligência para Farmácias
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #1f2937;">
                        Recuperação de Senha
                      </h2>
                      
                      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                        Olá,
                      </p>
                      
                      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                        Recebemos um pedido para redefinir a senha da sua conta de <strong style="color: ${accentColor};">${userTypeLabel}</strong> na plataforma ONDTem.
                      </p>
                      
                      <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                        Clique no botão abaixo para criar uma nova senha:
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center">
                            <a href="${recoveryLink}" 
                               style="display: inline-block; padding: 16px 32px; background-color: ${accentColor}; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; transition: background-color 0.2s;">
                              Redefinir Senha
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                        Se você não solicitou esta recuperação de senha, pode ignorar este email com segurança. Sua senha permanecerá inalterada.
                      </p>
                      
                      <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                        Este link expira em 1 hora por motivos de segurança.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                        © 2025 ONDTem - Saúde que se encontra
                      </p>
                      <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                        Este é um email automático. Por favor, não responda.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-recovery function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
