-- Adiciona coluna link_google_maps na tabela farmacias
ALTER TABLE public.farmacias ADD COLUMN IF NOT EXISTS link_google_maps TEXT;