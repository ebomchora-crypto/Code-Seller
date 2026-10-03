-- Assinatura do Code Sellers (cobrança pela Kiwify).
--
-- subscriptions: situação da assinatura de cada e-mail, atualizada pelos avisos
--   da Kiwify (função kiwify-webhook). A pessoa pode pagar antes de criar a
--   conta: a assinatura fica esperando pelo e-mail.
-- billing_events: cada aviso recebido, para conferência (só o servidor lê).
-- account_access: teste grátis e contas liberadas. O usuário não escreve aqui.
-- billing_status(): o que a tela usa para liberar ou pedir a assinatura.

create table if not exists public.subscriptions (
  email text primary key,
  user_id uuid references auth.users(id) on delete set null,
  status text not null check (status in ('active', 'late', 'canceled', 'refunded')),
  kiwify_subscription_id text,
  kiwify_order_id text,
  next_charge_at timestamptz,
  last_event text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions: dono lê" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or email = lower((select auth.jwt() ->> 'email')));

create table if not exists public.billing_events (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  event text,
  email text,
  verified boolean not null default false,
  applied boolean not null default false,
  note text,
  payload jsonb
);

alter table public.billing_events enable row level security;

create table if not exists public.account_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  exempt boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.account_access enable row level security;

create policy "account_access: dono lê" on public.account_access for select to authenticated
  using (user_id = (select auth.uid()));

-- Situação da conta logada. Cria o teste grátis (7 dias) no primeiro acesso
-- e liga a assinatura paga ao usuário pelo e-mail.
create or replace function public.billing_status()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  user_email text := lower(auth.jwt() ->> 'email');
  access public.account_access;
  sub public.subscriptions;
  state text;
begin
  if uid is null then
    return jsonb_build_object('access', false, 'state', 'signed_out');
  end if;

  insert into public.account_access (user_id) values (uid) on conflict (user_id) do nothing;
  select * into access from public.account_access where user_id = uid;

  update public.subscriptions set user_id = uid
    where email = user_email and user_id is distinct from uid;
  select * into sub from public.subscriptions
    where user_id = uid or email = user_email
    order by updated_at desc limit 1;

  if access.exempt then
    state := 'exempt';
  elsif sub.status = 'active' then
    state := 'active';
  elsif sub.status = 'late' and sub.updated_at > now() - interval '5 days' then
    -- Cartão recusado: a Kiwify tenta de novo; o acesso continua alguns dias.
    state := 'late';
  elsif sub.status = 'canceled' and sub.next_charge_at > now() then
    -- Cancelou: usa até o fim do período que já pagou.
    state := 'canceled_active';
  elsif access.trial_ends_at > now() and (sub.status is null or sub.status <> 'refunded') then
    state := 'trial';
  else
    state := 'expired';
  end if;

  return jsonb_build_object(
    'access', state <> 'expired',
    'state', state,
    'trial_ends_at', access.trial_ends_at,
    'next_charge_at', sub.next_charge_at,
    'subscription_status', sub.status
  );
end;
$$;

revoke all on function public.billing_status() from public, anon;
grant execute on function public.billing_status() to authenticated;
