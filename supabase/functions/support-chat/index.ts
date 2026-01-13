import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.20.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONDTEM_DOCUMENTATION = `
# Documentação Completa da Plataforma ONDTem

## Sobre a ONDTem
ONDTem é uma plataforma digital que conecta clientes a farmácias próximas em Moçambique. A plataforma permite que clientes busquem medicamentos e encontrem farmácias que os tenham em estoque, visualizando no mapa as opções mais próximas.

## Funcionalidades para Farmácias

### Dashboard (Início)
- Análise de Demanda: Visualização dos medicamentos mais buscados na região
- Mapa de Demanda: Heatmap mostrando onde estão concentradas as buscas por medicamentos
- Análise com IA: Sugestões inteligentes baseadas nos dados de demanda para melhorar vendas

### Gestão de Estoque
- Adicionar Medicamentos: Cadastrar medicamentos individualmente ou por importação CSV
- Importação CSV: Upload de arquivo com medicamentos (nome, categoria, preço, disponibilidade)
- Template CSV: Formato: nome,categoria,preco,disponivel (disponivel: sim/não)
- Estratégias de Importação:
  - Limpar estoque existente e importar novo
  - Manter registros existentes e adicionar apenas novos
- Filtros: Busca por nome e filtro por categoria
- Paginação: Carregamento de 100 itens por vez para performance

### Análise de Demanda
- Estatísticas: Total de buscas, taxa de sucesso, medicamentos não encontrados
- Gráfico de Barras: Top medicamentos mais buscados com taxa encontrado/não encontrado
- Tendências: Indicadores de crescimento ou queda na demanda
- Análise IA: Clique em "Analisar com IA" para obter sugestões personalizadas
- Histórico de Análises: Navegue entre análises anteriores com as setas

### Configurações da Farmácia
Campos obrigatórios:
- Nome da Farmácia
- Telefone e WhatsApp
- Horário de Funcionamento (abertura e fechamento)
- Bairro, Cidade e Província
- NUIT (máximo 9 caracteres)
- Ponto de Referência
- Latitude e Longitude (coordenadas GPS)
- Link do Google Maps (opcional, para validação de localização)

### Histórico de Login
- Visualize todos os acessos à sua conta
- Detalhes: dispositivo, IP, data/hora
- Monitore acessos suspeitos

## Funcionalidades para Clientes

### Busca de Medicamentos
1. Acesse a página de busca no site
2. Permita acesso à sua localização
3. Digite o nome do medicamento
4. Veja as farmácias próximas que têm o medicamento
5. Filtre por raio de distância (1km, 2km, 4km, 8km, 16km)

### Informações da Farmácia
- Nome e avaliação média
- Status de funcionamento (Aberto/Fechado)
- Distância e tempo de viagem (a pé e de carro)
- Preço do medicamento

### Navegação
- Clique em "Iniciar Viagem" para navegação guiada
- Instruções de curvas em tempo real
- Áudio de orientação em português
- Chegada confirmada quando próximo ao destino

### Avaliações
- Avalie farmácias após sua visita
- Veja avaliações de outros clientes

## Planos e Assinaturas

### Tipos de Plano
- Básico
- Profissional
- Enterprise

### Status de Assinatura
- Ativo: acesso completo
- Pendente: aguardando pagamento
- Expirado: necessário renovar

## Suporte

### Contatos
- Informações Gerais: comercial@ondtem.com
- Adesão: adesao@ondtem.com
- Telefone: +258 853 135 136 ou +258 868 499 221

### Problemas Comuns

#### "Não consigo fazer login"
1. Verifique se o email está correto
2. Use "Esqueci minha senha" para redefinir
3. Verifique sua caixa de spam para o email de recuperação

#### "Medicamentos não aparecem na busca"
1. Verifique se o estoque está atualizado
2. Confirme se os medicamentos estão marcados como "disponível"
3. Verifique se as coordenadas da farmácia estão corretas

#### "Mapa não mostra minha farmácia"
1. Confirme latitude e longitude nas configurações
2. Use o link do Google Maps para validar coordenadas
3. Coordenadas devem estar em formato decimal (ex: -25.9692, 32.5732)

#### "Importação CSV não funciona"
1. Verifique o formato: nome,categoria,preco,disponivel
2. Use ponto como separador decimal no preço
3. Disponibilidade deve ser "sim" ou "não"
4. Salve como UTF-8 para caracteres especiais

#### "Análise de IA não carrega"
1. Aguarde alguns segundos, a análise pode demorar
2. Verifique sua conexão à internet
3. Tente novamente mais tarde

## Dicas para Farmácias

### Aumentar Visibilidade
1. Mantenha estoque sempre atualizado
2. Cadastre preços competitivos
3. Responda rapidamente às buscas
4. Mantenha horários de funcionamento atualizados

### Otimizar Vendas
1. Analise a demanda na sua região
2. Estoque medicamentos mais buscados
3. Use a análise IA para insights
4. Monitore tendências de busca

### Boas Práticas
1. Atualize estoque diariamente
2. Verifique disponibilidade real dos produtos
3. Mantenha informações de contato atualizadas
4. Responda avaliações de clientes

## Privacidade e Segurança
- Dados de login são criptografados
- Histórico de acesso para segurança
- Informações de clientes são protegidas
- Localização usada apenas para busca de farmácias

## Termos de Uso
- Informações de estoque devem ser precisas
- Preços devem ser atualizados
- Horários de funcionamento devem ser reais
- Comportamento inadequado pode resultar em suspensão
`;

