-- Link curto dos sites do Code Maker: codesellers.vercel.app/apelido.
-- Nomes que são telas do sistema não podem virar apelido
-- (mesma lista de RESERVED_SLUGS em supabase/functions/code-maker/site.ts).
alter table public.sites drop constraint if exists sites_slug_not_reserved;
alter table public.sites add constraint sites_slug_not_reserved check (slug <> all (array[
  'login', 'register', 'forgot-password', 'proposta', 'sala-de-receita', 'aluno', 'prospection', 'crm',
  'portfolio', 'deals', 'financial', 'tasks', 'relatorios', 'copilot', 'autopilot', 'code-maker', 'settings',
  'support', 'agenda', 'assets', 'downloads', 'api', 'admin', 'app', 'auth', 'dashboard', 'entrar', 'cadastro',
  'termos', 'privacidade', 'ajuda', 'suporte', 'precos', 'planos', 'blog', 'reset-password', 'signup', 'logout'
]));

-- Site novo com nome reservado (ex.: negócio chamado "Blog") ganha um final aleatório.
create or replace function public.sites_avoid_reserved_slug()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.slug = any (array['login', 'register', 'forgot-password', 'proposta', 'sala-de-receita', 'aluno', 'prospection', 'crm', 'portfolio', 'deals', 'financial', 'tasks', 'relatorios', 'copilot', 'autopilot', 'code-maker', 'settings', 'support', 'agenda', 'assets', 'downloads', 'api', 'admin', 'app', 'auth', 'dashboard', 'entrar', 'cadastro', 'termos', 'privacidade', 'ajuda', 'suporte', 'precos', 'planos', 'blog', 'reset-password', 'signup', 'logout']) then
    new.slug := new.slug || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
  end if;
  return new;
end $$;

drop trigger if exists sites_avoid_reserved_slug on public.sites;
create trigger sites_avoid_reserved_slug before insert on public.sites
  for each row execute function public.sites_avoid_reserved_slug();
