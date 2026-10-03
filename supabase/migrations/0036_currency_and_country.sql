-- Várias moedas (Real, Dólar, Euro, Libra) e país do Buyers Hunter.

-- 1. Moeda em tudo que envolve dinheiro. Tudo o que já existe fica em Real.
alter table public.deals add column if not exists currency text not null default 'BRL'
  check (currency in ('BRL', 'USD', 'EUR', 'GBP'));
alter table public.transactions add column if not exists currency text not null default 'BRL'
  check (currency in ('BRL', 'USD', 'EUR', 'GBP'));
alter table public.receivables add column if not exists currency text not null default 'BRL'
  check (currency in ('BRL', 'USD', 'EUR', 'GBP'));
alter table public.online_proposals add column if not exists currency text not null default 'BRL'
  check (currency in ('BRL', 'USD', 'EUR', 'GBP'));

create index if not exists deals_user_currency_idx on public.deals(user_id, currency);
create index if not exists transactions_user_currency_idx on public.transactions(user_id, currency);
create index if not exists receivables_user_currency_idx on public.receivables(user_id, currency);

-- Conta a receber, lançamento e proposta ligados a um negócio usam a moeda
-- do negócio (a venda em euro entra no Financeiro em euro).
create or replace function public.currency_from_deal()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  deal_currency text;
begin
  if new.deal_id is not null then
    select currency into deal_currency from public.deals where id = new.deal_id;
    if deal_currency is not null then new.currency := deal_currency; end if;
  end if;
  return new;
end $$;

create or replace trigger receivables_currency_from_deal before insert or update of deal_id on public.receivables
  for each row execute function public.currency_from_deal();
create or replace trigger transactions_currency_from_deal before insert or update of deal_id on public.transactions
  for each row execute function public.currency_from_deal();
create or replace trigger online_proposals_currency_from_deal before insert or update of deal_id on public.online_proposals
  for each row execute function public.currency_from_deal();

-- Trocou a moeda do negócio: o que está ligado a ele acompanha.
create or replace function public.deal_currency_cascade()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.currency is distinct from old.currency then
    update public.receivables set currency = new.currency where deal_id = new.id;
    update public.transactions set currency = new.currency where deal_id = new.id;
    update public.online_proposals set currency = new.currency where deal_id = new.id;
  end if;
  return new;
end $$;

create or replace trigger deals_currency_cascade after update of currency on public.deals
  for each row execute function public.deal_currency_cascade();

revoke all on function public.currency_from_deal() from public, anon, authenticated;
revoke all on function public.deal_currency_cascade() from public, anon, authenticated;

-- A página pública da proposta mostra os valores na moeda certa.
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
    'currency', p.currency,
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

-- 2. País do Buyers Hunter (busca e contatos importados).
alter table public.prospect_searches add column if not exists website_filter text
  check (website_filter is null or website_filter in ('all', 'yes', 'no'));
alter table public.prospect_searches add column if not exists state text;
alter table public.prospect_searches add column if not exists country text not null default 'BR';
alter table public.contacts add column if not exists country text;
