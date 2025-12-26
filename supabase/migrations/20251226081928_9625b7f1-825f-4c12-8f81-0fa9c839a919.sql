-- Tabela de prospectos (farmácias em potencial)
CREATE TABLE public.prospectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  cidade TEXT,
  bairro TEXT,
  estado TEXT,
  
  -- Status Kanban
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'contacto', 'negociacao', 'proposta', 'fechado', 'perdido')),
  
  -- Detalhes da prospecção
  fonte TEXT,
  responsavel TEXT,
  notas TEXT,
  valor_estimado NUMERIC,
  data_proximo_followup TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  criado_por UUID REFERENCES auth.users(id)
);

-- Tabela de interações/histórico de actividades
CREATE TABLE public.prospecto_interacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospecto_id UUID NOT NULL REFERENCES public.prospectos(id) ON DELETE CASCADE,
  
  -- Detalhes da interação
  tipo TEXT NOT NULL CHECK (tipo IN ('chamada', 'whatsapp', 'email', 'visita', 'reuniao', 'nota')),
  descricao TEXT NOT NULL,
  resultado TEXT CHECK (resultado IN ('positivo', 'neutro', 'negativo') OR resultado IS NULL),
  
  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  criado_por UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospecto_interacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para prospectos - apenas admins e super_admins
CREATE POLICY "Admins podem ver todos os prospectos"
ON public.prospectos FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins podem criar prospectos"
ON public.prospectos FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins podem actualizar prospectos"
ON public.prospectos FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins podem eliminar prospectos"
ON public.prospectos FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Políticas para interações
CREATE POLICY "Admins podem ver todas as interações"
ON public.prospecto_interacoes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins podem criar interações"
ON public.prospecto_interacoes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins podem actualizar interações"
ON public.prospecto_interacoes FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins podem eliminar interações"
ON public.prospecto_interacoes FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Índices para performance
CREATE INDEX idx_prospectos_status ON public.prospectos(status);
CREATE INDEX idx_prospectos_cidade ON public.prospectos(cidade);
CREATE INDEX idx_prospectos_followup ON public.prospectos(data_proximo_followup);
CREATE INDEX idx_prospecto_interacoes_prospecto ON public.prospecto_interacoes(prospecto_id);
CREATE INDEX idx_prospecto_interacoes_criado ON public.prospecto_interacoes(criado_em DESC);