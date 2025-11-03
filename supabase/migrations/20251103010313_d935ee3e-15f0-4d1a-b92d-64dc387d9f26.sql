-- Modify the handle_new_user_role function to auto-confirm admin emails
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is an admin signup
  IF NEW.raw_user_meta_data->>'is_admin' = 'true' THEN
    -- Auto-confirm admin email
    UPDATE auth.users
    SET email_confirmed_at = now(),
        confirmed_at = now()
    WHERE id = NEW.id;
    
    -- Insert admin role
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