-- Criar enum para status da conta
CREATE TYPE public.account_status AS ENUM ('invited', 'active', 'blocked');

-- Adicionar coluna de status à tabela user_roles
ALTER TABLE public.user_roles 
ADD COLUMN account_status account_status DEFAULT 'invited' NOT NULL;

-- Atualizar administradores existentes que já fizeram login para 'active'
UPDATE public.user_roles
SET account_status = 'active'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE last_sign_in_at IS NOT NULL
);

-- Remover a função antiga e criar a nova versão
DROP FUNCTION IF EXISTS public.list_admins();

CREATE FUNCTION public.list_admins()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role app_role,
  email text,
  display_name text,
  created_at timestamp with time zone,
  account_status account_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    au.email::text,
    ur.display_name,
    ur.created_at,
    ur.account_status
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON ur.user_id = au.id
  WHERE ur.role IN ('admin', 'super_admin')
  ORDER BY ur.created_at DESC;
END;
$$;