-- Code Sellers — Formulário de captação (link público /f/apelido)
-- Execute este arquivo no Supabase SQL Editor (pode rodar mais de uma vez).
--
-- Cada usuário pode ter um formulário público. Quem preenche vira contato no
-- CRM (origem "Formulário"), ganha uma tarefa "Responder" com lembrete na hora
-- e o aviso sai logo em seguida (celular e app de Windows). O webhook
-- "Contato criado" também dispara, se estiver ligado.

create table if not exists public.lead_forms (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique
    check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$')
    check (slug not in (
      'admin', 'administrador', 'api', 'app', 'login', 'logout', 'register', 'cadastro', 'entrar',
      'suporte', 'support', 'settings', 'configuracoes', 'codesellers', 'code-sellers', 'code-seller',
      'buyers-hunter', 'buyershunter', 'oficial', 'equipe', 'root', 'null'
    )),
  enabled boolean not null default true,
  title text not null default 'Vamos conversar?' check (char_length(title) between 1 and 80),
  subtitle text check (subtitle is null or char_length(subtitle) <= 280),
  ask_email boolean not null default false,
  ask_niche boolean not null default true,
  ask_city boolean not null default false,
  ask_message boolean not null default true,
  submissions integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists lead_forms_updated_at on public.lead_forms;
create trigger lead_forms_updated_at
  before update on public.lead_forms
  for each row execute function update_updated_at();

alter table public.lead_forms enable row level security;
drop policy if exists "lead_forms: dono" on public.lead_forms;
create policy "lead_forms: dono"
  on public.lead_forms for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Página pública: só o necessário para montar o formulário.
create or replace function public.get_lead_form(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'slug', f.slug,
    'title', f.title,
    'subtitle', f.subtitle,
    'ask_email', f.ask_email,
    'ask_niche', f.ask_niche,
    'ask_city', f.ask_city,
    'ask_message', f.ask_message,
    'owner_name', coalesce(nullif(p.display_name, ''), nullif(u.full_name, ''), 'Code Sellers'),
    'owner_company', u.company_name,
    'owner_avatar', coalesce(p.avatar_url, u.avatar_url)
  )
  from public.lead_forms f
  left join public.user_profiles u on u.id = f.user_id
  left join public.portfolios p on p.user_id = f.user_id and p.published
  where f.slug = lower(p_slug) and f.enabled
$$;

create or replace function public.submit_lead_form(
  p_slug text,
  p_name text,
  p_phone text,
  p_email text default null,
  p_niche text default null,
  p_city text default null,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_form public.lead_forms%rowtype;
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_niche text := nullif(btrim(coalesce(p_niche, '')), '');
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
  v_message text := nullif(btrim(coalesce(p_message, '')), '');
  v_contact_id uuid;
  v_notes text;
begin
  select * into v_form from public.lead_forms where slug = lower(p_slug) and enabled;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_name is null or char_length(v_name) > 120
     or char_length(v_digits) not between 10 and 13
     or char_length(coalesce(v_email, '')) > 160
     or (v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
     or char_length(coalesce(v_niche, '')) > 80
     or char_length(coalesce(v_city, '')) > 80
     or char_length(coalesce(v_message, '')) > 1000 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  -- Limite contra abuso: no máximo 40 envios por hora por formulário.
  if (
    select count(*) from public.contacts c
    where c.user_id = v_form.user_id and c.origin = 'Formulário' and c.created_at > now() - interval '1 hour'
  ) >= 40 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  -- Mesmo telefone reenviando em pouco tempo: não duplica.
  if exists (
    select 1 from public.contacts c
    where c.user_id = v_form.user_id
      and c.origin = 'Formulário'
      and regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = v_digits
      and c.created_at > now() - interval '1 day'
  ) then
    return jsonb_build_object('ok', true);
  end if;

  v_notes := concat_ws(E'\n',
    'Chegou pelo formulário de captação em ' || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI') || '.',
    case when v_message is not null then E'Mensagem:\n' || v_message end
  );

  insert into public.contacts (user_id, name, phone, email, niche, city, status, origin, notes)
  values (v_form.user_id, v_name, v_phone, v_email, v_niche, v_city, 'lead', 'Formulário', v_notes)
  returning id into v_contact_id;

  -- Tarefa com lembrete agora: é ela que gera o aviso no celular e no app.
  insert into public.tasks (user_id, title, description, status, priority, due_date, reminder_at, contact_id, recurrence, position)
  values (
    v_form.user_id,
    'Responder ' || v_name || ' (formulário)',
    concat_ws(E'\n\n',
      'Novo lead pelo seu formulário de captação. Responda rápido: quem responde primeiro fecha mais.',
      case when v_message is not null then E'Mensagem:\n' || v_message end
    ),
    'todo', 'high', now(), now(), v_contact_id, 'none', 0
  );

  update public.lead_forms set submissions = submissions + 1 where user_id = v_form.user_id;

  -- Dispara os lembretes já (sem esperar o ciclo de 5 minutos).
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

revoke all on function public.get_lead_form(text) from public;
revoke all on function public.submit_lead_form(text, text, text, text, text, text, text) from public;
grant execute on function public.get_lead_form(text) to anon, authenticated;
grant execute on function public.submit_lead_form(text, text, text, text, text, text, text) to anon, authenticated;
