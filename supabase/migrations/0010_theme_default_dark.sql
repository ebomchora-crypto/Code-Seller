-- Code Sellers — O app é escuro por padrão
-- Execute este arquivo no Supabase SQL Editor.
--
-- user_profiles.theme nascia 'light', e o app aplica o tema salvo no perfil
-- por cima do padrão escuro — então toda conta nova abria no claro.

alter table public.user_profiles alter column theme set default 'dark';
