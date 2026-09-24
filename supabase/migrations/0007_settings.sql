-- Code Sellers — Módulo Configurações
-- Execute este arquivo completo no Supabase SQL Editor.

-- =========================================
-- Tabelas
-- =========================================

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  company_name text,
  company_logo_url text,
  website text,
  bio text,
  timezone text not null default 'America/Sao_Paulo',
  language text not null default 'pt-BR',
  theme text not null default 'light'
    check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Etapas de pipeline customizáveis.
-- TODO: migrar deals.stage para referenciar pipeline_stages.id em versão
-- futura. Por ora, o pipeline em produção continua usando as etapas fixas de
-- src/utils/deals.ts — esta tabela só prepara a personalização futura.
create table pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#a855f7',
  position integer not null default 0,
  default_probability integer not null default 0
    check (default_probability >= 0 and default_probability <= 100),
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz not null default now()
);

-- Status de contato customizáveis.
-- TODO: migrar contacts.status para referenciar crm_statuses.id em versão
-- futura. Por ora, o CRM em produção continua usando os status fixos de
-- src/types/crm.ts — esta tabela só prepara a personalização futura.
create table crm_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#a855f7',
  position integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_reminders boolean not null default true,
  deal_updates boolean not null default true,
  contact_updates boolean not null default false,
  financial_alerts boolean not null default true,
  overdue_tasks boolean not null default true,
  stalled_deals boolean not null default true,
  weekly_summary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null
    check (type in ('whatsapp', 'google_calendar', 'google_contacts', 'zapier', 'webhook')),
  status text not null default 'disconnected'
    check (status in ('connected', 'disconnected', 'error')),
  config jsonb,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, type)
);

-- =========================================
-- Triggers de updated_at
-- =========================================

create trigger user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at();

create trigger notification_preferences_updated_at
  before update on notification_preferences
  for each row execute function update_updated_at();

create trigger integrations_updated_at
  before update on integrations
  for each row execute function update_updated_at();

-- =========================================
-- Row Level Security
-- =========================================

alter table user_profiles enable row level security;
create policy "user_profiles: acesso do próprio usuário"
  on user_profiles for all
  using (auth.uid() = id);

alter table pipeline_stages enable row level security;
create policy "pipeline_stages: acesso do próprio usuário"
  on pipeline_stages for all
  using (auth.uid() = user_id);

alter table crm_statuses enable row level security;
create policy "crm_statuses: acesso do próprio usuário"
  on crm_statuses for all
  using (auth.uid() = user_id);

alter table notification_preferences enable row level security;
create policy "notification_preferences: acesso do próprio usuário"
  on notification_preferences for all
  using (auth.uid() = user_id);

alter table integrations enable row level security;
create policy "integrations: acesso do próprio usuário"
  on integrations for all
  using (auth.uid() = user_id);

-- =========================================
-- Supabase Storage — bucket de avatares (público)
-- =========================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars: upload do próprio usuário"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: atualização do próprio usuário"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: delete do próprio usuário"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: leitura pública"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- =========================================
-- Função: cria perfil, preferências de notificação e etapas/status padrão
-- automaticamente ao registrar um novo usuário.
-- =========================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');

  insert into notification_preferences (user_id)
  values (new.id);

  insert into pipeline_stages (user_id, name, color, position, default_probability, is_won, is_lost)
  values
    (new.id, 'Contato', '#a855f7', 0, 10, false, false),
    (new.id, 'Qualificado', '#6366f1', 1, 25, false, false),
    (new.id, 'Proposta', '#3b82f6', 2, 50, false, false),
    (new.id, 'Negociação', '#f59e0b', 3, 70, false, false),
    (new.id, 'Fechamento', '#10b981', 4, 90, false, false),
    (new.id, 'Ganho', '#22c55e', 5, 100, true, false),
    (new.id, 'Perdido', '#ef4444', 6, 0, false, true);

  insert into crm_statuses (user_id, name, color, position, is_default)
  values
    (new.id, 'Lead', '#a855f7', 0, true),
    (new.id, 'Negociando', '#f59e0b', 1, false),
    (new.id, 'Cliente', '#22c55e', 2, false),
    (new.id, 'Inativo', '#9ca3af', 3, false),
    (new.id, 'Perdido', '#ef4444', 4, false);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
