-- Drop existing problematic policies on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;

-- Drop existing functions with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_user_blocked(uuid) CASCADE;

-- Create security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- Create security definer function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocked_users
    WHERE user_id = _user_id
  )
$$;

-- Recreate RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_super_admin(auth.uid()));

-- Recreate RLS policies for other tables

-- clientes table
CREATE POLICY "Users can view their own data"
ON public.clientes
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can manage all clients"
ON public.clientes
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- consultas table
CREATE POLICY "Users can view own consultations"
ON public.consultas
FOR SELECT
USING (auth.uid() = cliente_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Pharmacies can view consultations"
ON public.consultas
FOR SELECT
USING (public.has_role(auth.uid(), 'farmacia'));

-- estoque table
CREATE POLICY "Pharmacies manage own inventory"
ON public.estoque
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.farmacias
    WHERE farmacias.id = estoque.farmacia_id
    AND farmacias.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

-- medicamentos table
CREATE POLICY "Pharmacies and admins manage medicines"
ON public.medicamentos
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'farmacia') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Pharmacies and admins update medicines"
ON public.medicamentos
FOR UPDATE
USING (public.has_role(auth.uid(), 'farmacia') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Pharmacies and admins delete medicines"
ON public.medicamentos
FOR DELETE
USING (public.has_role(auth.uid(), 'farmacia') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- farmacias table
CREATE POLICY "Admins and super-admins can manage pharmacies"
ON public.farmacias
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));