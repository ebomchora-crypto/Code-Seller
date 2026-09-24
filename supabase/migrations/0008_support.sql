-- Módulo Suporte: chamados (tickets) e chat assíncrono com a equipe do Code Sellers.

-- Redeclarada aqui (idempotente via create or replace) porque essa migration
-- pode ser executada isoladamente em bancos onde 0002_crm.sql — que já define
-- essa mesma função — não tenha sido aplicada ainda.
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null
    check (category in ('bug', 'feature', 'billing', 'account', 'other')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  response text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists support_tickets_updated_at on support_tickets;
create trigger support_tickets_updated_at
  before update on support_tickets
  for each row execute function update_updated_at();

alter table support_tickets enable row level security;
drop policy if exists "support_tickets: acesso do próprio usuário" on support_tickets;
create policy "support_tickets: acesso do próprio usuário"
  on support_tickets for all
  using (auth.uid() = user_id);

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticket_id uuid references support_tickets(id) on delete set null,
  content text not null,
  from_user boolean not null default true,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table support_messages enable row level security;
drop policy if exists "support_messages: acesso do próprio usuário" on support_messages;
create policy "support_messages: acesso do próprio usuário"
  on support_messages for all
  using (auth.uid() = user_id);

-- Força o PostgREST a recarregar o cache de schema imediatamente, sem
-- depender de reload automático — evita o erro "Could not find the table
-- ... in the schema cache" logo após criar tabelas novas via SQL Editor.
notify pgrst, 'reload schema';
