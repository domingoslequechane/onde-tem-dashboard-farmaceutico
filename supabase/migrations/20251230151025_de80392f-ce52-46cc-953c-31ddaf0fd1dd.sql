-- Corrigir a view para usar SECURITY INVOKER (padrão mais seguro)
DROP VIEW IF EXISTS public.avaliacoes_publicas;

CREATE VIEW public.avaliacoes_publicas 
WITH (security_invoker = true)
AS
SELECT 
  id, 
  farmacia_id, 
  cliente_nome, 
  avaliacao, 
  comentario, 
  criado_em
FROM public.avaliacoes;

-- Conceder acesso à view para usuários anônimos e autenticados
GRANT SELECT ON public.avaliacoes_publicas TO anon, authenticated;