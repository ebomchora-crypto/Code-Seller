-- Code Sellers — Área do aluno: respostas dos exercícios de cada lição
-- (o nicho escolhido, a frase de promessa, a primeira mensagem…). Ficam
-- salvas para o aluno voltar e continuar de onde parou.

create table if not exists public.academy_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null check (char_length(lesson_id) <= 120),
  answer text not null default '' check (char_length(answer) <= 4000),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.academy_answers enable row level security;
drop policy if exists "academy_answers: acesso do próprio usuário" on public.academy_answers;
create policy "academy_answers: acesso do próprio usuário"
  on public.academy_answers for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.academy_answers from anon;
grant select, insert, update, delete on public.academy_answers to authenticated;
