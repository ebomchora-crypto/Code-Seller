-- Aplicado no banco junto com o 0047 (por partes). Reúne:
--  * get_site_seo: o site para os robôs de busca e prévias de link (não conta visita);
--  * purge_site_events + agenda diária: apaga eventos de site com mais de 180 dias;
--  * my_sessions: dispositivos conectados da conta (tela Configurações > Segurança).
-- (get_public_site passou a chamar get_public_site_ref, que guarda a visita; veja o 0047.)

create or replace function public.get_site_seo(p_slug text, p_page text default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $f$
declare
  v_site public.sites%rowtype;
  v_html text;
begin
  select * into v_site from public.sites where slug = lower(p_slug) and published and status = 'ready' and html is not null;
  if not found then return null; end if;
  if public.site_owner_plan(v_site.user_id) = 'none' then return null; end if;
  if p_page is null or p_page = '' then
    v_html := v_site.html;
  else
    v_html := v_site.pages_html ->> lower(p_page);
    if v_html is null then return null; end if;
  end if;
  return jsonb_build_object(
    'name', v_site.name, 'html', v_html,
    'niche', v_site.brief ->> 'niche', 'city', v_site.brief ->> 'city', 'phone', v_site.brief ->> 'phone',
    'assets', coalesce(v_site.brief -> 'assets', '[]'::jsonb), 'updated_at', v_site.updated_at
  );
end;
$f$;
revoke all on function public.get_site_seo(text, text) from public;
grant execute on function public.get_site_seo(text, text) to anon, authenticated;

create or replace function public.purge_site_events()
returns integer language plpgsql security definer set search_path = '' as $f$
declare n integer;
begin
  delete from public.site_events where created_at < now() - interval '180 days';
  get diagnostics n = row_count;
  return n;
end;
$f$;
revoke all on function public.purge_site_events() from public, anon, authenticated;
select cron.schedule('code-sellers-purge-site-events', '20 4 * * *', 'select public.purge_site_events()');

create or replace function public.my_sessions()
returns table (id uuid, created_at timestamptz, updated_at timestamptz, user_agent text, is_current boolean)
language sql stable security definer set search_path = '' as $f$
  select s.id, s.created_at, s.updated_at, s.user_agent, s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
  from auth.sessions s
  where s.user_id = auth.uid() and (s.not_after is null or s.not_after > now())
  order by s.updated_at desc nulls last
  limit 20
$f$;
revoke all on function public.my_sessions() from public, anon;
grant execute on function public.my_sessions() to authenticated;
