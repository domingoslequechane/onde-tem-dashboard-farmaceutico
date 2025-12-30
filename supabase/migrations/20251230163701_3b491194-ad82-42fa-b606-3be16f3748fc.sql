-- 1. Corrigir role do usuário farmaciamypharma@gmail.com de admin para farmacia
UPDATE public.user_roles 
SET role = 'farmacia'::app_role
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'farmaciamypharma@gmail.com'
) AND role = 'admin';

-- 2. Sincronizar account_status entre farmacias e user_roles
UPDATE farmacias f
SET account_status = CASE 
  WHEN ur.account_status::text = 'active' THEN 'active'
  WHEN ur.account_status::text = 'blocked' THEN 'blocked'
  ELSE 'pendente'
END
FROM user_roles ur
WHERE f.user_id = ur.user_id
AND ur.role = 'farmacia';

-- 3. Criar trigger para manter sincronizado automaticamente
CREATE OR REPLACE FUNCTION public.sync_farmacia_account_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
    UPDATE farmacias 
    SET account_status = CASE 
      WHEN NEW.account_status::text = 'active' THEN 'active'
      WHEN NEW.account_status::text = 'blocked' THEN 'blocked'
      ELSE 'pendente'
    END,
    atualizado_em = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger se existir e criar novo
DROP TRIGGER IF EXISTS trigger_sync_farmacia_account_status ON public.user_roles;
CREATE TRIGGER trigger_sync_farmacia_account_status
  AFTER UPDATE ON public.user_roles
  FOR EACH ROW
  WHEN (OLD.role = 'farmacia' OR NEW.role = 'farmacia')
  EXECUTE FUNCTION public.sync_farmacia_account_status();

-- 4. Recriar função list_admins com ordem de colunas correta
DROP FUNCTION IF EXISTS public.list_admins();
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (
  account_status public.account_status,
  created_at timestamptz,
  display_name text,
  email text,
  id uuid,
  role public.app_role,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can list admins';
  END IF;
  RETURN QUERY
  SELECT 
    ur.account_status,
    ur.created_at,
    ur.display_name,
    COALESCE(au.email, '')::text as email,
    ur.id,
    ur.role,
    ur.user_id
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON ur.user_id = au.id
  WHERE ur.role IN ('admin', 'super_admin')
  ORDER BY ur.created_at DESC;
END;
$$;