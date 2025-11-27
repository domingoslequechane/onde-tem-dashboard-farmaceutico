-- Drop the old function
DROP FUNCTION IF EXISTS public.buscar_farmacias_proximas(numeric, numeric, text, numeric);

-- Recreate the function without the endereco_completo field
CREATE OR REPLACE FUNCTION public.buscar_farmacias_proximas(
  p_latitude numeric,
  p_longitude numeric,
  p_medicamento text,
  p_raio_km numeric DEFAULT 10
)
RETURNS TABLE (
  farmacia_id uuid,
  farmacia_nome text,
  farmacia_telefone text,
  farmacia_whatsapp text,
  farmacia_latitude numeric,
  farmacia_longitude numeric,
  distancia_km numeric,
  medicamento_id uuid,
  medicamento_nome text,
  medicamento_preco numeric,
  medicamento_categoria text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as farmacia_id,
    f.nome as farmacia_nome,
    f.telefone as farmacia_telefone,
    f.whatsapp as farmacia_whatsapp,
    f.latitude as farmacia_latitude,
    f.longitude as farmacia_longitude,
    ROUND(
      (6371 * acos(
        cos(radians(p_latitude)) * 
        cos(radians(f.latitude)) * 
        cos(radians(f.longitude) - radians(p_longitude)) + 
        sin(radians(p_latitude)) * 
        sin(radians(f.latitude))
      ))::numeric, 2
    ) as distancia_km,
    m.id as medicamento_id,
    m.nome as medicamento_nome,
    e.preco as medicamento_preco,
    m.categoria as medicamento_categoria
  FROM farmacias f
  INNER JOIN estoque e ON f.id = e.farmacia_id
  INNER JOIN medicamentos m ON e.medicamento_id = m.id
  WHERE 
    f.ativa = true
    AND e.disponivel = true
    AND LOWER(m.nome) LIKE LOWER('%' || p_medicamento || '%')
    AND f.latitude IS NOT NULL
    AND f.longitude IS NOT NULL
    AND (6371 * acos(
      cos(radians(p_latitude)) * 
      cos(radians(f.latitude)) * 
      cos(radians(f.longitude) - radians(p_longitude)) + 
      sin(radians(p_latitude)) * 
      sin(radians(f.latitude))
    )) <= p_raio_km
  ORDER BY distancia_km ASC;
END;
$$;