-- Atualizar função delete_admin para remover completamente o usuário
CREATE OR REPLACE FUNCTION public.delete_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role app_role;
BEGIN
  -- Verificar se quem está chamando é super_admin
  SELECT role INTO caller_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF caller_role != 'super_admin' THEN
    RAISE EXCEPTION 'Apenas super-admins podem remover administradores';
  END IF;

  -- Verificar se não está tentando remover a si mesmo
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode remover a si mesmo';
  END IF;

  -- Remover o registro de user_roles
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id;

  -- Remover o usuário de auth.users (isso remove completamente o usuário)
  DELETE FROM auth.users
  WHERE id = target_user_id;
END;
$$;