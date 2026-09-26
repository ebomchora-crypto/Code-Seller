-- Code Sellers — Área do aluno: progresso de cada aluno
-- Execute no Supabase SQL Editor (pode rodar mais de uma vez).
--
-- O conteúdo (lições, prompts, scripts) vive no código do app. Aqui fica só o
-- que cada aluno marcou como feito: 'lesson:<id>' para lição concluída e
-- 'check:<id>:<n>' para cada item do checklist.

create table if not exists public.academy_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null check (char_length(item_id) <= 120),
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.academy_progress enable row level security;
drop policy if exists "academy_progress: acesso do próprio usuário" on public.academy_progress;
create policy "academy_progress: acesso do próprio usuário"
  on public.academy_progress for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
