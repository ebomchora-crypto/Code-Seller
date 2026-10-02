-- Inteligência do lead e auditoria de site. Já aplicado no banco em 01/10
-- (migrações lead_intelligence_site_audits, hunter_intelligence_refresh,
-- manual_fact_source, hunter_capture_fact_scope, lead_sales_timeline),
-- trazido para o repositório com a versão final de cada função.

begin;

create unique index if not exists contacts_owner_id_idx on public.contacts(user_id, id);

create table if not exists public.lead_intelligence (
  contact_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  facts jsonb not null default '[]'::jsonb check (jsonb_typeof(facts) = 'array'),
  sales_context jsonb not null default '{}'::jsonb check (jsonb_typeof(sales_context) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, contact_id) references public.contacts(user_id, id) on delete cascade
);

create index if not exists lead_intelligence_owner_idx on public.lead_intelligence(user_id);

create table if not exists public.lead_site_audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null,
  request_id uuid not null,
  status text not null default 'queued' check (status in ('queued', 'fetching', 'analyzing', 'completed', 'partial', 'failed')),
  url text not null check (length(url) between 1 and 4096),
  final_url text,
  result jsonb check (result is null or jsonb_typeof(result) = 'object'),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, request_id),
  foreign key (user_id, contact_id) references public.contacts(user_id, id) on delete cascade,
  check (status not in ('completed', 'partial') or result is not null)
);

create index if not exists lead_audits_history_idx on public.lead_site_audits(user_id, contact_id, created_at desc);
create unique index if not exists lead_audits_one_active_idx on public.lead_site_audits(contact_id)
  where status in ('queued', 'fetching', 'analyzing');

alter table public.lead_intelligence enable row level security;
alter table public.lead_site_audits enable row level security;
revoke all on public.lead_intelligence, public.lead_site_audits from anon, authenticated;
grant select on public.lead_intelligence, public.lead_site_audits to authenticated;
grant all on public.lead_intelligence, public.lead_site_audits to service_role;

create policy lead_intelligence_read_own on public.lead_intelligence for select to authenticated
  using ((select auth.uid()) = user_id);
create policy lead_audits_read_own on public.lead_site_audits for select to authenticated
  using ((select auth.uid()) = user_id);

create trigger lead_intelligence_updated_at before update on public.lead_intelligence
  for each row execute function public.update_updated_at();
create trigger lead_site_audits_updated_at before update on public.lead_site_audits
  for each row execute function public.update_updated_at();

alter table public.sites add column if not exists audit_id uuid references public.lead_site_audits(id) on delete set null;
alter table public.sites add column if not exists prototype_request_id uuid;
alter table public.sites add column if not exists prototype_context jsonb
  check (prototype_context is null or jsonb_typeof(prototype_context) = 'object');

create unique index if not exists sites_prototype_request_idx on public.sites(user_id, prototype_request_id)
  where prototype_request_id is not null;
create index if not exists sites_contact_prototype_idx on public.sites(user_id, contact_id, created_at desc)
  where contact_id is not null;
create index if not exists sites_audit_idx on public.sites(audit_id) where audit_id is not null;

create or replace function public.validate_lead_prototype_owner()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.contact_id is not null and not exists (
    select 1 from public.contacts where id = new.contact_id and user_id = new.user_id
  ) then raise exception 'Lead does not belong to project owner' using errcode = '42501'; end if;
  if new.audit_id is not null and not exists (
    select 1 from public.lead_site_audits
    where id = new.audit_id and user_id = new.user_id
      and (contact_id = new.contact_id or (tg_op = 'UPDATE' and new.contact_id is null and new.audit_id = old.audit_id))
  ) then raise exception 'Audit does not belong to this lead and owner' using errcode = '42501'; end if;
  return new;
end $$;

revoke all on function public.validate_lead_prototype_owner() from public, anon, authenticated;

create trigger sites_lead_prototype_owner before insert or update of user_id, contact_id, audit_id on public.sites
  for each row execute function public.validate_lead_prototype_owner();

