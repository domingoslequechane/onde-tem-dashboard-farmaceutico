-- Create table for pharmacy reviews/ratings
CREATE TABLE public.avaliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmacia_id UUID NOT NULL REFERENCES public.farmacias(id) ON DELETE CASCADE,
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT,
  avaliacao INTEGER NOT NULL CHECK (avaliacao >= 1 AND avaliacao <= 5),
  comentario TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view reviews
CREATE POLICY "Permitir leitura pública de avaliações"
ON public.avaliacoes
FOR SELECT
USING (true);

-- Policy: Anyone can create reviews (authenticated or not)
CREATE POLICY "Permitir criação pública de avaliações"
ON public.avaliacoes
FOR INSERT
WITH CHECK (true);

-- Policy: Admins and super-admins can delete reviews
CREATE POLICY "Admins podem deletar avaliações"
ON public.avaliacoes
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Create index for faster queries by pharmacy
CREATE INDEX idx_avaliacoes_farmacia_id ON public.avaliacoes(farmacia_id);

-- Create index for sorting by date
CREATE INDEX idx_avaliacoes_criado_em ON public.avaliacoes(criado_em DESC);