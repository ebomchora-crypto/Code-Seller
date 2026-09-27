-- Code Sellers — Agenda das tarefas (link para Google Agenda, Outlook e iPhone)
-- Execute este arquivo no Supabase SQL Editor (pode rodar mais de uma vez).
--
-- Cada usuário tem um link secreto que devolve as tarefas com prazo no formato
-- de agenda (.ics). O link é lido pela função calendar-feed (sem login, pois o
-- Google busca a agenda sozinho) e só funciona com o token certo. Gerar um
-- novo token desativa o link antigo.

create table if not exists public.calendar_feeds (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);

-- Sem políticas: ninguém lê ou escreve direto pela API. O token só sai pelas
-- funções abaixo (sempre do próprio usuário logado) e é lido pela função do
-- servidor com a chave de serviço.
alter table public.calendar_feeds enable row level security;

-- Token de 64 caracteres hexadecimais (dois UUID v4 aleatórios).
create or replace function public.get_calendar_feed_token()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  current_token text;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  select token into current_token from public.calendar_feeds where user_id = uid;
  if current_token is not null then
    return current_token;
  end if;

  insert into public.calendar_feeds (user_id, token)
  values (uid, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  on conflict (user_id) do nothing;

  select token into current_token from public.calendar_feeds where user_id = uid;
  return current_token;
end;
$$;

create or replace function public.regenerate_calendar_feed_token()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  new_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.calendar_feeds (user_id, token)
  values (uid, new_token)
  on conflict (user_id) do update set token = excluded.token, created_at = now();

  return new_token;
end;
$$;

revoke all on function public.get_calendar_feed_token() from public, anon;
revoke all on function public.regenerate_calendar_feed_token() from public, anon;
grant execute on function public.get_calendar_feed_token() to authenticated;
grant execute on function public.regenerate_calendar_feed_token() to authenticated;
