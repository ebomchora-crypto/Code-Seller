-- Code Sellers — Configuração do servidor e agendamento das notificações
-- (já aplicado no projeto; pode rodar mais de uma vez)
--
-- app_config guarda configuração que só as Edge Functions leem (service role):
-- segredo do cron, chaves VAPID (geradas pela própria função na primeira
-- chamada) e, se quiser, a chave do Buyers Hunter. RLS ligado e sem
-- políticas: anon/authenticated não leem nada.

create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;

insert into public.app_config (key, value)
values ('cron_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

alter function public.set_deal_won_at() set search_path = '';
alter function public.reset_task_reminder_sent() set search_path = '';
