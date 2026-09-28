-- Code Sellers — Code Maker: logo e fotos do cliente para os sites.
-- Execute este arquivo no Supabase SQL Editor (pode rodar mais de uma vez).
--
-- Imagens públicas (aparecem no site publicado), uma pasta por usuário.
-- Só imagens comuns, até 5 MB (o app já reduz antes de enviar).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "site-assets: dono envia" on storage.objects;
create policy "site-assets: dono envia"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-assets' and (select auth.uid())::text = (storage.foldername(name))[1]);

-- Ver a própria pasta (sem isto o "apaga" não encontra os arquivos).
drop policy if exists "site-assets: dono vê" on storage.objects;
create policy "site-assets: dono vê"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'site-assets' and (select auth.uid())::text = (storage.foldername(name))[1]);

drop policy if exists "site-assets: dono apaga" on storage.objects;
create policy "site-assets: dono apaga"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-assets' and (select auth.uid())::text = (storage.foldername(name))[1]);
