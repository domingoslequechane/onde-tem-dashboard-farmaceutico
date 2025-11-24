import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeletePharmacyRequest {
  pharmacyId: string;
  verificationCode: string;
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

    // Create admin client for operations that bypass RLS
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

    if (!roleData || roleData.role !== "admin") {
      console.error("User is not admin. Role:", roleData?.role);
      throw new Error("Unauthorized - Admin only");
    }

    console.log("User verified as admin");

    const { pharmacyId, verificationCode }: DeletePharmacyRequest = await req.json();

    // Verify code (use admin client to bypass RLS)
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from("deletion_codes")
      .select("*")
      .eq("admin_id", user.id)
      .eq("code", verificationCode)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeError || !codeData) {
      console.error("Code verification failed:", codeError);
      throw new Error("Código inválido ou expirado");
    }

    console.log("Verification code confirmed");

    // Get pharmacy data to find user_id
    const { data: pharmacyData, error: pharmacyError } = await supabase
      .from("farmacias")
      .select("user_id, nome")
      .eq("id", pharmacyId)
      .single();

    if (pharmacyError || !pharmacyData) {
      console.error("Pharmacy not found:", pharmacyError);
      throw new Error("Farmácia não encontrada");
    }

    console.log(`Starting deletion process for pharmacy: ${pharmacyData.nome}`);

    // Delete in order (respecting foreign key constraints)
    
    // 1. Delete stock items
    const { error: stockError } = await supabase
      .from("estoque")
      .delete()
      .eq("farmacia_id", pharmacyId);

    if (stockError) {
      console.error("Error deleting stock:", stockError);
      throw new Error("Erro ao eliminar estoque");
    }

    console.log("Stock deleted successfully");

    // 2. Delete pharmacy record
    const { error: pharmacyDeleteError } = await supabase
      .from("farmacias")
      .delete()
      .eq("id", pharmacyId);

    if (pharmacyDeleteError) {
      console.error("Error deleting pharmacy:", pharmacyDeleteError);
      throw new Error("Erro ao eliminar farmácia");
    }

    console.log("Pharmacy deleted successfully");

    // 3. Delete user role
    if (pharmacyData.user_id) {
      const { error: roleDeleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", pharmacyData.user_id);

      if (roleDeleteError) {
        console.error("Error deleting user role:", roleDeleteError);
      }

      console.log("User role deleted successfully");

      // 4. Delete auth user (using service role key)
      const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
        pharmacyData.user_id
      );

      if (userDeleteError) {
        console.error("Error deleting auth user:", userDeleteError);
        throw new Error("Erro ao eliminar usuário");
      }

      console.log("Auth user deleted successfully");
    }

    // 5. Delete used verification code (use admin client to bypass RLS)
    await supabaseAdmin
      .from("deletion_codes")
      .delete()
      .eq("id", codeData.id);

    console.log(`Pharmacy ${pharmacyData.nome} completely deleted`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Farmácia eliminada com sucesso" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in delete-pharmacy function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes("Unauthorized") || error.message.includes("Código inválido") ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
