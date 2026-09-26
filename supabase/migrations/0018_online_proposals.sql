-- Code Sellers — Proposta online com botão "Aprovar"
-- Execute no Supabase SQL Editor (pode rodar mais de uma vez).
--
-- O vendedor cria a proposta dentro de um negócio e envia o link
-- /proposta/<token>. O cliente abre sem login, escolhe uma opção e aprova.
-- Ao aprovar: o negócio vira Ganho com o valor da opção, nasce a conta a
-- receber, o histórico registra a aprovação e uma tarefa com lembrete avisa o
-- vendedor (notificação no celular pelo cron de avisos).
--
-- O cliente nunca acessa a tabela direto: só as funções abaixo, pelo token.

create table if not exists public.online_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  title text not null check (char_length(title) between 1 and 160),
  client_name text check (char_length(client_name) <= 160),
  body text not null default '' check (char_length(body) <= 20000),
  -- [{ "id": "a1", "name": "Essencial", "description": "…", "price": 1200, "recommended": false }]
  options jsonb not null default '[]'::jsonb
    check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 1 and 3),
  payment_terms text check (char_length(payment_terms) <= 500),
  valid_until date,
  status text not null default 'sent' check (status in ('sent', 'viewed', 'approved', 'declined', 'cancelled')),
  chosen_option_id text,
  chosen_option_name text,
  chosen_price numeric(12, 2),
  responder_name text check (char_length(responder_name) <= 120),
  response_note text check (char_length(response_note) <= 1000),
  views integer not null default 0,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists online_proposals_deal_idx on public.online_proposals(deal_id, created_at desc);

alter table public.online_proposals enable row level security;
drop policy if exists "online_proposals: acesso do próprio usuário" on public.online_proposals;
create policy "online_proposals: acesso do próprio usuário"
  on public.online_proposals for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists online_proposals_updated_at on public.online_proposals;
create trigger online_proposals_updated_at
  before update on public.online_proposals
  for each row execute function public.update_updated_at();

-- Valor em reais para textos gerados aqui (histórico e tarefa).
create or replace function public.format_brl(p_value numeric)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'R$ ' || translate(to_char(coalesce(p_value, 0), 'FM999,999,990.00'), ',.', '.,');
$$;

