import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Health check endpoint called');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Supabase configuration missing',
          checks: {
            env_vars: false,
            database: false,
            auth: false,
          },
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const checks = {
      env_vars: true,
      database: false,
      auth: false,
    };

    // Test database connectivity
    try {
      const { error: dbError } = await supabase
        .from('user_roles')
        .select('count', { count: 'exact', head: true });
      
      if (!dbError) {
        checks.database = true;
        console.log('Database connection successful');
      } else {
        console.error('Database connection error:', dbError);
      }
    } catch (error) {
      console.error('Database check failed:', error);
    }

    // Test auth connectivity
    try {
      const { error: authError } = await supabase.auth.getSession();
      
      if (!authError) {
        checks.auth = true;
        console.log('Auth service connection successful');
      } else {
        console.error('Auth connection error:', authError);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }

    const allHealthy = checks.env_vars && checks.database && checks.auth;

    return new Response(
      JSON.stringify({
        status: allHealthy ? 'healthy' : 'degraded',
        message: allHealthy 
          ? 'All systems operational' 
          : 'Some systems experiencing issues',
        checks,
        timestamp: new Date().toISOString(),
        project_id: supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1] || 'unknown',
      }),
      {
        status: allHealthy ? 200 : 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message,
        checks: {
          env_vars: false,
          database: false,
          auth: false,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
