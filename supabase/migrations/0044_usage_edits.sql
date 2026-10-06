-- Alterações de sites no uso do dia: a tela "Meu plano" e o editor do Code
-- Maker mostram quantas já foram feitas (teste 10, pago 100, liberada sem limite).
create or replace function public.usage_for(p_user uuid, p_email text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  status jsonb := public.billing_status_for(p_user, p_email);
  plan text := status ->> 'plan';
  day_start timestamptz := date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  copilot_used integer;
  sites_used integer;
  edits_used integer;
  hunter_used integer;
begin
  select count(*) into copilot_used from public.usage_events
    where user_id = p_user and kind = 'copilot' and created_at >= day_start;
  select count(*) into sites_used from public.code_maker_calls
    where user_id = p_user and kind = 'create' and created_at >= day_start;
  select count(*) into edits_used from public.code_maker_calls
    where user_id = p_user and kind = 'edit' and created_at >= day_start;
  select count(*) into hunter_used from public.prospect_searches
    where user_id = p_user and created_at >= day_start;

  return status || jsonb_build_object(
    'copilot_used', copilot_used,
    'copilot_limit', case plan when 'trial' then 5 when 'paid' then 50 when 'none' then 0 else null end,
    'sites_used', sites_used,
    'sites_limit', case plan when 'trial' then 2 when 'paid' then 10 when 'none' then 0 else null end,
    'edits_used', edits_used,
    'edits_limit', case plan when 'trial' then 10 when 'paid' then 100 when 'none' then 0 else null end,
    'hunter_used_today', hunter_used,
    'hunter_daily_limit', case plan when 'trial' then 1 when 'none' then 0 else null end
  );
end;
$function$;
