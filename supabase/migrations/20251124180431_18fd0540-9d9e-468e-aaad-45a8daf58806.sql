-- Adicionar campo display_name e created_at em user_roles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Criar tabela de histórico de logins
CREATE TABLE IF NOT EXISTS public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role app_role,
  login_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Habilitar RLS na tabela de histórico de logins
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Política: apenas super-admins podem ver histórico de logins
CREATE POLICY "Super-admins can view login history"
ON public.login_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Dropar e recriar função list_admins com mais campos
DROP FUNCTION IF EXISTS public.list_admins();

CREATE FUNCTION public.list_admins()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role app_role,
  email text,
  display_name text,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone
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
    au.email,
    ur.display_name,
    ur.created_at,
    au.last_sign_in_at
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON au.id = ur.user_id
  WHERE ur.role IN ('admin', 'super_admin')
  ORDER BY ur.role DESC, ur.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated;

-- Função para registrar login
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_email text;
BEGIN
  -- Obter role e email do usuário
  SELECT ur.role, au.email INTO v_role, v_email
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON au.id = ur.user_id
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
  -- Registrar login
  INSERT INTO public.login_history (user_id, email, role)
  VALUES (auth.uid(), v_email, v_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_user_login() TO authenticated;

-- Função para obter histórico de logins (apenas super-admins)
CREATE OR REPLACE FUNCTION public.get_login_history(limit_count integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  role app_role,
  login_at timestamp with time zone,
  display_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    lh.id,
    lh.user_id,
    lh.email,
    lh.role,
    lh.login_at,
    ur.display_name
  FROM public.login_history lh
  LEFT JOIN public.user_roles ur ON ur.user_id = lh.user_id
  ORDER BY lh.login_at DESC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_login_history(integer) TO authenticated;