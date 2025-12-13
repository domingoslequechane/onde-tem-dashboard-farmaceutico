-- Habilitar extensão PostGIS para cálculo de distância geográfica
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- TABELA: clientes
-- =====================================================
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT,
  telefone TEXT UNIQUE NOT NULL,
  email TEXT,
  localizacao_ultima TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABELA: farmacias
-- =====================================================
CREATE TABLE public.farmacias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco_completo TEXT NOT NULL,
  bairro TEXT,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  cep TEXT,
  ponto_referencia TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  telefone TEXT,
  whatsapp TEXT,
  horario_funcionamento TEXT,
  ativa BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.farmacias ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABELA: medicamentos
-- =====================================================
CREATE TABLE public.medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_generico TEXT,
  principio_ativo TEXT,
  fabricante TEXT,
  categoria TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABELA: estoque
-- =====================================================
CREATE TABLE public.estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmacia_id UUID REFERENCES public.farmacias(id) ON DELETE CASCADE NOT NULL,
  medicamento_id UUID REFERENCES public.medicamentos(id) ON DELETE CASCADE NOT NULL,
  quantidade INTEGER DEFAULT 0,
  preco DECIMAL(10, 2),
  disponivel BOOLEAN DEFAULT true,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(farmacia_id, medicamento_id)
);

ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABELA: consultas
-- =====================================================
CREATE TABLE public.consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  medicamento_buscado TEXT NOT NULL,
  localizacao_informada TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  canal TEXT DEFAULT 'whatsapp',
  status TEXT DEFAULT 'pendente',
  resposta TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualização automática
CREATE TRIGGER atualizar_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

CREATE TRIGGER atualizar_farmacias_updated_at
  BEFORE UPDATE ON public.farmacias
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

CREATE TRIGGER atualizar_estoque_updated_at
  BEFORE UPDATE ON public.estoque
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

-- =====================================================
-- FUNÇÃO: Buscar farmácias próximas com medicamento
-- =====================================================
CREATE OR REPLACE FUNCTION public.buscar_farmacias_proximas(
  p_medicamento TEXT,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_raio_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  farmacia_id UUID,
  farmacia_nome TEXT,
  endereco_completo TEXT,
  bairro TEXT,
  ponto_referencia TEXT,
  telefone TEXT,
  whatsapp TEXT,
  distancia_km DECIMAL,
  medicamento_nome TEXT,
  preco DECIMAL,
  quantidade INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.nome,
    f.endereco_completo,
    f.bairro,
    f.ponto_referencia,
    f.telefone,
    f.whatsapp,
    ROUND(
      CAST(ST_Distance(
        ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)
      ) / 1000 AS NUMERIC), 2
    ) AS distancia_km,
    m.nome,
    e.preco,
    e.quantidade
  FROM public.farmacias f
  INNER JOIN public.estoque e ON e.farmacia_id = f.id
  INNER JOIN public.medicamentos m ON m.id = e.medicamento_id
  WHERE 
    f.ativa = true
    AND e.disponivel = true
    AND e.quantidade > 0
    AND LOWER(m.nome) LIKE LOWER('%' || p_medicamento || '%')
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
      p_raio_km * 1000
    )
  ORDER BY distancia_km ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: Registrar consulta com localização
-- =====================================================
CREATE OR REPLACE FUNCTION public.registrar_consulta_com_localizacao(
  p_telefone TEXT,
  p_nome TEXT,
  p_medicamento TEXT,
  p_localizacao TEXT,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL,
  p_canal TEXT DEFAULT 'whatsapp'
)
RETURNS UUID AS $$
DECLARE
  v_cliente_id UUID;
  v_consulta_id UUID;
BEGIN
  -- Buscar ou criar cliente
  INSERT INTO public.clientes (telefone, nome, localizacao_ultima, latitude, longitude)
  VALUES (p_telefone, p_nome, p_localizacao, p_latitude, p_longitude)
  ON CONFLICT (telefone) 
  DO UPDATE SET 
    nome = COALESCE(EXCLUDED.nome, clientes.nome),
    localizacao_ultima = EXCLUDED.localizacao,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    atualizado_em = NOW()
  RETURNING id INTO v_cliente_id;

  -- Registrar consulta
  INSERT INTO public.consultas (
    cliente_id, 
    medicamento_buscado, 
    localizacao_informada,
    latitude,
    longitude,
    canal, 
    status
  )
  VALUES (
    v_cliente_id, 
    p_medicamento, 
    p_localizacao,
    p_latitude,
    p_longitude,
    p_canal, 
    'pendente'
  )
  RETURNING id INTO v_consulta_id;

  RETURN v_consulta_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ÍNDICES para Performance