-- =========================================
-- Página pública: lê a proposta pelo token
-- =========================================
create or replace function public.get_online_proposal(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  p public.online_proposals;
  prof public.user_profiles;
  port public.portfolios;
begin
  select * into p from public.online_proposals where token = p_token;
  if not found then
    return null;
  end if;

  select * into prof from public.user_profiles where id = p.user_id;
  select * into port from public.portfolios where user_id = p.user_id;

  if p.status = 'cancelled' then
    return jsonb_build_object('status', 'cancelled');
  end if;

  return jsonb_build_object(
    'title', p.title,
    'client_name', p.client_name,
    'body', p.body,
    'options', p.options,
    'payment_terms', p.payment_terms,
    'valid_until', p.valid_until,
    'expired', p.valid_until is not null and p.valid_until < (now() at time zone 'America/Sao_Paulo')::date,
    'status', p.status,
    'chosen_option_id', p.chosen_option_id,
    'responder_name', p.responder_name,
    'responded_at', p.responded_at,
    'created_at', p.created_at,
    'seller', jsonb_build_object(
      'name', coalesce(nullif(port.display_name, ''), prof.full_name),
      'company', prof.company_name,
      'avatar_url', coalesce(port.avatar_url, prof.avatar_url),
      'logo_url', prof.company_logo_url,
      'whatsapp', coalesce(nullif(port.whatsapp, ''), prof.phone),
      'portfolio_slug', case when port.published then port.slug end
    )
  );
end;
$$;

-- Conta a visita (a primeira vira registro no histórico do negócio).
create or replace function public.mark_online_proposal_viewed(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.online_proposals;
begin
  select * into p from public.online_proposals where token = p_token for update;
  if not found or p.status = 'cancelled' then
    return;
  end if;

  update public.online_proposals
    set views = views + 1,
        first_viewed_at = coalesce(first_viewed_at, now()),
        last_viewed_at = now(),
        status = case when status = 'sent' then 'viewed' else status end
    where id = p.id;

  if p.first_viewed_at is null then
    insert into public.deal_activities (deal_id, user_id, type, content, metadata)
    values (p.deal_id, p.user_id, 'other', 'O cliente abriu a proposta online "' || p.title || '".',
            jsonb_build_object('online_proposal_id', p.id, 'event', 'viewed'));
  end if;
end;
$$;

-- =========================================
-- Resposta do cliente: aprovar (com opção) ou recusar
-- =========================================
create or replace function public.respond_online_proposal(
  p_token text,
  p_approve boolean,
  p_option_id text,
  p_name text,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.online_proposals;
  d public.deals;
  opt jsonb;
  v_price numeric(12, 2);
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_summary text;
begin
  select * into p from public.online_proposals where token = p_token for update;
  if not found or p.status = 'cancelled' then
    return jsonb_build_object('error', 'not_found');
  end if;
  if p.status in ('approved', 'declined') then
    return jsonb_build_object('error', 'already_answered', 'status', p.status);
  end if;
  if p.valid_until is not null and p.valid_until < (now() at time zone 'America/Sao_Paulo')::date then
    return jsonb_build_object('error', 'expired');
  end if;
  if v_name is not null and char_length(v_name) > 120 then
    v_name := left(v_name, 120);
  end if;
  if v_note is not null and char_length(v_note) > 1000 then
    v_note := left(v_note, 1000);
  end if;

  select * into d from public.deals where id = p.deal_id;

  if p_approve then
    if v_name is null or char_length(v_name) < 2 then
      return jsonb_build_object('error', 'name_required');
    end if;
    select value into opt from jsonb_array_elements(p.options) where value ->> 'id' = p_option_id limit 1;
    if opt is null then
      return jsonb_build_object('error', 'invalid_option');
    end if;
    v_price := nullif(opt ->> 'price', '')::numeric;
    v_summary := coalesce(opt ->> 'name', 'Opção') || case when v_price is not null then ' (' || public.format_brl(v_price) || ')' else '' end;

    update public.online_proposals
      set status = 'approved',
          chosen_option_id = p_option_id,
          chosen_option_name = opt ->> 'name',
          chosen_price = v_price,
          responder_name = v_name,
          response_note = v_note,
          responded_at = now()
      where id = p.id;

    -- Negócio vira Ganho com o valor escolhido (won_at e follow-ups: triggers de deals).
    update public.deals
      set status = 'won',
          stage = 'won',
          probability = 100,
          value = coalesce(v_price, value),
          updated_at = now()
      where id = p.deal_id;

    if d.status is distinct from 'won' and coalesce(v_price, d.value, 0) > 0 then
      insert into public.receivables (user_id, deal_id, contact_id, description, amount, status)
      values (p.user_id, p.deal_id, d.contact_id, d.title, coalesce(v_price, d.value), 'pending');
    end if;

    insert into public.deal_activities (deal_id, user_id, type, content, metadata)
    values (p.deal_id, p.user_id, 'other',
            v_name || ' aprovou a proposta online: ' || v_summary || '.' || coalesce(E'\nObservação: ' || v_note, ''),
            jsonb_build_object('online_proposal_id', p.id, 'event', 'approved', 'option_id', p_option_id, 'price', v_price));

    insert into public.tasks (user_id, title, description, status, priority, due_date, reminder_at, deal_id, contact_id)
    values (p.user_id,
            'Proposta aprovada: ' || coalesce(d.title, p.title),
            v_name || ' aprovou a opção ' || v_summary || '. Próximo passo: enviar o contrato e combinar a entrada.'
              || coalesce(E'\nObservação do cliente: ' || v_note, ''),
            'todo', 'high', now(), now(), p.deal_id, d.contact_id);

    return jsonb_build_object('ok', true, 'status', 'approved');
  end if;

  update public.online_proposals
    set status = 'declined',
        responder_name = v_name,
        response_note = v_note,
        responded_at = now()
    where id = p.id;

  insert into public.deal_activities (deal_id, user_id, type, content, metadata)
  values (p.deal_id, p.user_id, 'other',
          coalesce(v_name, 'O cliente') || ' recusou a proposta online.' || coalesce(E'\nMotivo: ' || v_note, ''),
          jsonb_build_object('online_proposal_id', p.id, 'event', 'declined'));

  insert into public.tasks (user_id, title, description, status, priority, due_date, reminder_at, deal_id, contact_id)
  values (p.user_id,
          'Proposta recusada: ' || coalesce(d.title, p.title),
          coalesce(v_name, 'O cliente') || ' recusou a proposta.' || coalesce(E'\nMotivo: ' || v_note, '')
            || E'\nVale entender o motivo e, se fizer sentido, oferecer uma opção menor.',
          'todo', 'medium', now(), now(), p.deal_id, d.contact_id);

  return jsonb_build_object('ok', true, 'status', 'declined');
end;
$$;

revoke all on function public.get_online_proposal(text) from public;
revoke all on function public.mark_online_proposal_viewed(text) from public;
revoke all on function public.respond_online_proposal(text, boolean, text, text, text) from public;
grant execute on function public.get_online_proposal(text) to anon, authenticated;
grant execute on function public.mark_online_proposal_viewed(text) to anon, authenticated;
grant execute on function public.respond_online_proposal(text, boolean, text, text, text) to anon, authenticated;
