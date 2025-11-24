-- Criar função security definer para atualizar display_name e role de administradores
CREATE OR REPLACE FUNCTION public.update_admin_info(
  target_user_id uuid,
  new_display_name text,
  new_role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário atual é super-admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas super-admins podem atualizar informações de administradores';
  END IF;
  
  -- Não permitir que o usuário se remova como super-admin se for o único
  IF auth.uid() = target_user_id AND new_role != 'super_admin' THEN
    IF (SELECT COUNT(*) FROM user_roles WHERE role = 'super_admin') <= 1 THEN
      RAISE EXCEPTION 'Não é possível alterar o papel do último super-admin';
    END IF;
  END IF;
  
  -- Atualizar as informações
  UPDATE public.user_roles
  SET 
    display_name = new_display_name,
    role = new_role
  WHERE user_id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_admin_info(uuid, text, app_role) TO authenticated;

-- Criar função security definer para definir display_name após criação
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
  -- Verificar se o usuário atual é super-admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas super-admins podem definir nomes de administradores';
  END IF;
  
  -- Atualizar o display_name
  UPDATE public.user_roles
  SET display_name = new_display_name
  WHERE user_id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_admin_display_name(uuid, text) TO authenticated;