-- This narrow RPC keeps backend observations read-only while permitting owner edits.
create or replace function public.save_lead_sales_context(p_contact_id uuid, p_sales_context jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := (select auth.uid());
  normalized jsonb;
  result public.lead_intelligence%rowtype;
begin
  if owner_id is null or not exists (select 1 from public.contacts where id = p_contact_id and user_id = owner_id)
    then raise exception 'Lead not found' using errcode = '42501'; end if;
  if jsonb_typeof(p_sales_context) is distinct from 'object'
    then raise exception 'Invalid sales context'; end if;
  if coalesce(length(p_sales_context->>'interest'), 0) > 120
    or coalesce(length(p_sales_context->>'next_action'), 0) > 1000
    or coalesce(length(p_sales_context->>'notes'), 0) > 12000
    then raise exception 'Sales context exceeds field limits'; end if;
  if p_sales_context ? 'objections' and jsonb_typeof(p_sales_context->'objections') <> 'array'
    then raise exception 'Invalid objections'; end if;
  if jsonb_array_length(coalesce(p_sales_context->'objections', '[]'::jsonb)) > 40
    or exists (select 1 from jsonb_array_elements(coalesce(p_sales_context->'objections', '[]'::jsonb)) x
      where jsonb_typeof(x) <> 'string' or length(x #>> '{}') > 1000)
    then raise exception 'Invalid objections'; end if;
  if p_sales_context->>'presented_price' is not null and (
    jsonb_typeof(p_sales_context->'presented_price') <> 'number'
    or (p_sales_context->>'presented_price')::numeric < 0
    or (p_sales_context->>'presented_price')::numeric > 9999999999.99)
    then raise exception 'Invalid presented price'; end if;
  if nullif(p_sales_context->>'next_followup_at', '') is not null
    then perform (p_sales_context->>'next_followup_at')::timestamptz; end if;
  normalized := jsonb_build_object(
    'interest', nullif(p_sales_context->>'interest', ''),
    'objections', coalesce(p_sales_context->'objections', '[]'::jsonb),
    'next_action', nullif(p_sales_context->>'next_action', ''),
    'next_followup_at', nullif(p_sales_context->>'next_followup_at', ''),
    'presented_price', p_sales_context->'presented_price',
    'notes', nullif(p_sales_context->>'notes', ''));
  insert into public.lead_intelligence(contact_id, user_id, sales_context)
    values (p_contact_id, owner_id, normalized)
  on conflict (contact_id) do update set sales_context = excluded.sales_context
  returning * into result;
  return to_jsonb(result);
end $$;

revoke all on function public.save_lead_sales_context(uuid, jsonb) from public, anon;
grant execute on function public.save_lead_sales_context(uuid, jsonb) to authenticated;

create or replace function public.save_lead_manual_fact(p_contact_id uuid, p_fact jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := (select auth.uid());
  fact jsonb;
  source_url text := nullif(trim(p_fact->>'source_url'), '');
  result public.lead_intelligence%rowtype;
begin
  if owner_id is null or not exists (select 1 from public.contacts where id = p_contact_id and user_id = owner_id)
    then raise exception 'Lead not found' using errcode = '42501'; end if;
  if jsonb_typeof(p_fact) is distinct from 'object'
    or coalesce(length(trim(p_fact->>'key')), 0) not between 1 and 80
    or coalesce(length(trim(p_fact->>'value')), 0) not between 1 and 6000
    then raise exception 'Invalid fact'; end if;
  if source_url is not null and (length(source_url) > 4096
    or source_url !~ '^https?://[^[:space:]/?#@]+([/?#][^[:space:]]*)?$')
    then raise exception 'Invalid source URL'; end if;
  fact := jsonb_build_object('key', trim(p_fact->>'key'), 'value', trim(p_fact->>'value'),
    'source', 'user_provided', 'source_url', source_url, 'confidence', null,
    'collected_at', now(), 'type', 'user_provided');
  insert into public.lead_intelligence(contact_id, user_id, facts)
    values (p_contact_id, owner_id, jsonb_build_array(fact))
  on conflict (contact_id) do update set facts = coalesce((
    select jsonb_agg(x) from jsonb_array_elements(public.lead_intelligence.facts) x
    where not (x->>'type' = 'user_provided' and x->>'key' = fact->>'key')), '[]'::jsonb) || jsonb_build_array(fact)
  returning * into result;
  return to_jsonb(result);
end $$;

revoke all on function public.save_lead_manual_fact(uuid, jsonb) from public, anon;
grant execute on function public.save_lead_manual_fact(uuid, jsonb) to authenticated;

-- One transaction publishes the audit, latest observations and timeline event.
create or replace function public.complete_lead_audit(
  p_audit_id uuid, p_status text, p_result jsonb, p_error text, p_final_url text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  audit public.lead_site_audits%rowtype;
  observed jsonb;
begin
  if p_status is null or p_status not in ('completed', 'partial', 'failed') then raise exception 'Invalid terminal status'; end if;
  observed := coalesce(p_result->'facts', '[]'::jsonb);
  if jsonb_typeof(observed) <> 'array' then raise exception 'Invalid audit facts'; end if;
  if exists (select 1 from jsonb_array_elements(observed) x
    where coalesce(x->>'type', '') not in ('verified', 'observed', 'inferred')
      or coalesce(x->>'source', '') not like 'site_audit:%'
      or coalesce(length(x->>'value'), 0) = 0)
    then raise exception 'Invalid audit provenance'; end if;
  update public.lead_site_audits
    set status = p_status, result = p_result, error = p_error, final_url = p_final_url, completed_at = now()
    where id = p_audit_id and status in ('queued', 'fetching', 'analyzing')
    returning * into audit;
  if not found then
    select * into audit from public.lead_site_audits where id = p_audit_id;
    return to_jsonb(audit);
  end if;
  if p_status <> 'failed' then
    insert into public.lead_intelligence(contact_id, user_id, facts)
      values (audit.contact_id, audit.user_id, observed)
    on conflict (contact_id) do update set facts = coalesce((
      select jsonb_agg(x) from jsonb_array_elements(public.lead_intelligence.facts) x
      where coalesce(x->>'source', '') not like 'site_audit:%'), '[]'::jsonb) || observed;
  end if;
  insert into public.interactions(user_id, contact_id, type, content, direction, metadata)
    values (audit.user_id, audit.contact_id, 'other',
      case when p_status = 'failed' then 'Não foi possível analisar este site: ' || coalesce(p_error, 'falha desconhecida')
        when p_status = 'partial' then 'Auditoria do site concluída com limitações.'
        else 'Auditoria do site concluída.' end,
      null, jsonb_build_object('event', case when p_status = 'failed' then 'site_audit_failed' else 'site_audit_completed' end,
        'audit_id', audit.id, 'url', audit.url, 'status', p_status));
  return to_jsonb(audit);
end $$;

revoke all on function public.complete_lead_audit(uuid, text, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.complete_lead_audit(uuid, text, jsonb, text, text) to service_role;

-- Preserve structured provider observations when a Hunter result becomes a lead.
alter table public.prospect_searches add column if not exists results jsonb not null default '[]'::jsonb
  check (jsonb_typeof(results) = 'array');
create index if not exists prospect_searches_results_idx on public.prospect_searches using gin(results jsonb_path_ops);

create or replace function public.capture_hunter_lead_intelligence()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  place jsonb;
  observed_at timestamptz;
  provider_facts jsonb := '[]'::jsonb;
  item record;
begin
  if new.place_id is null or new.origin is distinct from 'Buyers Hunter' then return new; end if;
  select p, s.created_at into place, observed_at
    from public.prospect_searches s cross join lateral jsonb_array_elements(s.results) p
    where s.user_id = new.user_id and p->>'id' = new.place_id
      and s.results @> jsonb_build_array(jsonb_build_object('id', new.place_id))
    order by s.created_at desc limit 1;
  if place is null then return new; end if;
  for item in select key, value from jsonb_each_text(jsonb_build_object(
    'company_name', place->>'name', 'niche', place->>'category', 'city', place->>'city',
    'address', place->>'address', 'phone', place->>'phone', 'email', place->>'email',
    'website', case when place->>'website_status' = 'yes' then place->>'website' end,
    'website_status', place->>'website_status',
    'social_url', case when place->>'website_kind' = 'social' then place->>'website' end,
    'maps_url', place->>'maps_url', 'rating', place->>'rating',
    'reviews', case when (place->>'reviews')::numeric > 0 then place->>'reviews' end,
    'origin', place->>'source'))
  loop
    if nullif(trim(item.value), '') is not null then
      provider_facts := provider_facts || jsonb_build_array(jsonb_build_object('key', item.key, 'value', item.value,
        'source', 'buyers_hunter:apify', 'source_url', place->>'maps_url', 'confidence', null,
        'collected_at', observed_at, 'type', 'observed'));
    end if;
  end loop;
  insert into public.lead_intelligence(contact_id, user_id, facts) values(new.id, new.user_id, provider_facts)
    on conflict (contact_id) do update set facts = coalesce((
      select jsonb_agg(x) from jsonb_array_elements(public.lead_intelligence.facts) x
      where coalesce(x->>'source', '') <> 'buyers_hunter:apify' or x->>'type' = 'user_provided'), '[]'::jsonb) || provider_facts;
  return new;
end $$;

revoke all on function public.capture_hunter_lead_intelligence() from public, anon, authenticated;

create trigger contacts_capture_hunter_intelligence after insert or update of place_id on public.contacts
  for each row execute function public.capture_hunter_lead_intelligence();

-- A new provider search refreshes observations for already-imported leads,
-- without overwriting the owner's contact fields or sales context.
create or replace function public.refresh_existing_hunter_intelligence()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.contacts c set place_id = c.place_id
    where c.user_id = new.user_id and c.origin = 'Buyers Hunter'
      and c.place_id is not null
      and new.results @> jsonb_build_array(jsonb_build_object('id', c.place_id));
  return new;
end $$;

revoke all on function public.refresh_existing_hunter_intelligence() from public, anon, authenticated;

create trigger prospect_searches_refresh_intelligence after insert on public.prospect_searches
  for each row execute function public.refresh_existing_hunter_intelligence();

create or replace function public.record_lead_sales_context()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  previous jsonb := case when tg_op = 'UPDATE' then old.sales_context else '{}'::jsonb end;
  content text := 'Contexto comercial atualizado.';
  objections text;
begin
  if new.sales_context = '{}'::jsonb or new.sales_context is not distinct from previous then return new; end if;
  if new.sales_context->'objections' is distinct from previous->'objections'
    and jsonb_array_length(coalesce(new.sales_context->'objections', '[]'::jsonb)) > 0 then
    select string_agg(value, '; ') into objections from jsonb_array_elements_text(new.sales_context->'objections');
    content := content || E'\nObjeções registradas: ' || objections;
  end if;
  if nullif(new.sales_context->>'interest', '') is not null then
    content := content || E'\nInteresse: ' || (new.sales_context->>'interest');
  end if;
  if nullif(new.sales_context->>'next_action', '') is not null then
    content := content || E'\nPróxima ação: ' || (new.sales_context->>'next_action');
  end if;
  insert into public.interactions(user_id, contact_id, type, content, direction, metadata)
    values(new.user_id, new.contact_id, 'other', content, null,
      jsonb_build_object('event', 'sales_intelligence_updated', 'sales_context', new.sales_context));
  return new;
end $$;

revoke all on function public.record_lead_sales_context() from public, anon, authenticated;

create trigger lead_intelligence_sales_timeline after insert or update of sales_context on public.lead_intelligence
  for each row execute function public.record_lead_sales_context();

commit;
