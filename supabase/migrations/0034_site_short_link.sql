-- Link curto dos sites do Code Maker: codesellers.vercel.app/apelido.
-- Nomes que são telas do sistema não podem virar apelido
-- (mesma lista de RESERVED_SLUGS em supabase/functions/code-maker/site.ts).
alter table public.sites drop constraint if exists sites_slug_not_reserved;
alter table public.sites add constraint sites_slug_not_reserved check (slug <> all (array[
  'login', 'register', 'forgot-password', 'proposta', 'sala-de-receita', 'aluno', 'prospection', 'crm',
  'portfolio', 'deals', 'financial', 'tasks', 'relatorios', 'copilot', 'autopilot', 'code-maker', 'settings',
  'support', 'agenda', 'assets', 'downloads', 'api', 'admin', 'app', 'auth', 'dashboard', 'entrar', 'cadastro',
  'termos', 'privacidade', 'ajuda', 'suporte', 'precos', 'planos', 'blog', 'reset-password', 'signup', 'logout'
]));
