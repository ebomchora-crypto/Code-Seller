-- CS Copilot: arquivos anexados às mensagens (imagens, PDF, Word, texto).
-- Guarda nome, tipo, tamanho, o texto lido do documento e uma miniatura
-- pequena da imagem, para mostrar na conversa e reaproveitar no histórico.
alter table public.autopilot_messages
  add column if not exists attachments jsonb not null default '[]'::jsonb;
