-- Adicionar políticas RLS para permitir operações em medicamentos e estoque

-- Políticas para a tabela medicamentos
CREATE POLICY "Permitir inserção pública de medicamentos"
ON public.medicamentos
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de medicamentos"
ON public.medicamentos
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir exclusão pública de medicamentos"
ON public.medicamentos
FOR DELETE
TO public
USING (true);

-- Políticas para a tabela estoque
CREATE POLICY "Permitir inserção pública de estoque"
ON public.estoque
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de estoque"
ON public.estoque
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir exclusão pública de estoque"
ON public.estoque
FOR DELETE
TO public
USING (true);