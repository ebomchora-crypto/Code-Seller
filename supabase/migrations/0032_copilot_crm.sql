begin;

alter table public.autopilot_conversations
  add column if not exists contact_id uuid references public.contacts(id) on delete cascade;
create unique index if not exists autopilot_conversations_lead_idx
  on public.autopilot_conversations(user_id, contact_id) where contact_id is not null;
alter table public.autopilot_messages add column if not exists analysis jsonb;
alter table public.interactions add column if not exists direction text
  check (direction in ('inbound', 'outbound'));
alter table public.interactions add column if not exists metadata jsonb;
alter table public.tasks add column if not exists kind text not null default 'task'
  check (kind in ('task', 'follow_up', 'meeting', 'next_action'));
alter table public.tasks add column if not exists copilot_key text;
create index if not exists interactions_contact_time_idx on public.interactions(contact_id, occurred_at desc);
create unique index if not exists interactions_copilot_summary_idx on public.interactions(user_id, (metadata ->> 'analysis_message_id'))
  where metadata ->> 'event' = 'summary' and metadata ->> 'analysis_message_id' is not null;
create unique index if not exists tasks_copilot_key_idx on public.tasks(user_id, copilot_key) where copilot_key is not null;

-- A lead conversation can only reference a contact owned by the same user.
create or replace function public.check_copilot_contact_owner()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.contact_id is not null and not exists (
    select 1 from public.contacts where id = new.contact_id and user_id = new.user_id
  ) then raise exception 'Contato indisponivel para esta conversa.'; end if;
  return new;
end;
$$;
drop trigger if exists autopilot_contact_owner on public.autopilot_conversations;
create trigger autopilot_contact_owner before insert or update on public.autopilot_conversations
  for each row execute function public.check_copilot_contact_owner();

-- Claim before execution, including across tabs/devices. Completed claims cannot replay.
create or replace function public.claim_copilot_action(p_message_id uuid, p_index integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_actions jsonb; v_action jsonb;
begin
  select actions into v_actions from public.autopilot_messages
    where id = p_message_id and user_id = (select auth.uid()) and role = 'assistant' for update;
  if not found or p_index is null or p_index < 0 or jsonb_typeof(v_actions) is distinct from 'array'
    or p_index >= jsonb_array_length(v_actions) then return false; end if;
  v_action := v_actions -> p_index;
  if coalesce(v_action ->> 'status', '') not in ('pending', 'failed') then return false; end if;
  update public.autopilot_messages set actions = jsonb_set(v_actions, array[p_index::text, 'status'], '"confirmed"'::jsonb)
    where id = p_message_id and user_id = (select auth.uid());
  return true;
end;
$$;
revoke all on function public.claim_copilot_action(uuid, integer) from public, anon;
grant execute on function public.claim_copilot_action(uuid, integer) to authenticated;

create or replace function public.set_copilot_action_status(p_message_id uuid, p_index integer, p_status text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_actions jsonb; v_status text;
begin
  select actions into v_actions from public.autopilot_messages
    where id = p_message_id and user_id = (select auth.uid()) and role = 'assistant' for update;
  if not found or p_index is null or p_index < 0 or jsonb_typeof(v_actions) is distinct from 'array'
    or p_index >= jsonb_array_length(v_actions) then return false; end if;
  v_status := v_actions -> p_index ->> 'status';
  if not coalesce(
    (p_status = 'rejected' and v_status in ('pending', 'failed')) or
    (p_status in ('executed', 'failed') and v_status = 'confirmed'), false
  ) then return false; end if;
  update public.autopilot_messages set actions = jsonb_set(v_actions, array[p_index::text, 'status'], to_jsonb(p_status))
    where id = p_message_id and user_id = (select auth.uid());
  return true;
end;
$$;
revoke all on function public.set_copilot_action_status(uuid, integer, text) from public, anon;
grant execute on function public.set_copilot_action_status(uuid, integer, text) to authenticated;
commit;
