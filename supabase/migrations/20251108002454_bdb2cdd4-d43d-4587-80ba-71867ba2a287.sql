-- Add email whitelisting to admin auto-confirmation
-- This prevents unauthorized admin account creation

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Define whitelisted admin email addresses
  admin_whitelist TEXT[] := ARRAY[
    'admin@onixagence.com',
    'admin@ondetem.com.br'
  ];
BEGIN
  -- Check if this is an admin signup with whitelisted email
  IF NEW.raw_user_meta_data->>'is_admin' = 'true' AND 
     NEW.email = ANY(admin_whitelist) THEN
    -- Auto-confirm admin email only for whitelisted addresses
    UPDATE auth.users
    SET email_confirmed_at = now(),
        confirmed_at = now()
    WHERE id = NEW.id;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NEW.raw_user_meta_data->>'is_admin' = 'true' THEN
    -- If is_admin is set but email not whitelisted, grant farmacia role instead
    -- This prevents unauthorized admin creation
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'farmacia'::app_role)
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