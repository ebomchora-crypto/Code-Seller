-- Code Sellers — Code Maker: gravação das partes sem conflito
-- Execute este arquivo no Supabase SQL Editor (pode rodar mais de uma vez).
--
-- As seções de um site são escritas em paralelo; cada uma termina numa
-- chamada diferente. Estas funções juntam a parte ao site de forma atômica
-- (uma não apaga a outra) e marcam o site como pronto uma única vez.
-- Só a função code-maker (chave de serviço) usa.

create or replace function public.code_maker_merge_part(p_site uuid, p_part text, p_html text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  update public.sites
  set parts = parts || jsonb_build_object(p_part, p_html)
  where id = p_site
  returning parts;
$$;

create or replace function public.code_maker_mark_ready(p_site uuid, p_html text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with updated as (
    update public.sites
    set html = p_html, status = 'ready'
    where id = p_site and status = 'building'
    returning 1
  )
  select exists (select 1 from updated);
$$;

revoke all on function public.code_maker_merge_part(uuid, text, text) from public, anon, authenticated;
revoke all on function public.code_maker_mark_ready(uuid, text) from public, anon, authenticated;
