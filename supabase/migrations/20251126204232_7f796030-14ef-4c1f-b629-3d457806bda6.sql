-- Drop existing function
DROP FUNCTION IF EXISTS public.buscar_farmacias_proximas(numeric, numeric, text, numeric);

-- Recreate function with correct return type for distancia_km
CREATE OR REPLACE FUNCTION public.buscar_farmacias_proximas(
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
  medicamento_id uuid,
  medicamento_nome text,
  medicamento_categoria text,
  medicamento_preco numeric,
  distancia_km numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as farmacia_id,
    f.nome as farmacia_nome,
    f.endereco_completo as farmacia_endereco,
    f.telefone as farmacia_telefone,
    f.whatsapp as farmacia_whatsapp,
    f.latitude as farmacia_latitude,
    f.longitude as farmacia_longitude,
    m.id as medicamento_id,
    m.nome as medicamento_nome,
    m.categoria as medicamento_categoria,
    e.preco as medicamento_preco,
    CAST(
      (
        6371 * acos(
          cos(radians(p_latitude)) * 
          cos(radians(f.latitude)) * 
          cos(radians(f.longitude) - radians(p_longitude)) + 
          sin(radians(p_latitude)) * 
          sin(radians(f.latitude))
        )
      ) AS numeric
    ) as distancia_km
  FROM farmacias f
  INNER JOIN estoque e ON f.id = e.farmacia_id
  INNER JOIN medicamentos m ON e.medicamento_id = m.id
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
  ORDER BY distancia_km ASC;
END;
$$;