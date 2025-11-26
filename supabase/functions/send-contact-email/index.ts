import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone: string;
  subject: 'informacao' | 'adesao';
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, subject, message }: ContactEmailRequest = await req.json();

    console.log('Received contact form submission:', { name, email, subject });

    // Determine recipient based on subject
    const recipientEmail = subject === 'informacao' 
      ? 'comercial@onixagence.com' 
      : 'adesao-ondtem@onixagence.com';

    const subjectText = subject === 'informacao' ? 'Informação' : 'Adesão';

    // Send email to the appropriate recipient
    const emailResponse = await resend.emails.send({
      from: Deno.env.get("FROM_EMAIL") || "noreply@ondtem.com",
      to: [recipientEmail],
      subject: `Contacto ONDTem - ${subjectText}: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Nova Mensagem de Contacto
          </h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Assunto:</strong> ${subjectText}</p>
            <p style="margin: 10px 0;"><strong>Nome:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Telefone:</strong> ${phone}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #374151;">Mensagem:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6; color: #4b5563;">${message}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            Esta mensagem foi enviada através do formulário de contacto em ondtem.com
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully to:", recipientEmail, emailResponse);

    // Send confirmation email to the user
    await resend.emails.send({
      from: Deno.env.get("FROM_EMAIL") || "noreply@ondtem.com",
      to: [email],
      subject: "Recebemos a sua mensagem - ONDTem",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Obrigado pelo seu contacto!
          </h2>
          
          <p style="line-height: 1.6; color: #4b5563;">Olá ${name},</p>
          
          <p style="line-height: 1.6; color: #4b5563;">
            Recebemos a sua mensagem sobre <strong>${subjectText}</strong> e agradecemos o seu interesse na ONDTem.
          </p>
          
          <p style="line-height: 1.6; color: #4b5563;">
            A nossa equipa irá analisar a sua solicitação e entraremos em contacto consigo em breve através do email ou telefone fornecido.
          </p>
          
          <p style="line-height: 1.6; color: #4b5563;">
            Atenciosamente,<br/>
            <strong>Equipa ONDTem by Onix Agence</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            © 2025 ONDTem. Todos os direitos reservados.<br/>
            <a href="https://ondtem.com" style="color: #2563eb; text-decoration: none;">ondtem.com</a>
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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
