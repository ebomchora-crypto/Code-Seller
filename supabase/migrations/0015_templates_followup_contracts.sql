-- Code Sellers — Modelos de mensagem, follow-up automático e contratos
-- Execute no Supabase SQL Editor (pode rodar mais de uma vez).

-- =========================================
-- Modelos de mensagem
-- =========================================
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'outro'
    check (category in ('abordagem', 'follow_up', 'proposta', 'cobranca', 'outro')),
  body text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists message_templates_user_idx on public.message_templates(user_id, position);
alter table public.message_templates enable row level security;
drop policy if exists "message_templates: acesso do próprio usuário" on public.message_templates;
create policy "message_templates: acesso do próprio usuário"
  on public.message_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists message_templates_updated_at on public.message_templates;
create trigger message_templates_updated_at
  before update on public.message_templates
  for each row execute function update_updated_at();

-- =========================================
-- Follow-up automático
-- =========================================
alter table public.user_profiles add column if not exists followup_enabled boolean not null default true;
alter table public.user_profiles add column if not exists followup_days smallint[] not null default '{2,5,10}';

-- Passo da sequência (1, 2, 3…) nas tarefas criadas pelo follow-up automático.
alter table public.tasks add column if not exists followup_step smallint;

-- Negócio ganho ou perdido: os follow-ups ainda abertos dele são cancelados.
create or replace function public.cancel_deal_followups()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('won', 'lost') and old.status is distinct from new.status then
    update public.tasks
      set status = 'cancelled'
      where deal_id = new.id
        and followup_step is not null
        and status in ('todo', 'in_progress');
  end if;
  return new;
end;
$$;

drop trigger if exists deals_cancel_followups on public.deals;
create trigger deals_cancel_followups
  after update of status on public.deals
  for each row execute function public.cancel_deal_followups();

-- =========================================
-- Contratos gerados para um negócio
-- =========================================
create table if not exists public.deal_contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  content text not null,
  details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists deal_contracts_deal_idx on public.deal_contracts(deal_id, created_at desc);
alter table public.deal_contracts enable row level security;
drop policy if exists "deal_contracts: acesso do próprio usuário" on public.deal_contracts;
create policy "deal_contracts: acesso do próprio usuário"
  on public.deal_contracts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists deal_contracts_updated_at on public.deal_contracts;
create trigger deal_contracts_updated_at
  before update on public.deal_contracts
  for each row execute function update_updated_at();
