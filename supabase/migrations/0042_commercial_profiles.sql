-- Perfil comercial: o que o usuário vende, pacotes e preços, diferenciais,
-- nichos, resultados, mensagens que funcionaram e jeito de escrever.
-- O CS Copilot usa isso para responder como o próprio usuário.

create table if not exists public.commercial_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  services text not null default '' check (char_length(services) <= 1500),
  packages jsonb not null default '[]'::jsonb
    check (jsonb_typeof(packages) = 'array' and jsonb_array_length(packages) <= 6),
  differentials text not null default '' check (char_length(differentials) <= 1500),
  niches text not null default '' check (char_length(niches) <= 800),
  results text not null default '' check (char_length(results) <= 1500),
  winning_messages text not null default '' check (char_length(winning_messages) <= 6000),
  writing_style text not null default '' check (char_length(writing_style) <= 800),
  signature text not null default '' check (char_length(signature) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.commercial_profiles enable row level security;

drop policy if exists "commercial_profiles: acesso do próprio usuário" on public.commercial_profiles;
create policy "commercial_profiles: acesso do próprio usuário"
  on public.commercial_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists commercial_profiles_updated_at on public.commercial_profiles;
create trigger commercial_profiles_updated_at
  before update on public.commercial_profiles
  for each row execute function update_updated_at();
