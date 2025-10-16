-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'farmacia');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add farmacia_id to farmacias table to link with auth
ALTER TABLE public.farmacias ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add subscription fields to farmacias
ALTER TABLE public.farmacias ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'free';
ALTER TABLE public.farmacias ADD COLUMN IF NOT EXISTS status_assinatura TEXT DEFAULT 'ativa';
ALTER TABLE public.farmacias ADD COLUMN IF NOT EXISTS data_vencimento TIMESTAMP WITH TIME ZONE;

-- Update RLS for farmacias
DROP POLICY IF EXISTS "Permitir leitura pública de farmácias" ON public.farmacias;
CREATE POLICY "Permitir leitura pública de farmácias ativas"
ON public.farmacias
FOR SELECT
USING (ativa = true);

CREATE POLICY "Farmácias podem atualizar seus dados"
ON public.farmacias
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar todas farmácias"
ON public.farmacias
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to create farmacia profile after signup
CREATE OR REPLACE FUNCTION public.handle_farmacia_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign farmacia role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'farmacia');
  RETURN NEW;
END;
$$;

-- Trigger for auto-assigning farmacia role
DROP TRIGGER IF EXISTS on_auth_user_created_farmacia ON auth.users;
CREATE TRIGGER on_auth_user_created_farmacia
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_farmacia_signup();