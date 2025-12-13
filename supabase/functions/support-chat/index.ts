import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
   Quando receber dados de medicamentos, gere APENAS o CSV e o botão de download.
   
   NÃO mostre:
   - Código
   - Instruções de copiar/colar
   - Passos manuais
   
   Use EXATAMENTE este formato:

   ---CSV_START---
   Nome,Preço,Categoria,Disponível
   Paracetamol 500mg,15.00,Analgésico,Sim
   ---CSV_END---

   **Regras do CSV**:
   - Cabeçalho: Nome,Preço,Categoria,Disponível
   - Preço: número com ponto (15.00) - NUNCA texto
   - Disponível: Sim ou Não
   - Valores padrão: Preço=0.00, Categoria=Geral, Disponível=Sim

   **Após o CSV, diga APENAS**:
   "Clique em **Baixar CSV** e importe em **Estoque > Importação CSV**."

4. **Problemas técnicos**: Resolva brevemente ou direcione para suporte@ondtem.com.

5. **Foco**: Apenas assuntos da plataforma ONDTem.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Por favor, aguarde alguns segundos e tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível. Tente novamente mais tarde." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar sua mensagem. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
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
