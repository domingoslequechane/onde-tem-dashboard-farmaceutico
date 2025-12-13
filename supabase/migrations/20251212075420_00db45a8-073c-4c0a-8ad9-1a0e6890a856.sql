-- Fix SECURITY DEFINER functions with proper search_path to prevent search_path manipulation attacks

-- Fix handle_admin_signup
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, account_status)
  VALUES (NEW.id, 'admin', 'invited')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix validate_coordinates
CREATE OR REPLACE FUNCTION public.validate_coordinates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90) THEN
    RAISE EXCEPTION 'Latitude must be between -90 and 90';
  END IF;
  IF NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180) THEN
    RAISE EXCEPTION 'Longitude must be between -180 and 180';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix delete_expired_codes
CREATE OR REPLACE FUNCTION public.delete_expired_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.deletion_codes WHERE expires_at < now();
END;
$$;

-- Fix atualizar_updated_at
CREATE OR REPLACE FUNCTION public.atualizar_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

-- Fix get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  SELECT role INTO _role FROM public.user_roles WHERE user_id = _user_id;
  RETURN _role;
END;
$$;

-- Fix handle_new_user_role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_emails TEXT[] := ARRAY['admin@onixagence.com', 'admin@ondetem.com.br'];
BEGIN
  IF NEW.email = ANY(admin_emails) THEN
    INSERT INTO public.user_roles (user_id, role, account_status, display_name)
    VALUES (NEW.id, 'super_admin', 'active', split_part(NEW.email, '@', 1))
    ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', account_status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix registrar_consulta_com_localizacao
CREATE OR REPLACE FUNCTION public.registrar_consulta_com_localizacao(
  p_nome text,
  p_telefone text,
  p_medicamento text,
  p_localizacao text,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL,
  p_canal text DEFAULT 'web'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_id uuid;
  v_consulta_id uuid;
BEGIN
  SELECT id INTO v_cliente_id FROM public.clientes WHERE telefone = p_telefone;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, telefone, latitude, longitude, localizacao_ultima)
    VALUES (p_nome, p_telefone, p_latitude, p_longitude, p_localizacao)
    RETURNING id INTO v_cliente_id;
  ELSE
    UPDATE public.clientes SET
      nome = COALESCE(p_nome, nome),
      latitude = COALESCE(p_latitude, latitude),
      longitude = COALESCE(p_longitude, longitude),
      localizacao_ultima = COALESCE(p_localizacao, localizacao_ultima),
      atualizado_em = now()
    WHERE id = v_cliente_id;
  END IF;
  INSERT INTO public.consultas (cliente_id, medicamento_buscado, localizacao_informada, latitude, longitude, canal)
  VALUES (v_cliente_id, p_medicamento, p_localizacao, p_latitude, p_longitude, p_canal)
  RETURNING id INTO v_consulta_id;
  RETURN v_consulta_id;
END;
$$;

-- Fix has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
END;
$$;

-- Fix is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin');
END;
$$;

-- Fix is_user_blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.blocked_users WHERE user_id = _user_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND account_status = 'blocked');
END;
$$;

-- Fix update_admin_info
CREATE OR REPLACE FUNCTION public.update_admin_info(target_user_id uuid, new_display_name text, new_role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_super_admin boolean;
  super_admin_count integer;
BEGIN
  SELECT public.is_super_admin(auth.uid()) INTO caller_is_super_admin;
  IF NOT caller_is_super_admin THEN
    RAISE EXCEPTION 'Only super admins can update admin info';
  END IF;
  IF new_role != 'super_admin' THEN
    SELECT COUNT(*) INTO super_admin_count FROM public.user_roles WHERE role = 'super_admin';
    IF super_admin_count <= 1 AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'super_admin') THEN
      RAISE EXCEPTION 'Cannot demote the last super admin';
    END IF;
  END IF;
  UPDATE public.user_roles SET display_name = new_display_name, role = new_role WHERE user_id = target_user_id;
END;
$$;

-- Fix unblock_admin
CREATE OR REPLACE FUNCTION public.unblock_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can unblock users';
  END IF;
  DELETE FROM public.blocked_users WHERE user_id = target_user_id;
  UPDATE public.user_roles SET account_status = 'active' WHERE user_id = target_user_id;
END;
$$;

-- Fix delete_admin
CREATE OR REPLACE FUNCTION public.delete_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can delete admins';
  END IF;
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.blocked_users WHERE user_id = target_user_id;
END;
$$;

