begin;

alter table public.autopilot_conversations
  add column if not exists commercial_memory text,
  add column if not exists preferences jsonb;

-- A message cannot be attached to another user's conversation.
create or replace function public.check_copilot_message_owner()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (
    select 1 from public.autopilot_conversations
    where id = new.conversation_id and user_id = new.user_id
  ) then raise exception 'Conversa indisponivel para esta mensagem.'; end if;
  return new;
end;
$$;
drop trigger if exists autopilot_message_owner on public.autopilot_messages;
create trigger autopilot_message_owner before insert or update on public.autopilot_messages
  for each row execute function public.check_copilot_message_owner();

create index if not exists autopilot_messages_conversation_recent_idx
  on public.autopilot_messages(conversation_id, created_at desc, id desc);

commit;
