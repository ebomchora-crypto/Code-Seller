-- Run in the SQL Editor. All fixture rows are rolled back.
begin;
do $$
declare u uuid; c uuid; m uuid;
begin
  select id into u from auth.users order by created_at limit 1;
  if u is null then raise exception 'An existing account is required for this test'; end if;
  insert into public.autopilot_conversations(user_id,title) values(u,'Rollback-only test') returning id into c;
  insert into public.autopilot_messages(user_id,conversation_id,role,content,actions)
    values(u,c,'assistant','Rollback-only test','[{"status":"pending"},{"status":"pending"}]'::jsonb) returning id into m;
  perform set_config('request.jwt.claim.sub',u::text,true);
  perform set_config('copilot.test_message',m::text,true);
end $$;
set local role authenticated;
do $$
declare m uuid := current_setting('copilot.test_message')::uuid;
begin
  if not public.claim_copilot_action(m,0) then raise exception 'Initial claim failed'; end if;
  if public.claim_copilot_action(m,0) then raise exception 'Duplicate claim accepted'; end if;
  if public.set_copilot_action_status(m,0,'rejected') then raise exception 'Claimed action rejected'; end if;
  if not public.claim_copilot_action(m,1) then raise exception 'Second action claim failed'; end if;
  if not public.set_copilot_action_status(m,0,'executed') then raise exception 'Execution update failed'; end if;
  if public.claim_copilot_action(m,1) then raise exception 'Other action claim was overwritten'; end if;
  if public.set_copilot_action_status(m,0,'failed') then raise exception 'Completed action reopened'; end if;
  if public.claim_copilot_action(m,-1) or public.claim_copilot_action(m,null) then raise exception 'Invalid index accepted'; end if;
  perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
  if public.set_copilot_action_status(m,1,'executed') then raise exception 'Cross-user update accepted'; end if;
  if exists(select 1 from public.autopilot_messages where id=m) then raise exception 'RLS leaked another user message'; end if;
end $$;
rollback;
select 'PASS: duplicate claims, independent actions, transitions, invalid indexes and cross-user RLS; fixture rolled back' as result;
