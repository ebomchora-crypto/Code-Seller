-- Limites diários por plano e bloqueio no servidor.
--
-- Teste grátis: 1 site e 3 mensagens do CS Copilot por dia.
-- Plano pago:  10 sites e 50 mensagens do CS Copilot por dia.
-- Conta liberada (dono): sem limite.
-- O dia vira à meia-noite de Brasília.

create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('copilot')),
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_kind_day_idx on public.usage_events(user_id, kind, created_at);

alter table public.usage_events enable row level security;

create policy "usage_events: dono lê" on public.usage_events for select to authenticated
  using (user_id = (select auth.uid()));

-- Situação de qualquer conta (usada pelas funções do servidor e por billing_status).
create or replace function public.billing_status_for(p_user uuid, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_email text := lower(p_email);
  access public.account_access;
  sub public.subscriptions;
  state text;
begin
  insert into public.account_access (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into access from public.account_access where user_id = p_user;

  update public.subscriptions set user_id = p_user
    where email = user_email and user_id is distinct from p_user;
  select * into sub from public.subscriptions
    where user_id = p_user or email = user_email
    order by updated_at desc limit 1;

  if access.exempt then
    state := 'exempt';
  elsif sub.status = 'active' then
    state := 'active';
  elsif sub.status = 'late' and sub.updated_at > now() - interval '5 days' then
    state := 'late';
  elsif sub.status = 'canceled' and sub.next_charge_at > now() then
    state := 'canceled_active';
  elsif access.trial_ends_at > now() and (sub.status is null or sub.status <> 'refunded') then
    state := 'trial';
  else
    state := 'expired';
  end if;

  return jsonb_build_object(
    'access', state <> 'expired',
    'state', state,
    'plan', case
      when state = 'exempt' then 'exempt'
      when state in ('active', 'late', 'canceled_active') then 'paid'
      when state = 'trial' then 'trial'
      else 'none' end,
    'trial_ends_at', access.trial_ends_at,
    'next_charge_at', sub.next_charge_at,
    'subscription_status', sub.status
  );
end;
$$;

create or replace function public.billing_status()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('access', false, 'state', 'signed_out', 'plan', 'none');
  end if;
  return public.billing_status_for(auth.uid(), auth.jwt() ->> 'email');
end;
$$;

-- Situação + uso de hoje + limites do plano (null = sem limite).
create or replace function public.usage_for(p_user uuid, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  status jsonb := public.billing_status_for(p_user, p_email);
  plan text := status ->> 'plan';
  day_start timestamptz := date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  copilot_used integer;
  sites_used integer;
begin
  select count(*) into copilot_used from public.usage_events
    where user_id = p_user and kind = 'copilot' and created_at >= day_start;
  select count(*) into sites_used from public.code_maker_calls
    where user_id = p_user and kind = 'create' and created_at >= day_start;

  return status || jsonb_build_object(
    'copilot_used', copilot_used,
    'copilot_limit', case plan when 'trial' then 3 when 'paid' then 50 when 'none' then 0 else null end,
    'sites_used', sites_used,
    'sites_limit', case plan when 'trial' then 1 when 'paid' then 10 when 'none' then 0 else null end
  );
end;
$$;

create or replace function public.usage_today()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then return null; end if;
  return public.usage_for(auth.uid(), auth.jwt() ->> 'email');
end;
$$;

revoke all on function public.billing_status_for(uuid, text) from public, anon, authenticated;
revoke all on function public.usage_for(uuid, text) from public, anon, authenticated;
grant execute on function public.billing_status_for(uuid, text) to service_role;
grant execute on function public.usage_for(uuid, text) to service_role;
revoke all on function public.usage_today() from public, anon;
grant execute on function public.usage_today() to authenticated;
