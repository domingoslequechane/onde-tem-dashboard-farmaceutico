-- Create feedbacks table for storing user feedback
CREATE TABLE public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'sugestao',
  mensagem text NOT NULL,
  medicamento_buscado text,
  farmacia_nome text,
  encontrou_medicamento boolean,
  avaliacao integer CHECK (avaliacao >= 1 AND avaliacao <= 5),
  fonte text DEFAULT 'web',
  user_agent text,
  criado_em timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Allow public insert (anyone can submit feedback)
CREATE POLICY "Permitir inserção pública de feedbacks"
  ON public.feedbacks FOR INSERT
  WITH CHECK (true);

-- Only admins can view feedbacks
CREATE POLICY "Admins podem ver feedbacks"
  ON public.feedbacks FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Only admins can delete feedbacks
CREATE POLICY "Admins podem deletar feedbacks"
  ON public.feedbacks FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));