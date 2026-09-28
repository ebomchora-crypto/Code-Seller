-- Code Sellers — Sellers Portfolio: ajuste da imagem do projeto na área.
-- Execute este arquivo no Supabase SQL Editor (pode rodar mais de uma vez).
--
-- Guarda que parte da imagem aparece no quadro do projeto:
-- { "x": 0-100, "y": 0-100, "zoom": 1-3, "fit": "cover" | "contain" }
-- Vazio = centralizada, preenchendo o quadro (como era antes).

alter table public.portfolio_projects add column if not exists image_crop jsonb;

alter table public.portfolio_projects drop constraint if exists portfolio_projects_image_crop_check;
alter table public.portfolio_projects add constraint portfolio_projects_image_crop_check
  check (image_crop is null or (jsonb_typeof(image_crop) = 'object' and pg_column_size(image_crop) < 512));

-- Ver a própria pasta de imagens: sem isto, apagar a imagem antiga (ao trocar
-- ou remover) não encontrava o arquivo e ele ficava sobrando.
drop policy if exists "portfolio: dono vê" on storage.objects;
create policy "portfolio: dono vê"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'portfolio' and (select auth.uid())::text = (storage.foldername(name))[1]);
