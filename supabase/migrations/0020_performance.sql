-- Code Sellers — desempenho do banco para quando houver muitos usuários.
-- Execute no Supabase SQL Editor (pode rodar mais de uma vez).
--
-- 1) Regras de acesso (RLS): "auth.uid()" era recalculado a cada linha.
--    Trocamos por "(select auth.uid())", que o Postgres calcula uma vez por
--    consulta. A regra continua exatamente a mesma.
-- 2) Índices nas chaves estrangeiras que ainda não tinham.

do $$
declare
  pol record;
  new_qual text;
  new_check text;
  stmt text;
begin
  for pol in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (qual ~ 'auth\.uid\(\)' or with_check ~ 'auth\.uid\(\)')
  loop
    -- Só troca ocorrências que ainda não estão dentro de um SELECT.
    new_qual := regexp_replace(pol.qual, '(?<!SELECT )auth\.uid\(\)', '(select auth.uid())', 'g');
    new_check := regexp_replace(pol.with_check, '(?<!SELECT )auth\.uid\(\)', '(select auth.uid())', 'g');
    if new_qual is distinct from pol.qual or new_check is distinct from pol.with_check then
      stmt := format('alter policy %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
      if new_qual is not null then
        stmt := stmt || format(' using (%s)', new_qual);
      end if;
      if new_check is not null then
        stmt := stmt || format(' with check (%s)', new_check);
      end if;
      execute stmt;
    end if;
  end loop;
end
$$;

create index if not exists autopilot_messages_user_id_idx on public.autopilot_messages(user_id);
create index if not exists contact_tags_tag_id_idx on public.contact_tags(tag_id);
create index if not exists contacts_assigned_to_idx on public.contacts(assigned_to);
create index if not exists crm_statuses_user_id_idx on public.crm_statuses(user_id);
create index if not exists deal_activities_user_id_idx on public.deal_activities(user_id);
create index if not exists deal_contracts_user_id_idx on public.deal_contracts(user_id);
create index if not exists interactions_user_id_idx on public.interactions(user_id);
create index if not exists online_proposals_user_id_idx on public.online_proposals(user_id);
create index if not exists pipeline_stages_user_id_idx on public.pipeline_stages(user_id);
create index if not exists portfolio_projects_deal_id_idx on public.portfolio_projects(deal_id);
create index if not exists receivables_contact_id_idx on public.receivables(contact_id);
create index if not exists receivables_transaction_id_idx on public.receivables(transaction_id);
create index if not exists support_messages_ticket_id_idx on public.support_messages(ticket_id);
create index if not exists support_messages_user_id_idx on public.support_messages(user_id);
create index if not exists support_tickets_user_id_idx on public.support_tickets(user_id);
create index if not exists task_tags_tag_id_idx on public.task_tags(tag_id);
create index if not exists tasks_assigned_to_idx on public.tasks(assigned_to);
create index if not exists transactions_category_id_idx on public.transactions(category_id);
