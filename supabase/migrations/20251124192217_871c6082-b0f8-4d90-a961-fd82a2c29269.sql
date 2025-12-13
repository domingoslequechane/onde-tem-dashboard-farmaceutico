-- Criar função security definer para bloquear administradores
CREATE OR REPLACE FUNCTION public.block_admin(
  target_user_id uuid,
  block_reason text DEFAULT 'Bloqueado pelo administrador'
)
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
    RAISE EXCEPTION 'Apenas super-admins podem bloquear administradores';
  END IF;

  -- Verificar se não está tentando bloquear a si mesmo
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode bloquear a si mesmo';
  END IF;

  -- Atualizar status da conta para 'blocked'
  UPDATE public.user_roles
  SET account_status = 'blocked'
  WHERE user_id = target_user_id;

  -- Inserir registro na tabela blocked_users
  INSERT INTO public.blocked_users (user_id, blocked_by, reason)
  VALUES (target_user_id, auth.uid(), block_reason)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Criar função security definer para desbloquear administradores
CREATE OR REPLACE FUNCTION public.unblock_admin(target_user_id uuid)
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
    RAISE EXCEPTION 'Apenas super-admins podem desbloquear administradores';
  END IF;

  -- Atualizar status da conta para 'active'
  UPDATE public.user_roles
  SET account_status = 'active'
  WHERE user_id = target_user_id;

  -- Remover registro da tabela blocked_users
  DELETE FROM public.blocked_users
  WHERE user_id = target_user_id;
END;
$$;