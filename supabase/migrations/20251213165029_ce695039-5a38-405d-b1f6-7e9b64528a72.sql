-- Tabela para rastrear impressões de farmácias (quando aparecem para clientes)
CREATE TABLE public.impressoes_farmacia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmacia_id UUID NOT NULL REFERENCES public.farmacias(id) ON DELETE CASCADE,
  consulta_id UUID REFERENCES public.consultas(id) ON DELETE SET NULL,
  medicamento_buscado TEXT NOT NULL,
  cliente_latitude NUMERIC,
  cliente_longitude NUMERIC,
  distancia_km NUMERIC,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_impressoes_farmacia_farmacia_id ON public.impressoes_farmacia(farmacia_id);
CREATE INDEX idx_impressoes_farmacia_criado_em ON public.impressoes_farmacia(criado_em);
CREATE INDEX idx_impressoes_farmacia_consulta_id ON public.impressoes_farmacia(consulta_id);

-- Índices na tabela consultas para queries de estatísticas
CREATE INDEX IF NOT EXISTS idx_consultas_criado_em ON public.consultas(criado_em);
CREATE INDEX IF NOT EXISTS idx_consultas_medicamento ON public.consultas(medicamento_buscado);
CREATE INDEX IF NOT EXISTS idx_consultas_status ON public.consultas(status);

-- Enable RLS
ALTER TABLE public.impressoes_farmacia ENABLE ROW LEVEL SECURITY;

-- Políticas para impressões
CREATE POLICY "Farmácias podem ver suas próprias impressões" 
ON public.impressoes_farmacia 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM farmacias 
  WHERE farmacias.id = impressoes_farmacia.farmacia_id 
  AND farmacias.user_id = auth.uid()
));

CREATE POLICY "Admins podem ver todas impressões" 
ON public.impressoes_farmacia 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Sistema pode inserir impressões" 
ON public.impressoes_farmacia 
FOR INSERT 
WITH CHECK (true);

-- Permitir INSERT público na tabela consultas (para buscas anônimas)
CREATE POLICY "Permitir inserção pública de consultas" 
ON public.consultas 
FOR INSERT 
WITH CHECK (true);