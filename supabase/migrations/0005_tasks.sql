-- Code Sellers — Módulo Tarefas
-- Execute este arquivo completo no Supabase SQL Editor.

-- =========================================
-- Tabelas
-- =========================================

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done', 'cancelled')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date timestamptz,
  reminder_at timestamptz,
  contact_id uuid references contacts(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  recurrence text default 'none'
    check (recurrence in ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  recurrence_end_date date,
  parent_task_id uuid references tasks(id) on delete cascade,
  position integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reutiliza a tabela tags já existente do módulo CRM.
create table task_tags (
  task_id uuid not null references tasks(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

-- =========================================
-- Índices de apoio
-- =========================================

create index tasks_user_id_status_idx on tasks(user_id, status);
create index tasks_user_id_due_date_idx on tasks(user_id, due_date);
create index tasks_parent_task_id_idx on tasks(parent_task_id);
create index tasks_contact_id_idx on tasks(contact_id);
create index tasks_deal_id_idx on tasks(deal_id);

-- =========================================
-- Trigger de updated_at
-- =========================================

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

-- =========================================
-- Row Level Security
-- =========================================

alter table tasks enable row level security;

create policy "tasks: acesso do próprio usuário"
  on tasks for all
  using (auth.uid() = user_id);

alter table task_tags enable row level security;

create policy "task_tags: acesso via task"
  on task_tags for all
  using (
    exists (
      select 1 from tasks
      where tasks.id = task_tags.task_id
        and tasks.user_id = auth.uid()
    )
  );
