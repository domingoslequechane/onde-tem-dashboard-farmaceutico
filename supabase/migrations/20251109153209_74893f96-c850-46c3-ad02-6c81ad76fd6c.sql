-- Função para criar role de admin automaticamente após signup
create or replace function public.handle_admin_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verificar se o usuário tem metadata indicando que é admin
  if new.raw_user_meta_data->>'is_admin' = 'true' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin'::app_role)
    on conflict (user_id, role) do nothing;
  end if;
  
  return new;
end;
$$;

-- Trigger para executar a função após criar um novo usuário
drop trigger if exists on_admin_user_created on auth.users;
create trigger on_admin_user_created
  after insert on auth.users
  for each row execute function public.handle_admin_signup();