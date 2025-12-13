-- Create function to delete messages older than 7 days
CREATE OR REPLACE FUNCTION public.delete_old_support_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.suporte_mensagens
  WHERE criado_em < NOW() - INTERVAL '7 days';
END;
$$;