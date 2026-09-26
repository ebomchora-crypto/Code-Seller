-- Code Sellers — mais folga para o disparo de avisos.
-- O pg_net desiste da chamada depois de 5 s por padrão; em horários cheios
-- (:00, :15, :30) a função às vezes passa disso. 30 s evita perder o disparo.

select cron.unschedule('code-sellers-notifications')
where exists (select 1 from cron.job where jobname = 'code-sellers-notifications');

select cron.schedule(
  'code-sellers-notifications',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://mfzlwynqjbusyudstdds.supabase.co/functions/v1/notifications-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select value from public.app_config where key = 'cron_secret')
    ),
    body := '{"action":"dispatch"}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
