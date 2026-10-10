-- Code Maker — estatísticas do site e formulário de contato que chega no CRM.
--
-- site_events: uma linha por visita, clique no WhatsApp/telefone/e-mail e contato recebido.
-- submit_site_lead: o formulário do site publicado vira contato (origem "Site") e tarefa "Responder".
-- site_stats: números do dono do site por período.

create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  site_id uuid not null references public.sites(id) on delete cascade,
  kind text not null check (kind in ('view', 'whatsapp', 'phone', 'email', 'lead')),
  page text,
  ref text,
  created_at timestamptz not null default now()
);
create index if not exists site_events_site_idx on public.site_events (site_id, created_at desc);

alter table public.site_events enable row level security;
drop policy if exists "site_events owner read" on public.site_events;
create policy "site_events owner read" on public.site_events for select
  using (exists (select 1 from public.sites s where s.id = site_id and s.user_id = (select auth.uid())));

-- Página pública: agora também guarda a visita (com a origem, quando o navegador informa).
create or replace function public.get_public_site_ref(p_slug text, p_page text default null, p_ref text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_site public.sites%rowtype;
  v_plan text;
  v_html text;
  v_ref text := nullif(left(lower(regexp_replace(coalesce(p_ref, ''), '^https?://(www\.)?([^/?#]+).*$', '\2')), 80), '');
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

  insert into public.site_events (site_id, kind, page, ref)
  values (v_site.id, 'view', nullif(lower(coalesce(p_page, '')), ''), v_ref);

  return jsonb_build_object('name', v_site.name, 'html', v_html, 'badge', v_plan = 'trial');
end;
$$;
revoke all on function public.get_public_site_ref(text, text, text) from public;
grant execute on function public.get_public_site_ref(text, text, text) to anon, authenticated;

-- A funcao antiga (2 argumentos) continua existindo e passa a guardar a visita tambem.
create or replace function public.get_public_site(p_slug text, p_page text default null)
returns jsonb language sql security definer set search_path = ''
as $$ select public.get_public_site_ref(p_slug, p_page, null::text) $$;

-- Clique em WhatsApp, telefone ou e-mail dentro do site publicado.
create or replace function public.record_site_event(p_slug text, p_kind text, p_page text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_kind not in ('whatsapp', 'phone', 'email') then
    return;
  end if;
  select id into v_id from public.sites where slug = lower(p_slug) and published and status = 'ready';
  if v_id is null then
    return;
  end if;
  -- Limite contra abuso: 600 cliques por hora por site.
  if (select count(*) from public.site_events where site_id = v_id and kind <> 'view' and created_at > now() - interval '1 hour') >= 600 then
    return;
  end if;
  insert into public.site_events (site_id, kind, page) values (v_id, p_kind, nullif(left(lower(coalesce(p_page, '')), 40), ''));
end;
$$;
revoke all on function public.record_site_event(text, text, text) from public;
grant execute on function public.record_site_event(text, text, text) to anon, authenticated;

-- Formulário do site: vira contato no CRM de quem fez o site.
create or replace function public.submit_site_lead(
  p_slug text,
  p_name text,
  p_phone text default null,
  p_email text default null,
  p_message text default null,
  p_page text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_site public.sites%rowtype;
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_message text := nullif(btrim(coalesce(p_message, '')), '');
  v_contact_id uuid;
begin
  select * into v_site from public.sites where slug = lower(p_slug) and published and status = 'ready';
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_name is null or char_length(v_name) > 120
     or (v_phone is null and v_email is null)
     or (v_phone is not null and char_length(v_digits) not between 8 and 13)
     or (v_email is not null and (char_length(v_email) > 160 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
     or char_length(coalesce(v_message, '')) > 1500 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  if (
    select count(*) from public.site_events where site_id = v_site.id and kind = 'lead' and created_at > now() - interval '1 hour'
  ) >= 40 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  -- Mesma pessoa reenviando no mesmo dia: não duplica.
  if exists (
    select 1 from public.contacts c
    where c.user_id = v_site.user_id and c.origin = 'Site' and c.created_at > now() - interval '1 day'
      and ((v_email is not null and lower(coalesce(c.email, '')) = v_email)
        or (v_digits <> '' and regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = v_digits))
  ) then
    return jsonb_build_object('ok', true);
  end if;

  insert into public.contacts (user_id, name, phone, email, status, origin, notes)
  values (
    v_site.user_id, v_name, v_phone, v_email, 'lead', 'Site',
    concat_ws(E'\n',
      'Chegou pelo formulário do site "' || v_site.name || '" em ' || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI') || '.',
      case when v_message is not null then E'Mensagem:\n' || v_message end
    )
  )
  returning id into v_contact_id;

  insert into public.tasks (user_id, title, description, status, priority, due_date, reminder_at, contact_id, recurrence, position)
  values (
    v_site.user_id,
    'Responder ' || v_name || ' (site ' || v_site.name || ')',
    concat_ws(E'\n\n',
      'Novo contato pelo formulário do site. Responda rápido: quem responde primeiro fecha mais.',
      case when v_message is not null then E'Mensagem:\n' || v_message end
    ),
    'todo', 'high', now(), now(), v_contact_id, 'none', 0
  );

  insert into public.site_events (site_id, kind, page) values (v_site.id, 'lead', nullif(left(lower(coalesce(p_page, '')), 40), ''));

  perform net.http_post(
    url := 'https://mfzlwynqjbusyudstdds.supabase.co/functions/v1/notifications-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select value from public.app_config where key = 'cron_secret')
    ),
    body := '{"action":"dispatch"}'::jsonb,
    timeout_milliseconds := 30000
  );

  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.submit_site_lead(text, text, text, text, text, text) from public;
grant execute on function public.submit_site_lead(text, text, text, text, text, text) to anon, authenticated;

-- Números do site para o dono: totais, visitas por dia, origens e páginas mais vistas.
create or replace function public.site_stats(p_site_id uuid, p_days integer default 7)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days integer := least(greatest(coalesce(p_days, 7), 1), 90);
  v_from timestamptz := date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo' - make_interval(days => v_days - 1);
  v_result jsonb;
begin
  if not exists (select 1 from public.sites where id = p_site_id and user_id = (select auth.uid())) then
    return null;
  end if;
  select jsonb_build_object(
    'days', v_days,
    'totals', jsonb_build_object(
      'views', count(*) filter (where kind = 'view'),
      'whatsapp', count(*) filter (where kind = 'whatsapp'),
      'phone', count(*) filter (where kind = 'phone'),
      'email', count(*) filter (where kind = 'email'),
      'leads', count(*) filter (where kind = 'lead')
    )
  ) into v_result
  from public.site_events where site_id = p_site_id and created_at >= v_from;

  return v_result || jsonb_build_object(
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', to_char(d.day, 'YYYY-MM-DD'), 'views', coalesce(c.n, 0)) order by d.day)
      from generate_series((v_from at time zone 'America/Sao_Paulo')::date, (now() at time zone 'America/Sao_Paulo')::date, interval '1 day') as d(day)
      left join (
        select (created_at at time zone 'America/Sao_Paulo')::date as day, count(*) as n
        from public.site_events where site_id = p_site_id and kind = 'view' and created_at >= v_from group by 1
      ) c on c.day = d.day::date
    ), '[]'::jsonb),
    'refs', coalesce((
      select jsonb_agg(jsonb_build_object('name', coalesce(ref, 'Direto'), 'n', n) order by n desc)
      from (select ref, count(*) n from public.site_events where site_id = p_site_id and kind = 'view' and created_at >= v_from group by ref order by n desc limit 5) r
    ), '[]'::jsonb),
    'pages', coalesce((
      select jsonb_agg(jsonb_build_object('name', coalesce(page, ''), 'n', n) order by n desc)
      from (select page, count(*) n from public.site_events where site_id = p_site_id and kind = 'view' and created_at >= v_from group by page order by n desc limit 5) r
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.site_stats(uuid, integer) from public;
grant execute on function public.site_stats(uuid, integer) to authenticated;
