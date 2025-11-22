-- Ajustar precisão dos campos de coordenadas para evitar overflow
-- Latitude: -90 a 90 (precisa de 2 dígitos inteiros + 8 decimais)
-- Longitude: -180 a 180 (precisa de 3 dígitos inteiros + 8 decimais)

-- Remover constraints existentes e recriar com precisão correta
ALTER TABLE public.farmacias 
  ALTER COLUMN latitude TYPE NUMERIC(10,7),
  ALTER COLUMN longitude TYPE NUMERIC(10,7);

-- Adicionar validação de ranges válidos
ALTER TABLE public.farmacias
  DROP CONSTRAINT IF EXISTS farmacias_latitude_check;

ALTER TABLE public.farmacias
  DROP CONSTRAINT IF EXISTS farmacias_longitude_check;

-- Criar função de validação para coordenadas
CREATE OR REPLACE FUNCTION public.validate_coordinates()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Criar trigger para validação
DROP TRIGGER IF EXISTS validate_farmacias_coordinates ON public.farmacias;

CREATE TRIGGER validate_farmacias_coordinates
  BEFORE INSERT OR UPDATE ON public.farmacias
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_coordinates();