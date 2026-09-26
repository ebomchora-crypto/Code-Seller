-- Code Sellers — Agenda o envio das notificações (a cada 5 minutos)
-- (já aplicado no projeto). O segredo do cron vem de public.app_config.

select cron.unschedule('code-sellers-notifications')
where exists (select 1 from cron.job where jobname = 'code-sellers-notifications');

select cron.schedule(
  'code-sellers-notifications',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := 'https://mfzlwynqjbusyudstdds.supabase.co/functions/v1/notifications-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select value from public.app_config where key = 'cron_secret')
    ),
    body := '{"action":"dispatch"}'::jsonb
  );
  $job$
);