const SYSTEM_PROMPT = `Você é o assistente de suporte da ONDTem.

${ONDTEM_DOCUMENTATION}

## REGRAS OBRIGATÓRIAS:

1. **SEJA EXTREMAMENTE BREVE** - respostas curtas, sem explicações desnecessárias.

2. **Formatação**: Use **negrito** e listas com - (hífen).

3. **GERAÇÃO DE CSV**:
   Quando receber dados de medicamentos (ficheiro anexado ou lista):
   
   ⚠️ REGRAS CRÍTICAS:
   - NUNCA liste os medicamentos no texto
   - NUNCA mostre a lista antes do CSV
   - NUNCA explique o que vai fazer
   - Gere DIRETAMENTE o CSV sem pré-visualização
   - NÃO mostre código ou instruções de copiar
   
   Use EXATAMENTE este formato (sem texto antes):

   ---CSV_START---
   Nome,Preço,Categoria,Disponível
   Paracetamol 500mg,15.00,Analgésico,Sim
   Ibuprofeno 400mg,25.00,Anti-inflamatório,Sim
   ---CSV_END---

   **Regras do CSV**:
   - Cabeçalho: Nome,Preço,Categoria,Disponível
   - Preço: número com ponto (15.00) - NUNCA texto
   - Disponível: Sim ou Não
   - Valores padrão: Preço=0.00, Categoria=Geral, Disponível=Sim

   **Após o CSV, diga APENAS UMA LINHA**:
   "Clique em **Baixar CSV** e importe em **Estoque > Importação CSV**."

4. **Problemas técnicos**: Resolva brevemente ou direcione para suporte@ondtem.com.

5. **Foco**: Apenas assuntos da plataforma ONDTem.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, requestId, farmaciaId } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // If async mode with requestId, process and save to DB
    if (requestId && farmaciaId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Update request status to processing
      await supabase
        .from('suporte_requests')
        .update({ status: 'processing' })
        .eq('id', requestId);

      try {
        // Process without streaming (wait for full response)
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: false,
        });

        const assistantContent = completion.choices[0]?.message?.content || '';

        // Save assistant message to database
        await supabase
          .from('suporte_mensagens')
          .insert({
            farmacia_id: farmaciaId,
            role: 'assistant',
            content: assistantContent
          });

        // Mark request as completed
        await supabase
          .from('suporte_requests')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString() 
          })
          .eq('id', requestId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      } catch (error) {
        // Mark request as error
        await supabase
          .from('suporte_requests')
          .update({ 
            status: 'error', 
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString() 
          })
          .eq('id', requestId);

        throw error;
      }
    }

    // Legacy streaming mode (fallback)
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              const data = JSON.stringify({
                choices: [{ delta: { content } }]
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(readableStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Support chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});