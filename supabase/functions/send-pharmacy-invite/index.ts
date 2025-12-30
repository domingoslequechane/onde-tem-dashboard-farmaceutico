import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  pharmacyName: string;
  pharmacyId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Não autorizado");
    }

    // Verificar se o usuário é admin ou super-admin
    const { data: roleData } = await supabaseClient.rpc('get_user_role', {
      _user_id: user.id
    });

    if (!roleData || (roleData !== 'admin' && roleData !== 'super_admin')) {
      throw new Error("Apenas administradores podem convidar farmácias");
    }

    const { email, pharmacyName, pharmacyId }: InviteRequest = await req.json();

    console.log("Processando convite para farmácia:", email);

    // Buscar a farmácia no banco
    const { data: pharmacy, error: pharmacyError } = await supabaseClient
      .from('farmacias')
      .select('user_id')
      .eq('id', pharmacyId)
      .single();

    if (pharmacyError || !pharmacy) {
      throw new Error("Farmácia não encontrada");
    }

    let userId: string;

    if (pharmacy.user_id) {
      console.log("Usuário já existe, reenviando convite");
      userId = pharmacy.user_id;
    } else {
      console.log("Criando nova conta para farmácia:", email);

      // Criar novo usuário
      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: signUpError } = await supabaseClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          pharmacy_id: pharmacyId,
          pharmacy_name: pharmacyName,
          invited: true
        }
      });

      if (signUpError) {
        console.error("Erro ao criar usuário:", signUpError);
        throw signUpError;
      }

      userId = newUser.user!.id;
      console.log("Usuário criado:", userId);

      // Aguardar trigger criar registro em user_roles
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Atualizar farmácia com user_id
      const { error: updateError } = await supabaseClient
        .from('farmacias')
        .update({ user_id: userId })
        .eq('id', pharmacyId);

      if (updateError) {
        console.error("Erro ao vincular usuário à farmácia:", updateError);
      }
    }

    // Gerar link de convite personalizado
    const appUrl = Deno.env.get('APP_URL') || 'https://ondtem.com';
    const redirectTo = `${appUrl}/farmacia/set-password`;
    
    const { data: resetData, error: resetError } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo
      }
    });

    if (resetError) {
      console.error("Erro ao gerar link:", resetError);
      throw resetError;
    }

    const inviteLink = resetData.properties.action_link;

    console.log("Link gerado para:", email);

    // Enviar email de convite
    const fromEmail = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";
    const { error: emailError } = await resend.emails.send({
      from: `ONDTem <${fromEmail}>`,
      to: [email],
      subject: "Convite para Farmácia - OndeTem",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Bem-vindo ao OndeTem!</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Olá <strong>${pharmacyName}</strong>,
          </p>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Sua farmácia foi cadastrada na plataforma OndeTem.
          </p>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Para ativar sua conta e começar a gerenciar seu estoque, clique no botão abaixo e defina sua senha:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background-color: #2563eb; color: white; padding: 14px 28px; 
                      text-decoration: none; border-radius: 6px; display: inline-block; 
                      font-weight: bold; font-size: 16px;">
              Definir Minha Senha
            </a>
          </div>
          <p style="font-size: 14px; line-height: 1.5; color: #666;">
            Ou copie e cole este link no seu navegador:<br>
            <a href="${inviteLink}" style="color: #2563eb; word-break: break-all;">
              ${inviteLink}
            </a>
          </p>
          <p style="font-size: 14px; line-height: 1.5; color: #666; margin-top: 30px;">
            Este link é válido por 1 hora.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            Se você não esperava este email, pode ignorá-lo com segurança.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Erro ao enviar email:", emailError);
      throw emailError;
    }

    console.log("Email enviado com sucesso");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: pharmacy.user_id ? "Convite reenviado com sucesso" : "Convite enviado com sucesso",
        userId: userId,
        isResend: !!pharmacy.user_id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Erro na função:", error);
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
