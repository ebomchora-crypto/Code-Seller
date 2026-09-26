-- Code Sellers — Buyers Hunter (prospecção)
-- Execute este arquivo no Supabase SQL Editor.
--
-- Os resultados das buscas NÃO são gravados no banco: a Edge Function
-- buyers-hunter devolve as empresas direto para a tela. Aqui ficam só o
-- histórico de buscas (que também serve de contador do limite mensal), as
-- empresas que o usuário escolheu ignorar e o vínculo contato ↔ empresa,
-- para a tela saber quem já está no CRM.

-- Histórico de buscas. Só a Edge Function (service role) insere; o usuário
-- apenas lê as próprias — assim ninguém apaga linhas para zerar o limite.
create table prospect_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  niche text not null,
  city text not null,
  offer text,
  results_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index prospect_searches_user_created_idx on prospect_searches(user_id, created_at desc);

alter table prospect_searches enable row level security;
create policy "prospect_searches: leitura do próprio usuário"
  on prospect_searches for select
  using (auth.uid() = user_id);

-- Empresas que o usuário marcou como "ignorar" (somem das próximas buscas).
create table prospect_dismissed (
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

alter table prospect_dismissed enable row level security;
create policy "prospect_dismissed: acesso do próprio usuário"
  on prospect_dismissed for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Identificador da empresa de origem, para marcar "Já está no CRM" e evitar
-- importar a mesma empresa duas vezes.
alter table contacts add column if not exists place_id text;
create unique index if not exists contacts_user_place_id_idx
  on contacts(user_id, place_id)
  where place_id is not null;
