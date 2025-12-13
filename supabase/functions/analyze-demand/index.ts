import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { demandData, totalStats, neighborhoods } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um consultor especializado em farmácias e análise de demanda de medicamentos. 
Analise os dados de demanda fornecidos e forneça sugestões práticas e acionáveis para melhorar a taxa de sucesso da farmácia.

Suas sugestões devem ser:
- Específicas e práticas
- Baseadas nos dados fornecidos
- Focadas em melhorar a disponibilidade dos medicamentos mais procurados
- Considerando a região e bairros mencionados

Formate sua resposta em português de forma clara e organizada, usando:
- Um resumo executivo da situação atual
- 3-5 recomendações prioritárias numeradas
- Ações imediatas que a farmácia pode tomar

Seja direto e objetivo nas recomendações.`;

    const userPrompt = `Analise os seguintes dados de demanda da farmácia:

**Estatísticas Gerais:**
- Total de buscas: ${totalStats.totalSearches}
- Medicamentos encontrados: ${totalStats.found}
- Medicamentos não encontrados: ${totalStats.notFound}
- Taxa de sucesso geral: ${Math.round((totalStats.found / (totalStats.found + totalStats.notFound)) * 100)}%

**Top Medicamentos Mais Procurados:**
${demandData.map((m: any, i: number) => `${i + 1}. ${m.name} (${m.category}) - Sucesso: ${m.found}%, Insucesso: ${m.notFound}%, Tendência: ${m.trend >= 0 ? '+' : ''}${m.trend}%`).join('\n')}

**Bairros com Maior Demanda:**
${neighborhoods.map((n: any) => `- ${n.name}: ${n.searches} buscas (Nível: ${n.level})`).join('\n')}

Com base nesses dados, forneça uma análise e recomendações para melhorar a taxa de sucesso da farmácia.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar análise com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-demand error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
