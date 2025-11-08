-- Fix Security Issues: Restrict public access and add authentication requirements

-- ============================================================================
-- 1. Fix Customer Data Exposure (clientes table)
-- ============================================================================
-- Remove public access policies
DROP POLICY IF EXISTS "Permitir leitura anônima de clientes" ON clientes;
DROP POLICY IF EXISTS "Permitir inserção pública de clientes" ON clientes;
DROP POLICY IF EXISTS "Clientes podem ver seus dados" ON clientes;

-- Add authenticated-only policies
CREATE POLICY "Users can view their own data" ON clientes
FOR SELECT TO authenticated
USING (auth.uid()::text = id::text OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own data" ON clientes
FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON clientes
FOR UPDATE TO authenticated
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Admins can manage all clients" ON clientes
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 2. Fix Medical Query History Exposure (consultas table)
-- ============================================================================
-- Remove public access policies
DROP POLICY IF EXISTS "Permitir leitura pública de consultas" ON consultas;
DROP POLICY IF EXISTS "Permitir registro público de consultas" ON consultas;

-- Allow users to view their own consultations
CREATE POLICY "Users can view own consultations" ON consultas
FOR SELECT TO authenticated
USING (auth.uid()::text = cliente_id::text OR has_role(auth.uid(), 'admin'::app_role));

-- Allow pharmacies to view consultations (for business purposes)
CREATE POLICY "Pharmacies can view consultations" ON consultas
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'farmacia'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Consultations should only be created via the SECURITY DEFINER function
-- which handles validation properly, but allow authenticated users as backup
CREATE POLICY "Authenticated users can create consultations" ON consultas
FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================================================
-- 3. Fix Inventory Data Public Access (estoque table)
-- ============================================================================
-- Remove all public write policies
DROP POLICY IF EXISTS "AllTest" ON estoque;
DROP POLICY IF EXISTS "Permitir atualização pública de estoque" ON estoque;
DROP POLICY IF EXISTS "Permitir exclusão pública de estoque" ON estoque;
DROP POLICY IF EXISTS "Permitir inserção pública de estoque" ON estoque;

-- Keep public read access for available inventory
-- (this is intentional for customer browsing)

-- Add policy for pharmacy owners to manage their own inventory
CREATE POLICY "Pharmacies manage own inventory" ON estoque
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM farmacias 
    WHERE farmacias.id = estoque.farmacia_id 
    AND farmacias.user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM farmacias 
    WHERE farmacias.id = estoque.farmacia_id 
    AND farmacias.user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================================================
-- 4. Fix Medicine Database Public Write Access (medicamentos table)
-- ============================================================================
-- Remove public write policies
DROP POLICY IF EXISTS "Permitir inserção pública de medicamentos" ON medicamentos;
DROP POLICY IF EXISTS "Permitir atualização pública de medicamentos" ON medicamentos;
DROP POLICY IF EXISTS "Permitir exclusão pública de medicamentos" ON medicamentos;

-- Keep public read access (intentional for browsing)

-- Add authenticated-only write policies for pharmacies and admins
CREATE POLICY "Pharmacies and admins manage medicines" ON medicamentos
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'farmacia'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Pharmacies and admins update medicines" ON medicamentos
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'farmacia'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'farmacia'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Pharmacies and admins delete medicines" ON medicamentos
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'farmacia'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 5. Fix SQL Injection in Pharmacy Search Function
-- ============================================================================
CREATE OR REPLACE FUNCTION buscar_farmacias_proximas(
  p_latitude numeric,
  p_longitude numeric,
  p_medicamento text,
  p_raio_km numeric DEFAULT 10
)
RETURNS TABLE (
  farmacia_id uuid,
  farmacia_nome text,
  farmacia_endereco text,
  farmacia_telefone text,
  farmacia_whatsapp text,
  farmacia_latitude numeric,
  farmacia_longitude numeric,
  distancia_km numeric,
  medicamento_nome text,
  medicamento_preco numeric,
  medicamento_disponivel boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_medicamento_sanitized text;
BEGIN
  -- Input validation to prevent SQL injection
  IF p_medicamento IS NULL OR trim(p_medicamento) = '' THEN
    RAISE EXCEPTION 'Search term cannot be empty';
  END IF;
  
  IF length(p_medicamento) > 100 THEN
    RAISE EXCEPTION 'Search term too long (max 100 characters)';
  END IF;
  
  -- Validate that the search term contains only allowed characters
  -- Allow letters (including Portuguese), numbers, spaces, and hyphens
  IF p_medicamento !~ '^[a-zA-Z0-9àáâãäåèéêëìíîïòóôõöùúûüçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇ \-]+$' THEN
    RAISE EXCEPTION 'Invalid characters in search term';
  END IF;
  
  -- Sanitize the input by trimming and converting to lowercase
  v_medicamento_sanitized := lower(trim(p_medicamento));
  
  RETURN QUERY
  SELECT 
    f.id as farmacia_id,
    f.nome as farmacia_nome,
    f.endereco_completo as farmacia_endereco,
    f.telefone as farmacia_telefone,
    f.whatsapp as farmacia_whatsapp,
    f.latitude as farmacia_latitude,
    f.longitude as farmacia_longitude,
    round(
      (6371 * acos(
        cos(radians(p_latitude)) * 
        cos(radians(f.latitude)) * 
        cos(radians(f.longitude) - radians(p_longitude)) + 
        sin(radians(p_latitude)) * 
        sin(radians(f.latitude))
      ))::numeric, 
      2
    ) as distancia_km,
    m.nome as medicamento_nome,
    e.preco as medicamento_preco,
    e.disponivel as medicamento_disponivel
  FROM farmacias f
  JOIN estoque e ON f.id = e.farmacia_id
  JOIN medicamentos m ON e.medicamento_id = m.id
  WHERE f.ativa = true
    AND e.disponivel = true
    AND e.quantidade > 0
    AND LOWER(m.nome) LIKE '%' || v_medicamento_sanitized || '%'
    AND (6371 * acos(
      cos(radians(p_latitude)) * 
      cos(radians(f.latitude)) * 
      cos(radians(f.longitude) - radians(p_longitude)) + 
      sin(radians(p_latitude)) * 
      sin(radians(f.latitude))
    )) <= p_raio_km
  ORDER BY distancia_km ASC
  LIMIT 50;
END;
$$;