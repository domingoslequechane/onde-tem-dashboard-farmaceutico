-- Remove as colunas horario_abertura e horario_fechamento se existirem
-- e garante que horario_funcionamento pode armazenar o formato "HH:MM - HH:MM"
ALTER TABLE public.farmacias 
DROP COLUMN IF EXISTS horario_abertura,
DROP COLUMN IF EXISTS horario_fechamento;

-- Garantir que horario_funcionamento existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'farmacias' 
    AND column_name = 'horario_funcionamento'
  ) THEN
    ALTER TABLE public.farmacias ADD COLUMN horario_funcionamento text;
  END IF;
END $$;

-- Permitir que qualquer usuário autenticado possa criar role de farmacia
-- (necessário para admins criarem contas de farmácia)
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Permitir admins lerem dados de usuários via auth.admin
-- Corrigir policy de leitura de user_roles para admins
DROP POLICY IF EXISTS "Admins can read all user roles" ON public.user_roles;
CREATE POLICY "Admins can read all user roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);