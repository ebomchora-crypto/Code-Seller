-- Code Sellers — Módulo CRM
-- Execute este arquivo completo no Supabase SQL Editor.

-- =========================================
-- Tabelas
-- =========================================

create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  niche text,
  city text,
  state text,
  status text not null default 'lead'
    check (status in ('lead', 'negotiating', 'client', 'inactive', 'lost')),
  origin text,
  notes text,
  current_site text,
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#a855f7',
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table contact_tags (
  contact_id uuid not null references contacts(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (contact_id, tag_id)
);

create table interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null
    check (type in ('note', 'call', 'email', 'whatsapp', 'meeting', 'proposal', 'other')),
  content text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Estrutura mínima; será expandida no prompt do módulo Negócios.
create table deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  title text not null,
  value numeric(12,2),
  status text not null default 'open'
    check (status in ('open', 'won', 'lost', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================
-- Índices de apoio
-- =========================================

create index contacts_user_id_idx on contacts(user_id);
create index contacts_status_idx on contacts(user_id, status);
create index tags_user_id_idx on tags(user_id);
create index interactions_contact_id_idx on interactions(contact_id);
create index deals_contact_id_idx on deals(contact_id);
create index deals_user_id_idx on deals(user_id);

-- =========================================
-- Triggers de updated_at
-- =========================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contacts_updated_at
  before update on contacts
  for each row execute function update_updated_at();

create trigger deals_updated_at
  before update on deals
  for each row execute function update_updated_at();

-- =========================================
-- Row Level Security
-- =========================================

alter table contacts enable row level security;
create policy "contacts: acesso do próprio usuário"
  on contacts for all
  using (auth.uid() = user_id);

alter table tags enable row level security;
create policy "tags: acesso do próprio usuário"
  on tags for all
  using (auth.uid() = user_id);

alter table contact_tags enable row level security;
create policy "contact_tags: acesso via contact"
  on contact_tags for all
  using (
    exists (
      select 1 from contacts
      where contacts.id = contact_tags.contact_id
        and contacts.user_id = auth.uid()
    )
  );

alter table interactions enable row level security;
create policy "interactions: acesso do próprio usuário"
  on interactions for all
  using (auth.uid() = user_id);

alter table deals enable row level security;
create policy "deals: acesso do próprio usuário"
  on deals for all
  using (auth.uid() = user_id);
