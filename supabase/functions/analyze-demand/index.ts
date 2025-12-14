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

    const systemPrompt = `Você é o assistente de análise de demanda integrado à plataforma ONDTem.

CONTEXTO DO SISTEMA:
- O ONDTem é uma plataforma que conecta clientes a farmácias para busca de medicamentos
- A plataforma coleta AUTOMATICAMENTE os dados de demanda quando clientes pesquisam medicamentos
- As farmácias NÃO precisam coletar dados manualmente - o sistema já faz isso
- Você analisa dados que a plataforma já coletou das pesquisas dos clientes
- "Taxa de sucesso" = medicamentos encontrados na farmácia / "Insucesso" = não encontrados

TRATAMENTO DE DADOS:
- Se valores forem NaN, 0 ou ausentes, interprete como "ainda sem dados suficientes" e sugira aguardar mais pesquisas
- Sempre apresente números de forma clara (ex: "0 buscas" em vez de "NaN")

FORMATO DA RESPOSTA:
- Seja CONCISO, OBJETIVO e DIRETO
- Máximo 3-4 parágrafos curtos
- Foque em insights acionáveis sobre ESTOQUE e DISPONIBILIDADE
- Suas recomendações devem ser sobre: quais medicamentos adicionar ao estoque, quais priorizar, tendências de demanda na região
- NUNCA sugira criar equipes de coleta de dados, formulários de registro ou protocolos de coleta - o sistema já faz isso automaticamente
- Responda em português de Moçambique

VOCÊ É PARTE DA PLATAFORMA, não um consultor externo.`;

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
