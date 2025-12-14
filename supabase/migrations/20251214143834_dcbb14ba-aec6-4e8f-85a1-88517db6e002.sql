-- =============================================
-- SISTEMA DE CAPTURA DE BUSCAS ONDTEM
-- =============================================

-- 1. Criar tabela searches (Busca / Intenção)
CREATE TABLE public.searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  typed_text TEXT NOT NULL,
  submitted_text TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  search_radius INTEGER DEFAULT 1,
  source TEXT DEFAULT 'web',
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_searches_session ON searches(session_id);
CREATE INDEX idx_searches_criado_em ON searches(criado_em);
CREATE INDEX idx_searches_location ON searches(latitude, longitude);

-- 2. Criar tabela search_normalizations (Intenção Normalizada)
CREATE TABLE public.search_normalizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  normalized_term TEXT,
  confidence_score NUMERIC DEFAULT 0,
  match_type TEXT DEFAULT 'none' CHECK (match_type IN ('catalog', 'semantic', 'none')),
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_search_normalizations_search ON search_normalizations(search_id);

-- 3. Criar tabela product_selections (Clique Consciente)
CREATE TABLE public.product_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  product_id UUID REFERENCES medicamentos(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_selections_search ON product_selections(search_id);
CREATE INDEX idx_product_selections_product ON product_selections(product_id);

-- 4. Criar tabela search_outcomes (Resultado da Busca)
CREATE TABLE public.search_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  outcome_status TEXT NOT NULL CHECK (outcome_status IN ('success', 'no_pharmacy', 'no_product', 'abandoned')),
  pharmacies_found_count INTEGER DEFAULT 0,
  closest_pharmacy_distance NUMERIC,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- UNIQUE para garantir 1 outcome por search (AJUSTE FINAL 1)
CREATE UNIQUE INDEX uniq_search_outcome ON search_outcomes(search_id);

-- 5. Expandir impressoes_farmacia com contexto completo
ALTER TABLE impressoes_farmacia
ADD COLUMN IF NOT EXISTS search_id UUID REFERENCES searches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS product_selection_id UUID REFERENCES product_selections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rank_position INTEGER,
ADD COLUMN IF NOT EXISTS is_closest BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_first_option BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_impressoes_search ON impressoes_farmacia(search_id);
CREATE INDEX IF NOT EXISTS idx_impressoes_rank ON impressoes_farmacia(rank_position);

-- 6. Função de Rate Limiting (30 buscas/min por sessão)
CREATE OR REPLACE FUNCTION check_search_rate_limit(p_session_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM searches
  WHERE session_id = p_session_id
    AND criado_em > NOW() - INTERVAL '1 minute';
  
  RETURN recent_count < 30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Enable RLS em todas as novas tabelas
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_normalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_outcomes ENABLE ROW LEVEL SECURITY;

-- 8. Políticas INSERT para searches (com rate limit)
CREATE POLICY "Insert searches com rate limit"
ON public.searches FOR INSERT TO anon, authenticated
WITH CHECK (check_search_rate_limit(session_id));

-- 9. Políticas INSERT para outras tabelas
CREATE POLICY "Insert normalizations"
ON public.search_normalizations FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Insert selections"
ON public.product_selections FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Insert outcomes"
ON public.search_outcomes FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 10. Políticas SELECT para analytics (farmácias e admins)
CREATE POLICY "Read searches para analítica"
ON public.searches FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('farmacia', 'admin', 'super_admin')
  )
);

CREATE POLICY "Read normalizations para analítica"
ON public.search_normalizations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('farmacia', 'admin', 'super_admin')
  )
);

CREATE POLICY "Read selections para analítica"
ON public.product_selections FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('farmacia', 'admin', 'super_admin')
  )
);

CREATE POLICY "Read outcomes para analítica"
ON public.search_outcomes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('farmacia', 'admin', 'super_admin')
  )
);