-- =====================================================
CREATE INDEX idx_clientes_telefone ON public.clientes(telefone);
CREATE INDEX idx_consultas_cliente_id ON public.consultas(cliente_id);
CREATE INDEX idx_consultas_status ON public.consultas(status);
CREATE INDEX idx_medicamentos_nome ON public.medicamentos USING gin(to_tsvector('portuguese', nome));
CREATE INDEX idx_estoque_farmacia_medicamento ON public.estoque(farmacia_id, medicamento_id);
CREATE INDEX idx_estoque_disponivel ON public.estoque(disponivel) WHERE disponivel = true;

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Clientes: acesso público para INSERT (via n8n/WhatsApp)
CREATE POLICY "Permitir inserção pública de clientes"
ON public.clientes FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Clientes podem ver seus dados"
ON public.clientes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir leitura anônima de clientes"
ON public.clientes FOR SELECT
TO anon
USING (true);

-- Consultas: acesso público para INSERT e SELECT
CREATE POLICY "Permitir registro público de consultas"
ON public.consultas FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Permitir leitura pública de consultas"
ON public.consultas FOR SELECT
TO anon, authenticated
USING (true);

-- Farmácias: somente leitura pública
CREATE POLICY "Permitir leitura pública de farmácias"
ON public.farmacias FOR SELECT
TO anon, authenticated
USING (ativa = true);

-- Medicamentos: somente leitura pública
CREATE POLICY "Permitir leitura pública de medicamentos"
ON public.medicamentos FOR SELECT
TO anon, authenticated
USING (true);

-- Estoque: somente leitura pública de itens disponíveis
CREATE POLICY "Permitir leitura pública de estoque disponível"
ON public.estoque FOR SELECT
TO anon, authenticated
USING (disponivel = true);

-- =====================================================
-- DADOS FICTÍCIOS: Uma Farmácia de Exemplo
-- =====================================================

-- Inserir farmácia fictícia (Maputo, Moçambique)
INSERT INTO public.farmacias (
  nome, 
  endereco_completo, 
  bairro, 
  cidade, 
  estado, 
  cep,
  ponto_referencia, 
  latitude, 
  longitude, 
  telefone, 
  whatsapp, 
  horario_funcionamento,
  ativa
) VALUES (
  'Farmácia Saúde Total',
  'Avenida Julius Nyerere, 1234',
  'Polana',
  'Maputo',
  'Maputo',
  '1100',
  'Próximo ao Shoprite Polana',
  -25.9655,
  32.5832,
  '+258 84 123 4567',
  '+258 84 123 4567',
  'Segunda a Sábado: 8h-20h, Domingo: 9h-18h',
  true
);

-- Inserir medicamentos fictícios
INSERT INTO public.medicamentos (nome, nome_generico, principio_ativo, fabricante, categoria) VALUES
('Dipirona 500mg', 'Dipirona Sódica', 'Dipirona Sódica', 'EMS', 'analgesico'),
('Paracetamol 750mg', 'Paracetamol', 'Paracetamol', 'Medley', 'analgesico'),
('Amoxicilina 500mg', 'Amoxicilina', 'Amoxicilina', 'Eurofarma', 'antibiotico'),
('Ibuprofeno 600mg', 'Ibuprofeno', 'Ibuprofeno', 'Teuto', 'anti-inflamatorio'),
('Omeprazol 20mg', 'Omeprazol', 'Omeprazol', 'Medley', 'antiácido'),
('Vitamina C 1g', 'Ácido Ascórbico', 'Ácido Ascórbico', 'Vitamed', 'vitamina'),
('Loratadina 10mg', 'Loratadina', 'Loratadina', 'EMS', 'antialérgico'),
('Azitromicina 500mg', 'Azitromicina', 'Azitromicina', 'Eurofarma', 'antibiotico');

-- Inserir estoque na farmácia fictícia
INSERT INTO public.estoque (farmacia_id, medicamento_id, quantidade, preco, disponivel)
SELECT 
  (SELECT id FROM public.farmacias WHERE nome = 'Farmácia Saúde Total'),
  m.id,
  CASE 
    WHEN m.nome LIKE '%Dipirona%' THEN 150
    WHEN m.nome LIKE '%Paracetamol%' THEN 200
    WHEN m.nome LIKE '%Amoxicilina%' THEN 80
    WHEN m.nome LIKE '%Ibuprofeno%' THEN 120
    WHEN m.nome LIKE '%Omeprazol%' THEN 100
    WHEN m.nome LIKE '%Vitamina%' THEN 250
    WHEN m.nome LIKE '%Loratadina%' THEN 90
    WHEN m.nome LIKE '%Azitromicina%' THEN 60
  END as quantidade,
  CASE 
    WHEN m.nome LIKE '%Dipirona%' THEN 45.50
    WHEN m.nome LIKE '%Paracetamol%' THEN 38.90
    WHEN m.nome LIKE '%Amoxicilina%' THEN 125.00
    WHEN m.nome LIKE '%Ibuprofeno%' THEN 52.30
    WHEN m.nome LIKE '%Omeprazol%' THEN 68.75
    WHEN m.nome LIKE '%Vitamina%' THEN 85.00
    WHEN m.nome LIKE '%Loratadina%' THEN 42.50
    WHEN m.nome LIKE '%Azitromicina%' THEN 180.00
  END as preco,
  true
FROM public.medicamentos m;