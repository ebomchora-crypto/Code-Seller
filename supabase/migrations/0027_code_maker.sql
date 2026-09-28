-- Code Sellers — Code Maker (sites gerados por IA, publicados em /s/apelido)
-- Execute este arquivo no Supabase SQL Editor (pode rodar mais de uma vez).
--
-- sites: um site por linha, com o HTML atual. site_versions: cada geração ou
-- alteração (pedido, ações da IA e o HTML daquela versão) — é o histórico que
-- aparece no editor e permite voltar atrás. A IA só é chamada pela função
-- code-maker, que também aplica o limite diário.

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique
    check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$'),
  name text not null check (char_length(name) between 1 and 120),
  niche text,
  city text,
  phone text,
  style text not null default 'auto',
  contact_id uuid references public.contacts(id) on delete set null,
  html text,
  status text not null default 'generating' check (status in ('generating', 'ready', 'error')),
  published boolean not null default true,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sites_user_idx on public.sites(user_id, updated_at desc);

create table if not exists public.site_versions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('create', 'edit', 'restore')),
  instruction text,
  actions jsonb not null default '[]'::jsonb,
  html text,
  ok boolean not null default true,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists site_versions_site_idx on public.site_versions(site_id, created_at);
create index if not exists site_versions_user_day_idx on public.site_versions(user_id, created_at desc);

drop trigger if exists sites_updated_at on public.sites;
create trigger sites_updated_at
  before update on public.sites
  for each row execute function update_updated_at();

alter table public.sites enable row level security;
alter table public.site_versions enable row level security;

-- O dono vê e ajusta (nome, apelido, publicar) os próprios sites. O HTML só
-- muda pela função (que usa a chave de serviço) — mas o dono também pode
-- restaurar uma versão, então a atualização fica liberada para ele.
drop policy if exists "sites: dono lê" on public.sites;
create policy "sites: dono lê" on public.sites for select using ((select auth.uid()) = user_id);
drop policy if exists "sites: dono atualiza" on public.sites;
create policy "sites: dono atualiza" on public.sites for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "sites: dono apaga" on public.sites;
create policy "sites: dono apaga" on public.sites for delete using ((select auth.uid()) = user_id);

drop policy if exists "site_versions: dono lê" on public.site_versions;
create policy "site_versions: dono lê" on public.site_versions for select using ((select auth.uid()) = user_id);
drop policy if exists "site_versions: dono cria restauração" on public.site_versions;
create policy "site_versions: dono cria restauração" on public.site_versions for insert
  with check ((select auth.uid()) = user_id and kind = 'restore');

-- Página pública /s/apelido: só o HTML de sites publicados e prontos.
create or replace function public.get_public_site(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_site public.sites%rowtype;
begin
  select * into v_site from public.sites where slug = lower(p_slug) and published and status = 'ready' and html is not null;
  if not found then
    return null;
  end if;
  update public.sites set views = views + 1 where id = v_site.id;
  return jsonb_build_object('name', v_site.name, 'html', v_site.html);
end;
$$;

revoke all on function public.get_public_site(text) from public;
grant execute on function public.get_public_site(text) to anon, authenticated;
