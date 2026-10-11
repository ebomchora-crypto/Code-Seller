-- Mensalidades de clientes (CRM e Negócios). Já aplicada no banco; este arquivo documenta o esquema.
-- Obs.: public.subscriptions é a cobrança da própria plataforma; a dos clientes é client_subscriptions.

create table if not exists public.client_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  title text not null default 'Mensalidade',
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'BRL',
  start_date date not null,
  months int check (months between 1 and 120), -- null = sem prazo
  status text not null default 'active' check (status in ('active','paused','canceled')),
  payment_method text check (payment_method in ('pix','boleto','credit_card','debit_card','transfer','cash','other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (contact_id is not null or deal_id is not null)
);
create index if not exists client_subscriptions_user_status_idx on public.client_subscriptions (user_id, status);
create index if not exists client_subscriptions_contact_idx on public.client_subscriptions (contact_id);
create index if not exists client_subscriptions_deal_idx on public.client_subscriptions (deal_id);
alter table public.client_subscriptions enable row level security;
create policy "client_subscriptions owner all" on public.client_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger client_subscriptions_updated_at before update on public.client_subscriptions
  for each row execute function public.update_updated_at();

alter table public.receivables alter column deal_id drop not null;
alter table public.receivables add column if not exists subscription_id uuid references public.client_subscriptions(id) on delete set null;
alter table public.receivables add column if not exists installment int;
create unique index if not exists receivables_subscription_installment_idx
  on public.receivables (subscription_id, installment) where subscription_id is not null;

-- Também aplicados no banco: generate_subscription_charges(p_user, p_horizon_days) e
-- generate_my_subscription_charges() (cria as cobranças "A receber" dos próximos 35 dias),
-- o gatilho client_subscription_changed() (pausar/cancelar/reativar e mudança de valor/data/prazo)
-- e o job diário code-sellers-subscription-charges (05:10 UTC).
