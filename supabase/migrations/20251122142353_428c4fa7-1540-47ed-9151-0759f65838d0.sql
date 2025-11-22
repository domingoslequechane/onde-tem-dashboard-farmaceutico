-- Corrigir search_path da função de validação de coordenadas
CREATE OR REPLACE FUNCTION public.validate_coordinates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.latitude < -90 OR NEW.latitude > 90 THEN
    RAISE EXCEPTION 'Latitude deve estar entre -90 e 90';
  END IF;
  
  IF NEW.longitude < -180 OR NEW.longitude > 180 THEN
    RAISE EXCEPTION 'Longitude deve estar entre -180 e 180';
  END IF;
  
  RETURN NEW;
END;
$$;