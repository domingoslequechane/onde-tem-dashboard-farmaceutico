-- Create table for AI analysis history
CREATE TABLE public.analises_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmacia_id UUID NOT NULL REFERENCES public.farmacias(id) ON DELETE CASCADE,
  analise TEXT NOT NULL,
  dados_contexto JSONB,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analises_ia ENABLE ROW LEVEL SECURITY;

-- Pharmacies can view their own analyses
CREATE POLICY "Farmácias podem ver suas próprias análises"
ON public.analises_ia
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM farmacias
    WHERE farmacias.id = analises_ia.farmacia_id
    AND farmacias.user_id = auth.uid()
  )
);

-- Pharmacies can insert their own analyses
CREATE POLICY "Farmácias podem criar suas próprias análises"
ON public.analises_ia
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM farmacias
    WHERE farmacias.id = analises_ia.farmacia_id
    AND farmacias.user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_analises_ia_farmacia_id ON public.analises_ia(farmacia_id);
CREATE INDEX idx_analises_ia_criado_em ON public.analises_ia(criado_em DESC);