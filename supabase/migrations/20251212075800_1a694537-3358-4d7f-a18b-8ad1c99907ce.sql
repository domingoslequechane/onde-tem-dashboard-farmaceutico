-- Fix infinite recursion in user_roles RLS policy
-- The current policy queries the same table it protects, causing recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Super-admins can manage all roles" ON public.user_roles;

-- Recreate using the SECURITY DEFINER function which bypasses RLS
CREATE POLICY "Super-admins can manage all roles" ON public.user_roles
FOR ALL 
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));