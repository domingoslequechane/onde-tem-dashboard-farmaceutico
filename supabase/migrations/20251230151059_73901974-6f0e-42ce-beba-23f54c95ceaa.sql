-- Remover política que ainda permite leitura pública irrestrita de avaliações
DROP POLICY IF EXISTS "Permitir leitura pública de avaliações" ON public.avaliacoes;