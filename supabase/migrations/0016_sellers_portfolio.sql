-- Code Sellers — Sellers Portfolio (página pública de trabalhos de cada usuário)
-- Execute no Supabase SQL Editor (pode rodar mais de uma vez).
--
-- Cada usuário tem um portfólio com apelido único (link /p/apelido). A página
-- só aparece para o público quando published = true; os dados do CRM nunca
-- saem por aqui — só o que foi cadastrado no portfólio.

create table if not exists public.portfolios (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique
    check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$')
    check (slug not in (
      'admin', 'administrador', 'api', 'app', 'login', 'logout', 'register', 'cadastro', 'entrar',
      'suporte', 'support', 'settings', 'configuracoes', 'codesellers', 'code-sellers', 'code-seller',
      'buyers-hunter', 'buyershunter', 'portfolio', 'sellers-portfolio', 'oficial', 'equipe', 'root', 'null'
    )),
  display_name text not null default '',
  headline text,
  bio text,
  avatar_url text,
  whatsapp text,
  city text,
  published boolean not null default false,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  client_label text,
  category text not null default 'site'
    check (category in ('site', 'landing', 'sistema', 'automacao', 'loja', 'outro')),
  description text,
  url text,
  image_url text,
  testimonial text,
  testimonial_author text,
  deal_id uuid references public.deals(id) on delete set null,
  visible boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists portfolio_projects_user_idx on public.portfolio_projects(user_id, position);

create table if not exists public.portfolio_reports (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  reason text not null check (char_length(reason) between 3 and 1000),
  created_at timestamptz not null default now()
);

drop trigger if exists portfolios_updated_at on public.portfolios;
create trigger portfolios_updated_at
  before update on public.portfolios
  for each row execute function update_updated_at();

drop trigger if exists portfolio_projects_updated_at on public.portfolio_projects;
create trigger portfolio_projects_updated_at
  before update on public.portfolio_projects
  for each row execute function update_updated_at();

-- =========================================
-- RLS
-- =========================================
alter table public.portfolios enable row level security;
drop policy if exists "portfolios: dono gerencia" on public.portfolios;
create policy "portfolios: dono gerencia"
  on public.portfolios for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists "portfolios: público vê publicados" on public.portfolios;
create policy "portfolios: público vê publicados"
  on public.portfolios for select
  to anon, authenticated
  using (published);

alter table public.portfolio_projects enable row level security;
drop policy if exists "portfolio_projects: dono gerencia" on public.portfolio_projects;
create policy "portfolio_projects: dono gerencia"
  on public.portfolio_projects for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists "portfolio_projects: público vê projetos publicados" on public.portfolio_projects;
create policy "portfolio_projects: público vê projetos publicados"
  on public.portfolio_projects for select
  to anon, authenticated
  using (
    visible
    and exists (
      select 1 from public.portfolios p
      where p.user_id = portfolio_projects.user_id and p.published
    )
  );

alter table public.portfolio_reports enable row level security;
drop policy if exists "portfolio_reports: qualquer um denuncia" on public.portfolio_reports;
create policy "portfolio_reports: qualquer um denuncia"
  on public.portfolio_reports for insert
  to anon, authenticated
  with check (true);

-- Visita na página pública: +1 só em portfólio publicado.
create or replace function public.increment_portfolio_view(p_slug text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.portfolios set views = views + 1 where slug = p_slug and published;
$$;
revoke all on function public.increment_portfolio_view(text) from public;
grant execute on function public.increment_portfolio_view(text) to anon, authenticated;

-- =========================================
-- Storage: imagens do portfólio (públicas), uma pasta por usuário
-- =========================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "portfolio: dono envia" on storage.objects;
create policy "portfolio: dono envia"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "portfolio: dono atualiza" on storage.objects;
create policy "portfolio: dono atualiza"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "portfolio: dono apaga" on storage.objects;
create policy "portfolio: dono apaga"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio' and auth.uid()::text = (storage.foldername(name))[1]);