-- Fix set_admin_display_name
CREATE OR REPLACE FUNCTION public.set_admin_display_name(target_user_id uuid, new_display_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_roles SET display_name = new_display_name WHERE user_id = target_user_id;
END;
$$;

-- Fix list_admins (with correct column order from existing function)
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (id uuid, user_id uuid, role public.app_role, email text, display_name text, created_at timestamptz, account_status public.account_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can list admins';
  END IF;
  RETURN QUERY
  SELECT ur.id, ur.user_id, ur.role, au.email, ur.display_name, ur.created_at, ur.account_status
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON ur.user_id = au.id
  WHERE ur.role IN ('admin', 'super_admin')
  ORDER BY ur.created_at DESC;
END;
$$;

-- Fix update_account_status_on_first_login
CREATE OR REPLACE FUNCTION public.update_account_status_on_first_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_roles SET account_status = 'active' WHERE user_id = NEW.id AND account_status = 'invited';
  RETURN NEW;
END;
$$;

-- Fix block_admin
CREATE OR REPLACE FUNCTION public.block_admin(target_user_id uuid, block_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can block users';
  END IF;
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;
  INSERT INTO public.blocked_users (user_id, blocked_by, reason)
  VALUES (target_user_id, auth.uid(), block_reason)
  ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_roles SET account_status = 'blocked' WHERE user_id = target_user_id;
END;
$$;

-- Fix log_user_login
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_role public.app_role;
BEGIN
  v_user_id := auth.uid();
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_user_id;
  INSERT INTO public.login_history (user_id, email, role) VALUES (v_user_id, v_email, v_role);
END;
$$;

-- Fix get_login_history (with correct column order from existing function)
CREATE OR REPLACE FUNCTION public.get_login_history(limit_count integer DEFAULT 50)
RETURNS TABLE (id uuid, user_id uuid, email text, role public.app_role, login_at timestamptz, display_name text, user_agent text, ip_address text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can view login history';
  END IF;
  RETURN QUERY
  SELECT lh.id, lh.user_id, lh.email, lh.role, lh.login_at, ur.display_name, lh.user_agent, lh.ip_address
  FROM public.login_history lh
  LEFT JOIN public.user_roles ur ON lh.user_id = ur.user_id
  ORDER BY lh.login_at DESC
  LIMIT limit_count;
END;
$$;

-- Fix buscar_farmacias_proximas (with correct column order from existing function)
CREATE OR REPLACE FUNCTION public.buscar_farmacias_proximas(
  p_latitude double precision,
  p_longitude double precision,
  p_medicamento text,
  p_raio_km double precision DEFAULT 10.0
)
RETURNS TABLE (
  farmacia_id uuid,
  farmacia_nome text,
  farmacia_telefone text,
  farmacia_whatsapp text,
  farmacia_latitude numeric,
  farmacia_longitude numeric,
  distancia_km numeric,
  medicamento_id uuid,
  medicamento_nome text,
  medicamento_preco numeric,
  medicamento_categoria text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as farmacia_id,
    f.nome as farmacia_nome,
    f.telefone as farmacia_telefone,
    f.whatsapp as farmacia_whatsapp,
    f.latitude as farmacia_latitude,
    f.longitude as farmacia_longitude,
    (6371 * acos(cos(radians(p_latitude)) * cos(radians(f.latitude)) * cos(radians(f.longitude) - radians(p_longitude)) + sin(radians(p_latitude)) * sin(radians(f.latitude))))::numeric as distancia_km,
    m.id as medicamento_id,
    m.nome as medicamento_nome,
    e.preco as medicamento_preco,
    m.categoria as medicamento_categoria
  FROM public.farmacias f
  JOIN public.estoque e ON f.id = e.farmacia_id
  JOIN public.medicamentos m ON e.medicamento_id = m.id
  WHERE f.ativa = true
    AND e.disponivel = true
    AND LOWER(m.nome) LIKE LOWER('%' || p_medicamento || '%')
    AND f.latitude IS NOT NULL
    AND f.longitude IS NOT NULL
    AND (6371 * acos(cos(radians(p_latitude)) * cos(radians(f.latitude)) * cos(radians(f.longitude) - radians(p_longitude)) + sin(radians(p_latitude)) * sin(radians(f.latitude)))) <= p_raio_km
  ORDER BY distancia_km;
END;
$$;