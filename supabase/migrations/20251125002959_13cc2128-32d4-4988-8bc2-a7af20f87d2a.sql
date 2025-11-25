-- Adicionar campos email e account_status à tabela farmacias
ALTER TABLE public.farmacias 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'invited' CHECK (account_status IN ('invited', 'active', 'blocked'));

-- Criar índice para facilitar busca por email
CREATE INDEX IF NOT EXISTS idx_farmacias_email ON public.farmacias(email);

-- Criar função para atualizar status da farmácia no primeiro login
CREATE OR REPLACE FUNCTION public.update_pharmacy_status_on_first_login()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se last_sign_in_at mudou de NULL para um valor, atualizar account_status
  IF OLD.last_sign_in_at IS NULL AND NEW.last_sign_in_at IS NOT NULL THEN
    UPDATE public.farmacias
    SET account_status = 'active'
    WHERE user_id = NEW.id AND account_status = 'invited';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para atualizar status automaticamente
DROP TRIGGER IF EXISTS trigger_update_pharmacy_status ON auth.users;
CREATE TRIGGER trigger_update_pharmacy_status
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pharmacy_status_on_first_login();