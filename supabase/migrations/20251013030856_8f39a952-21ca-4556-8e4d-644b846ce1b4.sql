-- Corrigir avisos de segurança: adicionar search_path às funções

CREATE OR REPLACE FUNCTION public.atualizar_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;

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
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.registrar_consulta_com_localizacao(
  p_telefone TEXT,
  p_nome TEXT,
  p_medicamento TEXT,
  p_localizacao TEXT,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL,
  p_canal TEXT DEFAULT 'whatsapp'
)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;