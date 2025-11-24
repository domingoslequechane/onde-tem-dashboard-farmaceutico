-- Modificar função set_admin_display_name para aceitar service role
DROP FUNCTION IF EXISTS public.set_admin_display_name(uuid, text);

CREATE OR REPLACE FUNCTION public.set_admin_display_name(
  target_user_id uuid,
  new_display_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário atual é super-admin OU se está usando service_role
  -- (service_role é identificado quando auth.uid() retorna NULL mas a função foi chamada com permissões)
  IF auth.uid() IS NOT NULL AND NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas super-admins podem definir nomes de administradores';
  END IF;
  
  -- Atualizar o display_name
  UPDATE public.user_roles
  SET display_name = new_display_name
  WHERE user_id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_admin_display_name(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_display_name(uuid, text) TO service_role;