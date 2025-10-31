
-- Drop the duplicate triggers
DROP TRIGGER IF EXISTS on_auth_user_created_farmacia ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the old functions
DROP FUNCTION IF EXISTS handle_farmacia_signup();
DROP FUNCTION IF EXISTS handle_new_user_signup();

-- Create a single, improved function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert if role doesn't exist yet (prevents duplicates)
  -- Check metadata for admin flag or default to farmacia role
  IF NEW.raw_user_meta_data->>'is_admin' = 'true' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Default role for pharmacy users
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'farmacia'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();
