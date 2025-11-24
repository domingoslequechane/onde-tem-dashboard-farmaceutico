-- Remover função existente
DROP FUNCTION IF EXISTS public.get_login_history(integer);

-- Recriar função para retornar user_agent e ip_address
CREATE OR REPLACE FUNCTION public.get_login_history(limit_count integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  role app_role,
  login_at timestamp with time zone,
  display_name text,
  user_agent text,
  ip_address text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lh.id,
    lh.user_id,
    lh.email,
    lh.role,
    lh.login_at,
    ur.display_name,
    lh.user_agent,
    lh.ip_address
  FROM login_history lh
  LEFT JOIN user_roles ur ON lh.user_id = ur.user_id
  ORDER BY lh.login_at DESC
  LIMIT limit_count;
END;
$$;

-- Atualizar função para capturar user_agent e ip_address
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_role app_role;
  v_display_name text;
  v_user_agent text;
  v_ip_address text;
BEGIN
  -- Obter ID do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Obter email do usuário
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  -- Obter role e display_name do usuário
  SELECT role, display_name INTO v_role, v_display_name
  FROM user_roles
  WHERE user_id = v_user_id;

  -- Capturar user agent e IP address dos headers da requisição
  v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
  v_ip_address := current_setting('request.headers', true)::json->>'x-real-ip';

  -- Inserir registro no histórico
  INSERT INTO login_history (user_id, email, role, user_agent, ip_address)
  VALUES (v_user_id, v_email, v_role, v_user_agent, v_ip_address);
END;
$$;