-- Remove todas as políticas problemáticas de user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;

-- Política simples: usuários autenticados podem ver todas as roles
-- (necessário para as funções security definer funcionarem)
CREATE POLICY "Authenticated users can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Política: apenas usuários podem inserir sua própria role
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Políticas de UPDATE e DELETE: só via service_role ou triggers
-- Não permitimos UPDATE/DELETE direto para evitar escalação de privilégios