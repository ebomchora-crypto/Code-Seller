-- Code Sellers — Corrige o cadastro de novos usuários (inclusive via Google)
-- Execute este arquivo completo no Supabase SQL Editor.
--
-- Quem insere em auth.users é o papel supabase_auth_admin, cujo search_path
-- é só "auth". Como handle_new_user() usava nomes de tabela sem schema
-- (user_profiles, pipeline_stages...), o Postgres procurava auth.user_profiles,
-- a função falhava e o Supabase devolvia "Database error saving new user".
-- Agora o search_path é fixo e toda tabela leva o schema public.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Cadastro por e-mail manda full_name; o Google manda full_name/name e
  -- avatar_url/picture.
  insert into public.user_profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.pipeline_stages (user_id, name, color, position, default_probability, is_won, is_lost)
  values
    (new.id, 'Contato', '#a855f7', 0, 10, false, false),
    (new.id, 'Qualificado', '#6366f1', 1, 25, false, false),
    (new.id, 'Proposta', '#3b82f6', 2, 50, false, false),
    (new.id, 'Negociação', '#f59e0b', 3, 70, false, false),
    (new.id, 'Fechamento', '#10b981', 4, 90, false, false),
    (new.id, 'Ganho', '#22c55e', 5, 100, true, false),
    (new.id, 'Perdido', '#ef4444', 6, 0, false, true);

  insert into public.crm_statuses (user_id, name, color, position, is_default)
  values
    (new.id, 'Lead', '#a855f7', 0, true),
    (new.id, 'Negociando', '#f59e0b', 1, false),
    (new.id, 'Cliente', '#22c55e', 2, false),
    (new.id, 'Inativo', '#9ca3af', 3, false),
    (new.id, 'Perdido', '#ef4444', 4, false);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usuários que já existiam antes do trigger ficam com perfil e preferências.
insert into public.user_profiles (id, full_name)
select id, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name')
from auth.users
on conflict (id) do nothing;

insert into public.notification_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;
