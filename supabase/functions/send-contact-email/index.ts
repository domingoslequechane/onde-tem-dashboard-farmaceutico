import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent injection
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

// Input validation
function validateInput(data: unknown): { valid: true; data: ValidatedInput } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { name, email, phone, subject, message } = data as Record<string, unknown>;

  // Validate name
  if (typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: 'Nome é obrigatório' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Nome deve ter no máximo 100 caracteres' };
  }

  // Validate email
  if (typeof email !== 'string' || email.trim().length === 0) {
    return { valid: false, error: 'Email é obrigatório' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 255) {
    return { valid: false, error: 'Email inválido' };
  }

  // Validate phone
  if (typeof phone !== 'string') {
    return { valid: false, error: 'Telefone inválido' };
  }
  if (phone.length > 30) {
    return { valid: false, error: 'Telefone deve ter no máximo 30 caracteres' };
  }

  // Validate subject
  if (subject !== 'informacao' && subject !== 'adesao') {
    return { valid: false, error: 'Assunto inválido' };
  }

  // Validate message
  if (typeof message !== 'string' || message.trim().length === 0) {
    return { valid: false, error: 'Mensagem é obrigatória' };
  }
  if (message.length > 5000) {
    return { valid: false, error: 'Mensagem deve ter no máximo 5000 caracteres' };
  }

  return {
    valid: true,
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      subject: subject as 'informacao' | 'adesao',
      message: message.trim(),
    },
  };
}

interface ValidatedInput {
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
    const rawData = await req.json();
    
    // Validate input
    const validation = validateInput(rawData);
    if (!validation.valid) {
      console.log('Validation failed:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { name, email, phone, subject, message } = validation.data;

    // Escape HTML to prevent injection in email templates
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeMessage = escapeHtml(message);

    console.log('Received contact form submission:', { name: safeName, email: safeEmail, subject });

    // Determine recipient based on subject
    const recipientEmail = subject === 'informacao' 
      ? 'comercial@ondtem.com' 
      : 'adesao@ondtem.com';

    const subjectText = subject === 'informacao' ? 'Informação' : 'Adesão';

    // Send email to the appropriate recipient
    const emailResponse = await resend.emails.send({
      from: Deno.env.get("FROM_EMAIL") || "noreply@ondtem.com",
      to: [recipientEmail],
      subject: `Contacto ONDTem - ${subjectText}: ${safeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Nova Mensagem de Contacto
          </h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Assunto:</strong> ${subjectText}</p>
            <p style="margin: 10px 0;"><strong>Nome:</strong> ${safeName}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${safeEmail}</p>
            <p style="margin: 10px 0;"><strong>Telefone:</strong> ${safePhone}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #374151;">Mensagem:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6; color: #4b5563;">${safeMessage}</p>
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
      to: [email], // Use original email for delivery, not escaped version
      subject: "Recebemos a sua mensagem - ONDTem",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Obrigado pelo seu contacto!
          </h2>
          
          <p style="line-height: 1.6; color: #4b5563;">Olá ${safeName},</p>
          
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
            by <a href="https://onixagence.com" style="color: #2563eb; text-decoration: none;">Onix Agence</a>
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
      JSON.stringify({ error: "Ocorreu um erro ao enviar a mensagem. Tente novamente." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);