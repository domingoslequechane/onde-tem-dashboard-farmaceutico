-- Criar função security definer para listar administradores com emails
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role app_role,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    au.email
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON au.id = ur.user_id
  WHERE ur.role IN ('admin', 'super_admin')
  ORDER BY ur.role DESC, au.email ASC;
$$;

-- Garantir que usuários autenticados podem executar esta função
GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated;