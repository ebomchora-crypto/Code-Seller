-- IDE web: o dono salva pontos de restauração manuais (nome dado por ele)
-- no histórico do site. Só do tipo 'edit' e sempre dele mesmo.
drop policy if exists "site_versions: dono cria ponto manual" on public.site_versions;
create policy "site_versions: dono cria ponto manual" on public.site_versions for insert
  with check ((select auth.uid()) = user_id and kind = 'edit' and instruction is not null);

-- "/ide/" passa a ser a IDE web: o apelido "ide" fica reservado (mesma lista de RESERVED_SLUGS).
alter table public.sites drop constraint if exists sites_slug_not_reserved;
alter table public.sites add constraint sites_slug_not_reserved check (slug <> all (array[
  'login', 'register', 'forgot-password', 'proposta', 'sala-de-receita', 'aluno', 'prospection', 'crm',
  'portfolio', 'deals', 'financial', 'tasks', 'relatorios', 'copilot', 'autopilot', 'code-maker', 'settings',
  'support', 'agenda', 'assets', 'downloads', 'api', 'admin', 'app', 'auth', 'dashboard', 'entrar', 'cadastro',
  'termos', 'privacidade', 'ajuda', 'suporte', 'precos', 'planos', 'blog', 'reset-password', 'signup', 'logout', 'ide'
]));
create or replace function public.sites_avoid_reserved_slug()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.slug = any (array['login', 'register', 'forgot-password', 'proposta', 'sala-de-receita', 'aluno', 'prospection', 'crm', 'portfolio', 'deals', 'financial', 'tasks', 'relatorios', 'copilot', 'autopilot', 'code-maker', 'settings', 'support', 'agenda', 'assets', 'downloads', 'api', 'admin', 'app', 'auth', 'dashboard', 'entrar', 'cadastro', 'termos', 'privacidade', 'ajuda', 'suporte', 'precos', 'planos', 'blog', 'reset-password', 'signup', 'logout', 'ide']) then
    new.slug := new.slug || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
  end if;
  return new;
end $$;
