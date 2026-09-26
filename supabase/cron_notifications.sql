-- Code Sellers — Agenda o envio das notificações (a cada 5 minutos)
--
-- Antes de rodar:
--   1. Database → Extensions: ative pg_cron e pg_net.
--   2. Troque SEU_PROJETO pelo ID do projeto (o que aparece na URL do Supabase:
--      https://SEU_PROJETO.supabase.co).
--   3. Troque SEU_SEGREDO pelo mesmo valor salvo no secret CRON_SECRET da função.

select cron.unschedule('code-sellers-notifications')
where exists (select 1 from cron.job where jobname = 'code-sellers-notifications');

select cron.schedule(
  'code-sellers-notifications',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://SEU_PROJETO.supabase.co/functions/v1/notifications-dispatch',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'SEU_SEGREDO'),
    body := '{"action":"dispatch"}'::jsonb
  );
  $$
);
