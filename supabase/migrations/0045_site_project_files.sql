-- Code Maker como projeto de arquivos.
-- Além do plano e das seções (parts), cada site guarda os arquivos extras do
-- projeto (estilos.css, script.js e paginas/<nome>.html) e o documento montado
-- de cada página extra. O histórico guarda os arquivos para poder restaurar.

alter table public.sites add column if not exists files jsonb not null default '{}'::jsonb;
alter table public.sites add column if not exists pages_html jsonb not null default '{}'::jsonb;
alter table public.site_versions add column if not exists files jsonb;

-- Página pública: /apelido (página inicial) ou /apelido/pagina (página extra).
drop function if exists public.get_public_site(text);
create or replace function public.get_public_site(p_slug text, p_page text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_site public.sites%rowtype;
  v_plan text;
  v_html text;
begin
  select * into v_site from public.sites
  where slug = lower(p_slug) and published and status = 'ready' and html is not null;
  if not found then
    return null;
  end if;

  v_plan := public.site_owner_plan(v_site.user_id);
  if v_plan = 'none' then
    return jsonb_build_object('name', v_site.name, 'offline', true);
  end if;

  if p_page is null or p_page = '' then
    v_html := v_site.html;
    update public.sites set views = views + 1 where id = v_site.id;
  else
    v_html := v_site.pages_html ->> lower(p_page);
    if v_html is null then
      return jsonb_build_object('name', v_site.name, 'page_missing', true, 'badge', v_plan = 'trial');
    end if;
  end if;

  return jsonb_build_object('name', v_site.name, 'html', v_html, 'badge', v_plan = 'trial');
end;
$$;

revoke all on function public.get_public_site(text, text) from public;
grant execute on function public.get_public_site(text, text) to anon, authenticated;
