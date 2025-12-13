-- Remove coluna endereco_completo da tabela farmacias
ALTER TABLE public.farmacias DROP COLUMN IF EXISTS endereco_completo;