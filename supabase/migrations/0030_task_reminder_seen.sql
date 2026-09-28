-- Code Sellers — aviso de lembrete na tela aparece uma vez só.
-- Execute este arquivo no Supabase SQL Editor (pode rodar mais de uma vez).
--
-- Antes, cada vez que o site abria, os lembretes das últimas 24h apareciam de
-- novo. Agora o site marca quando mostrou; mudar o horário do lembrete libera
-- o aviso outra vez (mesma regra do lembrete enviado por notificação).

alter table public.tasks add column if not exists reminder_seen_at timestamptz;

create or replace function public.reset_task_reminder_sent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reminder_at is distinct from old.reminder_at then
    new.reminder_sent_at := null;
    new.reminder_seen_at := null;
  end if;
  return new;
end;
$$;
