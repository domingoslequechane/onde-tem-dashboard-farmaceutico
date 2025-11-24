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
  displayName: string;
  role: string;
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

    // Verificar se o usuário é super-admin
    const { data: isSuperAdmin } = await supabaseClient.rpc('is_super_admin', {
      _user_id: user.id
    });

    if (!isSuperAdmin) {
      throw new Error("Apenas super-admins podem convidar administradores");
    }

    const { email, displayName, role }: InviteRequest = await req.json();

    console.log("Processando convite para:", email);

    // Verificar se o usuário já existe
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      console.log("Usuário já existe, reenviando convite");
      userId = existingUser.id;

      // Atualizar o role se necessário
      const { data: currentRole } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (currentRole?.role !== role) {
        const { error: updateError } = await supabaseClient.rpc('update_admin_info', {
          target_user_id: userId,
          new_display_name: displayName,
          new_role: role
        });

        if (updateError) {
          console.error("Erro ao atualizar role:", updateError);
        }
      }

      // Atualizar display_name se fornecido
      const { error: nameError } = await supabaseClient.rpc('set_admin_display_name', {
        target_user_id: userId,
        new_display_name: displayName
      });

      if (nameError) {
        console.error("Erro ao atualizar display_name:", nameError);
      }
    } else {
      console.log("Criando nova conta para:", email);

      // Criar novo usuário
      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: signUpError } = await supabaseClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          role: role,
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

      // Atualizar o role criado pelo trigger para o role correto
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .update({ role: role, display_name: displayName })
        .eq('user_id', userId);

      if (roleError) {
        console.error("Erro ao atualizar role:", roleError);
      } else {
        console.log(`Role atualizado para ${role}`);
      }
    }

    // Gerar link de reset de senha
    const { data: resetData, error: resetError } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (resetError) {
      console.error("Erro ao gerar link:", resetError);
      throw resetError;
    }

    // Construir URL corretamente
    const appUrl = Deno.env.get('APP_URL') || 'https://91e2f1f8-ea96-415f-9224-8bd034d01d6f.lovableproject.com';
    const tokenHash = resetData.properties.hashed_token;
    const inviteLink = `${appUrl}/admin/set-password?token=${tokenHash}&type=recovery`;

    console.log("Link gerado para:", email);

    // Enviar email de convite
    const fromEmail = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";
    const { error: emailError } = await resend.emails.send({
      from: `OndeTem <${fromEmail}>`,
      to: [email],
      subject: "Convite para Administrador - OndeTem",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Bem-vindo ao OndeTem!</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Olá <strong>${displayName}</strong>,
          </p>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Você foi convidado para ser <strong>${role === 'super_admin' ? 'Super-Administrador' : 'Administrador'}</strong> 
            da plataforma OndeTem.
          </p>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Para ativar sua conta, clique no botão abaixo e defina sua senha:
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
        message: existingUser ? "Convite reenviado com sucesso" : "Convite enviado com sucesso",
        userId: userId,
        isResend: !!existingUser
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
