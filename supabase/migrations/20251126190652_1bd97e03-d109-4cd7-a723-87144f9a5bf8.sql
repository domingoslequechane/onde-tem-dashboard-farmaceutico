-- Fix security warning by setting search_path on the function
DROP FUNCTION IF EXISTS public.buscar_farmacias_proximas(numeric, numeric, text, numeric);

CREATE FUNCTION public.buscar_farmacias_proximas(
  p_latitude numeric,
  p_longitude numeric,
  p_medicamento text,
  p_raio_km numeric DEFAULT 10
)
RETURNS TABLE (
  farmacia_id uuid,
  farmacia_nome text,
  endereco_completo text,
  bairro text,
  ponto_referencia text,
  telefone text,
  whatsapp text,
  medicamento_nome text,
  preco numeric,
  quantidade integer,
  distancia_km numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as farmacia_id,
    f.nome as farmacia_nome,
    f.endereco_completo,
    f.bairro,
    f.ponto_referencia,
    f.telefone,
    f.whatsapp,
    m.nome as medicamento_nome,
    e.preco,
    e.quantidade,
    ROUND(
      CAST(
        ST_Distance(
          ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        ) / 1000 AS numeric
      ),
      2
    ) as distancia_km
  FROM farmacias f
  INNER JOIN estoque e ON f.id = e.farmacia_id
  INNER JOIN medicamentos m ON e.medicamento_id = m.id
  WHERE 
    f.ativa = true
    AND e.disponivel = true
    AND LOWER(m.nome) LIKE '%' || LOWER(p_medicamento) || '%'
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      p_raio_km * 1000
    )
  ORDER BY distancia_km ASC;
END;
$$;