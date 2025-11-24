-- Criar função para atualizar status da conta para 'active' no primeiro login
CREATE OR REPLACE FUNCTION public.update_account_status_on_first_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o last_sign_in_at mudou de NULL para um valor (primeiro login)
  IF OLD.last_sign_in_at IS NULL AND NEW.last_sign_in_at IS NOT NULL THEN
    -- Atualizar status da conta para 'active' se existir registro em user_roles
    UPDATE public.user_roles
    SET account_status = 'active'
    WHERE user_id = NEW.id 
      AND account_status = 'invited';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger que executa após update em auth.users
DROP TRIGGER IF EXISTS on_user_first_login ON auth.users;
CREATE TRIGGER on_user_first_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS NULL AND NEW.last_sign_in_at IS NOT NULL)
  EXECUTE FUNCTION public.update_account_status_on_first_login();