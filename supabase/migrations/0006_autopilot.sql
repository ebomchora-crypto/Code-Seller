-- Code Sellers — Módulo AutoPilot
-- Execute este arquivo completo no Supabase SQL Editor.

-- =========================================
-- Tabelas
-- =========================================

create table autopilot_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table autopilot_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references autopilot_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  actions jsonb, -- ações propostas pela IA nesta mensagem
  created_at timestamptz not null default now()
);

-- =========================================
-- Índices de apoio
-- =========================================

create index autopilot_conversations_user_id_idx on autopilot_conversations(user_id, updated_at desc);
create index autopilot_messages_conversation_id_idx on autopilot_messages(conversation_id, created_at);

-- =========================================
-- Trigger de updated_at
-- =========================================

create trigger autopilot_conversations_updated_at
  before update on autopilot_conversations
  for each row execute function update_updated_at();

-- =========================================
-- Row Level Security
-- =========================================

alter table autopilot_conversations enable row level security;
create policy "autopilot_conversations: acesso do próprio usuário"
  on autopilot_conversations for all
  using (auth.uid() = user_id);

alter table autopilot_messages enable row level security;
create policy "autopilot_messages: acesso do próprio usuário"
  on autopilot_messages for all
  using (auth.uid() = user_id);
