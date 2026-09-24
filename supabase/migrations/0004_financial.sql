-- Code Sellers — Módulo Financeiro
-- Execute este arquivo completo no Supabase SQL Editor.

-- =========================================
-- Tabelas
-- =========================================

create table financial_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null default '#a855f7',
  icon text,
  created_at timestamptz not null default now(),
  unique(user_id, name, type)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'overdue', 'cancelled')),
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  date date not null,
  due_date date,
  paid_at timestamptz,
  category_id uuid references financial_categories(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  payment_method text
    check (payment_method in ('pix', 'boleto', 'credit_card', 'debit_card', 'transfer', 'cash', 'other')),
  recurrence text
    check (recurrence in ('none', 'monthly', 'quarterly', 'yearly')),
  recurrence_end_date date,
  receipt_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contas a receber (deals ganhos ainda não pagos)
create table receivables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references deals(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  due_date date,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'overdue', 'cancelled')),
  paid_at timestamptz,
  transaction_id uuid references transactions(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Nota sobre a criação automática de receivables: quando um deal muda para
-- status 'won' no módulo Negócios, um registro em receivables é criado a
-- partir do FRONTEND (em src/services/supabase/deals.ts), por simplicidade
-- neste MVP. Em produção, isso deveria ser um trigger PostgreSQL ou uma
-- Supabase Edge Function, para garantir consistência mesmo em atualizações
-- feitas diretamente no banco (fora do frontend).

-- =========================================
-- Índices de apoio
-- =========================================

create index transactions_user_id_idx on transactions(user_id);
create index transactions_date_idx on transactions(user_id, date);
create index transactions_status_idx on transactions(user_id, status);
create index transactions_contact_id_idx on transactions(contact_id);
create index transactions_deal_id_idx on transactions(deal_id);
create index receivables_user_id_idx on receivables(user_id);
create index receivables_deal_id_idx on receivables(deal_id);
create index receivables_status_idx on receivables(user_id, status);
create index financial_categories_user_id_idx on financial_categories(user_id);

-- =========================================
-- Triggers de updated_at
-- =========================================

create trigger transactions_updated_at
  before update on transactions
  for each row execute function update_updated_at();

create trigger receivables_updated_at
  before update on receivables
  for each row execute function update_updated_at();

-- =========================================
-- Row Level Security
-- =========================================

alter table financial_categories enable row level security;
create policy "financial_categories: acesso do próprio usuário"
  on financial_categories for all
  using (auth.uid() = user_id);

alter table transactions enable row level security;
create policy "transactions: acesso do próprio usuário"
  on transactions for all
  using (auth.uid() = user_id);

alter table receivables enable row level security;
create policy "receivables: acesso do próprio usuário"
  on receivables for all
  using (auth.uid() = user_id);

-- =========================================
-- Supabase Storage — bucket de comprovantes
-- =========================================

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "receipts: upload do próprio usuário"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "receipts: leitura do próprio usuário"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "receipts: delete do próprio usuário"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =========================================
-- Categorias padrão
-- Rode este bloco substituindo SEU_USER_ID pelo id do seu usuário
-- (Authentication > Users no painel do Supabase), uma vez por usuário.
-- =========================================

-- insert into financial_categories (user_id, name, type, color) values
--   ('SEU_USER_ID', 'Desenvolvimento de Site', 'income', '#22c55e'),
--   ('SEU_USER_ID', 'Landing Page', 'income', '#3b82f6'),
--   ('SEU_USER_ID', 'Loja Virtual', 'income', '#a855f7'),
--   ('SEU_USER_ID', 'Sistema', 'income', '#6366f1'),
--   ('SEU_USER_ID', 'Manutenção', 'income', '#10b981'),
--   ('SEU_USER_ID', 'Hospedagem', 'income', '#f59e0b'),
--   ('SEU_USER_ID', 'Consultoria', 'income', '#ec4899'),
--   ('SEU_USER_ID', 'Outros', 'income', '#71717a'),
--   ('SEU_USER_ID', 'Ferramentas e Software', 'expense', '#ef4444'),
--   ('SEU_USER_ID', 'Hospedagem e Infraestrutura', 'expense', '#f97316'),
--   ('SEU_USER_ID', 'Marketing', 'expense', '#eab308'),
--   ('SEU_USER_ID', 'Impostos', 'expense', '#dc2626'),
--   ('SEU_USER_ID', 'Cursos e Educação', 'expense', '#0ea5e9'),
--   ('SEU_USER_ID', 'Equipamentos', 'expense', '#8b5cf6'),
--   ('SEU_USER_ID', 'Outros', 'expense', '#71717a');

-- Alternativa: função que popula as categorias padrão para o usuário autenticado
-- (chamada uma vez pelo frontend no onboarding, sem precisar editar SQL manualmente).
create or replace function seed_default_financial_categories()
returns void as $$
declare
  uid uuid := auth.uid();
begin
  insert into financial_categories (user_id, name, type, color)
  values
    (uid, 'Desenvolvimento de Site', 'income', '#22c55e'),
    (uid, 'Landing Page', 'income', '#3b82f6'),
    (uid, 'Loja Virtual', 'income', '#a855f7'),
    (uid, 'Sistema', 'income', '#6366f1'),
    (uid, 'Manutenção', 'income', '#10b981'),
    (uid, 'Hospedagem', 'income', '#f59e0b'),
    (uid, 'Consultoria', 'income', '#ec4899'),
    (uid, 'Outros', 'income', '#71717a'),
    (uid, 'Ferramentas e Software', 'expense', '#ef4444'),
    (uid, 'Hospedagem e Infraestrutura', 'expense', '#f97316'),
    (uid, 'Marketing', 'expense', '#eab308'),
    (uid, 'Impostos', 'expense', '#dc2626'),
    (uid, 'Cursos e Educação', 'expense', '#0ea5e9'),
    (uid, 'Equipamentos', 'expense', '#8b5cf6'),
    (uid, 'Outros', 'expense', '#71717a')
  on conflict (user_id, name, type) do nothing;
end;
$$ language plpgsql security definer;
