-- Code Sellers — Módulo Negócios
-- Execute este arquivo completo no Supabase SQL Editor.
-- A tabela `deals` já existe (criada em 0002_crm.sql) — aqui só expandimos com ALTER TABLE.

-- =========================================
-- Expandir tabela deals existente
-- =========================================

alter table deals
  add column if not exists stage text not null default 'contact'
    check (stage in ('contact', 'qualified', 'proposal', 'negotiation', 'closing', 'won', 'lost')),
  add column if not exists probability integer default 0
    check (probability >= 0 and probability <= 100),
  add column if not exists expected_close_date date,
  add column if not exists service text,
  add column if not exists notes text,
  add column if not exists origin text,
  add column if not exists proposal_url text;

-- =========================================
-- Nova tabela deal_activities
-- =========================================

create table deal_activities (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null
    check (type in ('note', 'call', 'email', 'whatsapp', 'meeting', 'stage_change', 'proposal_sent', 'other')),
  content text not null,
  metadata jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index deal_activities_deal_id_idx on deal_activities(deal_id);

-- =========================================
-- RLS de deal_activities
-- =========================================

alter table deal_activities enable row level security;

create policy "deal_activities: acesso do próprio usuário"
  on deal_activities for all
  using (auth.uid() = user_id);

-- =========================================
-- Trigger de updated_at para deals
-- O trigger já foi criado em 0002_crm.sql. Postgres não suporta
-- "CREATE TRIGGER IF NOT EXISTS" (isso é sintaxe do MySQL) — usamos
-- um bloco DO que checa pg_trigger antes de criar, para este SQL
-- também poder ser rodado em bancos que ainda não têm o trigger.
-- =========================================

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'deals_updated_at'
  ) then
    create trigger deals_updated_at
      before update on deals
      for each row execute function update_updated_at();
  end if;
end $$;

-- =========================================
-- Supabase Storage — bucket de propostas
-- =========================================

insert into storage.buckets (id, name, public)
values ('proposals', 'proposals', false)
on conflict (id) do nothing;

-- Cada usuário só acessa arquivos dentro da própria pasta (prefixo = seu user_id).
-- Caminho esperado: proposals/{user_id}/{deal_id}/{filename}

create policy "proposals: upload do próprio usuário"
  on storage.objects for insert
  with check (
    bucket_id = 'proposals'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "proposals: leitura do próprio usuário"
  on storage.objects for select
  using (
    bucket_id = 'proposals'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "proposals: delete do próprio usuário"
  on storage.objects for delete
  using (
    bucket_id = 'proposals'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
