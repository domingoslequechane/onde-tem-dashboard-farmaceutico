-- Criar view pública para avaliações sem expor email do cliente
CREATE OR REPLACE VIEW public.avaliacoes_publicas AS
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

-- Atualizar política de leitura de avaliações - farmácias e admins veem tudo, público usa a view
DROP POLICY IF EXISTS "Leitura pública de avaliações" ON public.avaliacoes;
DROP POLICY IF EXISTS "Qualquer pessoa pode ler avaliações" ON public.avaliacoes;

-- Nova política: apenas owners da farmácia e admins podem ver avaliações com email
CREATE POLICY "Leitura restrita de avaliações com email" ON public.avaliacoes
FOR SELECT USING (
  -- Admins veem tudo
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role) OR
  -- Farmácia dona vê suas avaliações
  EXISTS (
    SELECT 1 FROM public.farmacias 
    WHERE farmacias.id = avaliacoes.farmacia_id 
    AND farmacias.user_id = auth.uid()
  )
);