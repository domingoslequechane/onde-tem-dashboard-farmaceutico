-- Criar função security definer para verificar role de admin
-- Esta função evita recursão RLS ao executar com privilégios do owner
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Garantir que usuários autenticados podem executar esta função
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;