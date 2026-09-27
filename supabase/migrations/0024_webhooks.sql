-- Code Sellers — Webhook de verdade
-- Execute este arquivo no Supabase SQL Editor (pode rodar mais de uma vez).
--
-- Quando algo acontece (contato criado, negócio criado ou ganho, tarefa
-- concluída), o banco chama a função webhook-dispatch — só se o usuário tem
-- o Webhook conectado e marcou aquele evento. A função monta os dados, assina
-- com o segredo do usuário e manda para a URL dele. Cada tentativa fica
-- registrada em webhook_deliveries para o usuário ver nas Configurações.

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  status_code integer,
  ok boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists webhook_deliveries_user_created_idx
  on public.webhook_deliveries(user_id, created_at desc);

alter table public.webhook_deliveries enable row level security;
drop policy if exists "webhook_deliveries: dono lê" on public.webhook_deliveries;
create policy "webhook_deliveries: dono lê"
  on public.webhook_deliveries for select
  using ((select auth.uid()) = user_id);

-- Chama a função só quando há webhook ligado para o evento. O pg_net envia
-- depois do commit (se a operação for desfeita, nada é enviado).
create or replace function public.queue_webhook(p_user_id uuid, p_event text, p_record_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.integrations i
    where i.user_id = p_user_id
      and i.type = 'webhook'
      and i.status = 'connected'
      and coalesce(i.config -> 'events', '[]'::jsonb) ? p_event
  ) then
    return;
  end if;

  perform net.http_post(
    url := 'https://mfzlwynqjbusyudstdds.supabase.co/functions/v1/webhook-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select value from public.app_config where key = 'cron_secret')
    ),
    body := jsonb_build_object('action', 'deliver', 'user_id', p_user_id, 'event', p_event, 'record_id', p_record_id),
    timeout_milliseconds := 15000
  );
end;
$$;

revoke all on function public.queue_webhook(uuid, text, uuid) from public, anon, authenticated;

create or replace function public.webhook_on_contact_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.queue_webhook(new.user_id, 'contact.created', new.id);
  return new;
end;
$$;

create or replace function public.webhook_on_deal_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.queue_webhook(new.user_id, 'deal.created', new.id);
  return new;
end;
$$;

create or replace function public.webhook_on_deal_won()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'won' and old.status is distinct from 'won' then
    perform public.queue_webhook(new.user_id, 'deal.won', new.id);
  end if;
  return new;
end;
$$;

create or replace function public.webhook_on_task_done()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'done' and old.status is distinct from 'done' then
    perform public.queue_webhook(new.user_id, 'task.completed', new.id);
  end if;
  return new;
end;
$$;

revoke all on function public.webhook_on_contact_insert() from public, anon, authenticated;
revoke all on function public.webhook_on_deal_insert() from public, anon, authenticated;
revoke all on function public.webhook_on_deal_won() from public, anon, authenticated;
revoke all on function public.webhook_on_task_done() from public, anon, authenticated;

drop trigger if exists contacts_webhook_created on public.contacts;
create trigger contacts_webhook_created
  after insert on public.contacts
  for each row execute function public.webhook_on_contact_insert();

drop trigger if exists deals_webhook_created on public.deals;
create trigger deals_webhook_created
  after insert on public.deals
  for each row execute function public.webhook_on_deal_insert();

drop trigger if exists deals_webhook_won on public.deals;
create trigger deals_webhook_won
  after update of status on public.deals
  for each row execute function public.webhook_on_deal_won();

drop trigger if exists tasks_webhook_completed on public.tasks;
create trigger tasks_webhook_completed
  after update of status on public.tasks
  for each row execute function public.webhook_on_task_done();
