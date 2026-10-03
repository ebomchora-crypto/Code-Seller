-- Novos limites do teste grátis: 2 sites, 5 mensagens do CS Copilot e
-- 1 busca do Buyers Hunter por dia. Plano pago: 10 sites e 50 mensagens por
-- dia; Buyers Hunter com 50 buscas por mês (limite mensal da própria função).
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
  hunter_used integer;
begin
  select count(*) into copilot_used from public.usage_events
    where user_id = p_user and kind = 'copilot' and created_at >= day_start;
  select count(*) into sites_used from public.code_maker_calls
    where user_id = p_user and kind = 'create' and created_at >= day_start;
  select count(*) into hunter_used from public.prospect_searches
    where user_id = p_user and created_at >= day_start;

  return status || jsonb_build_object(
    'copilot_used', copilot_used,
    'copilot_limit', case plan when 'trial' then 5 when 'paid' then 50 when 'none' then 0 else null end,
    'sites_used', sites_used,
    'sites_limit', case plan when 'trial' then 2 when 'paid' then 10 when 'none' then 0 else null end,
    'hunter_used_today', hunter_used,
    'hunter_daily_limit', case plan when 'trial' then 1 when 'none' then 0 else null end
  );
end;
$$;

revoke all on function public.usage_for(uuid, text) from public, anon, authenticated;
grant execute on function public.usage_for(uuid, text) to service_role;
