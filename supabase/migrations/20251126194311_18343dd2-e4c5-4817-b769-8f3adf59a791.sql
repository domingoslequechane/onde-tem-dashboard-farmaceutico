-- Drop existing function
DROP FUNCTION IF EXISTS public.buscar_farmacias_proximas(numeric, numeric, text, numeric);

-- Recreate function with latitude and longitude in return
CREATE OR REPLACE FUNCTION public.buscar_farmacias_proximas(
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
  farmacia_latitude numeric,
  farmacia_longitude numeric,
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
    f.id,
    f.nome,
    f.endereco_completo,
    f.bairro,
    f.ponto_referencia,
    f.telefone,
    f.whatsapp,
    f.latitude,
    f.longitude,
    m.nome,
    e.preco,
    e.quantidade,
    (
      6371 * acos(
        cos(radians(p_latitude)) * 
        cos(radians(f.latitude)) * 
        cos(radians(f.longitude) - radians(p_longitude)) + 
        sin(radians(p_latitude)) * 
        sin(radians(f.latitude))
      )
    )::numeric AS distancia_km
  FROM farmacias f
  JOIN estoque e ON f.id = e.farmacia_id
  JOIN medicamentos m ON e.medicamento_id = m.id
  WHERE 
    f.ativa = true
    AND e.disponivel = true
    AND m.nome ILIKE '%' || p_medicamento || '%'
    AND (
      6371 * acos(
        cos(radians(p_latitude)) * 
        cos(radians(f.latitude)) * 
        cos(radians(f.longitude) - radians(p_longitude)) + 
        sin(radians(p_latitude)) * 
        sin(radians(f.latitude))
      )
    ) <= p_raio_km
  ORDER BY distancia_km;
END;
$$;