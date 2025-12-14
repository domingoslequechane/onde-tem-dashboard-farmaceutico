import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { search_id, reason } = body;

    if (!search_id) {
      console.log('Missing search_id in request');
      return new Response("Missing search_id", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    console.log(`Logging abandonment: search_id=${search_id}, reason=${reason || 'exit'}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase
      .from("search_outcomes")
      .upsert({
        search_id,
        outcome_status: "abandoned",
        pharmacies_found_count: 0,
        closest_pharmacy_distance: null
      }, { onConflict: "search_id" });

    if (error) {
      console.error('Error logging abandonment:', error);
      return new Response("Error", { status: 500, headers: corsHeaders });
    }

    console.log(`Successfully logged abandonment for search: ${search_id}`);
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
