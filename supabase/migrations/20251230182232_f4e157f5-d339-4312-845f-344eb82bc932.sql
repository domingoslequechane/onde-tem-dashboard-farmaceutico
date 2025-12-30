-- Adicionar coluna para controlar exibição de preços
ALTER TABLE public.farmacias 
ADD COLUMN mostrar_preco boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.farmacias.mostrar_preco IS 'Controla se os preços dos medicamentos são exibidos nas buscas públicas';