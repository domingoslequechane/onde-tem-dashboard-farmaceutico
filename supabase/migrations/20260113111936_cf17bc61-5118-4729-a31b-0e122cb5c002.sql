-- Create table to track support requests for async processing
CREATE TABLE public.suporte_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmacia_id UUID REFERENCES public.farmacias(id) ON DELETE CASCADE,
  mensagem_id UUID REFERENCES public.suporte_mensagens(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.suporte_requests ENABLE ROW LEVEL SECURITY;

-- Farmacia users can view their own requests
CREATE POLICY "Farmacias can view their own requests"
ON public.suporte_requests
FOR SELECT
USING (
  farmacia_id IN (
    SELECT id FROM public.farmacias WHERE user_id = auth.uid()
  )
);

-- Farmacia users can insert their own requests
CREATE POLICY "Farmacias can insert their own requests"
ON public.suporte_requests
FOR INSERT
WITH CHECK (
  farmacia_id IN (
    SELECT id FROM public.farmacias WHERE user_id = auth.uid()
  )
);

-- Allow service role to update (for edge functions)
CREATE POLICY "Service role can update requests"
ON public.suporte_requests
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_suporte_requests_farmacia_status 
ON public.suporte_requests(farmacia_id, status);

-- Function to clean old completed requests (older than 24 hours)
CREATE OR REPLACE FUNCTION public.delete_old_support_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.suporte_requests
  WHERE status IN ('completed', 'error')
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;