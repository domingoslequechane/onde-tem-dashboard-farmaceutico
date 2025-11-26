-- Tornar campos cidade, estado, latitude e longitude opcionais na tabela farmacias
ALTER TABLE public.farmacias 
  ALTER COLUMN cidade DROP NOT NULL,
  ALTER COLUMN estado DROP NOT NULL,
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;