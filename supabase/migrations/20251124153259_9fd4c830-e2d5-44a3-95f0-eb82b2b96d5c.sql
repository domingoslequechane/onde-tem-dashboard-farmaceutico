-- Create deletion_codes table for storing verification codes
CREATE TABLE IF NOT EXISTS public.deletion_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS
ALTER TABLE public.deletion_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage their own codes
CREATE POLICY "Admins can manage their own codes"
ON public.deletion_codes
FOR ALL
USING (auth.uid() = admin_id)
WITH CHECK (auth.uid() = admin_id);

-- Create index for faster lookups
CREATE INDEX idx_deletion_codes_admin_id ON public.deletion_codes(admin_id);
CREATE INDEX idx_deletion_codes_expires_at ON public.deletion_codes(expires_at);

-- Create function to automatically delete expired codes
CREATE OR REPLACE FUNCTION delete_expired_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.deletion_codes
  WHERE expires_at < now();
END;
$$;