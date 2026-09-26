-- Code Sellers — Notificações no celular, meta do mês e primeiros passos
-- Execute este arquivo no Supabase SQL Editor (pode rodar mais de uma vez).

-- =========================================
-- Meta do mês e primeiros passos
-- =========================================
alter table user_profiles add column if not exists monthly_goal numeric(12,2);
alter table user_profiles add column if not exists onboarding_dismissed_at timestamptz;

-- =========================================
-- Notificações (push) — um registro por aparelho/navegador ativado
-- =========================================
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;
drop policy if exists "push_subscriptions: acesso do próprio usuário" on push_subscriptions;
create policy "push_subscriptions: acesso do próprio usuário"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Resumo diário (horário local do perfil) e controle do que já foi enviado.
alter table notification_preferences add column if not exists daily_summary boolean not null default true;
alter table notification_preferences add column if not exists daily_summary_hour smallint not null default 8
  check (daily_summary_hour between 0 and 23);
alter table notification_preferences add column if not exists last_daily_summary_on date;
alter table notification_preferences add column if not exists last_weekly_summary_on date;

-- Lembrete de tarefa enviado uma vez; mudar o horário do lembrete libera de novo.
alter table tasks add column if not exists reminder_sent_at timestamptz;

create or replace function reset_task_reminder_sent()
returns trigger
language plpgsql
as $$
begin
  if new.reminder_at is distinct from old.reminder_at then
    new.reminder_sent_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_reset_reminder_sent on tasks;
create trigger tasks_reset_reminder_sent
  before update of reminder_at on tasks
  for each row execute function reset_task_reminder_sent();

create index if not exists tasks_pending_reminder_idx on tasks(reminder_at)
  where reminder_sent_at is null and reminder_at is not null;
