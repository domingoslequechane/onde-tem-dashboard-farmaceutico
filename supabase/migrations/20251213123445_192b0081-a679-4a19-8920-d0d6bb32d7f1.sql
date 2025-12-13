-- Create table for support chat history
CREATE TABLE public.suporte_mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmacia_id UUID NOT NULL REFERENCES public.farmacias(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  file_name TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_suporte_mensagens_farmacia ON public.suporte_mensagens(farmacia_id);
CREATE INDEX idx_suporte_mensagens_criado ON public.suporte_mensagens(criado_em DESC);

-- Enable RLS
ALTER TABLE public.suporte_mensagens ENABLE ROW LEVEL SECURITY;

-- Pharmacies can view their own messages
CREATE POLICY "Farmácias podem ver suas próprias mensagens"
ON public.suporte_mensagens
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM farmacias
  WHERE farmacias.id = suporte_mensagens.farmacia_id
  AND farmacias.user_id = auth.uid()
));

-- Pharmacies can create their own messages
CREATE POLICY "Farmácias podem criar suas próprias mensagens"
ON public.suporte_mensagens
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM farmacias
  WHERE farmacias.id = suporte_mensagens.farmacia_id
  AND farmacias.user_id = auth.uid()
));

-- Pharmacies can delete their own messages (clear history)
CREATE POLICY "Farmácias podem deletar suas próprias mensagens"
ON public.suporte_mensagens
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM farmacias
  WHERE farmacias.id = suporte_mensagens.farmacia_id
  AND farmacias.user_id = auth.uid()
));