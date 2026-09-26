-- Code Sellers — funções internas mais seguras (avisos do Security Advisor).

-- Categorias padrão do Financeiro: mesmo comportamento, agora com search_path
-- fixo, recusando chamada sem login e só para usuários logados.
create or replace function public.seed_default_financial_categories()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Não autenticado.';
  end if;
  insert into public.financial_categories (user_id, name, type, color)
  values
    (uid, 'Desenvolvimento de Site', 'income', '#22c55e'),
    (uid, 'Landing Page', 'income', '#3b82f6'),
    (uid, 'Loja Virtual', 'income', '#a855f7'),
    (uid, 'Sistema', 'income', '#6366f1'),
    (uid, 'Manutenção', 'income', '#10b981'),
    (uid, 'Hospedagem', 'income', '#f59e0b'),
    (uid, 'Consultoria', 'income', '#ec4899'),
    (uid, 'Outros', 'income', '#71717a'),
    (uid, 'Ferramentas e Software', 'expense', '#ef4444'),
    (uid, 'Hospedagem e Infraestrutura', 'expense', '#f97316'),
    (uid, 'Marketing', 'expense', '#eab308'),
    (uid, 'Impostos', 'expense', '#dc2626'),
    (uid, 'Cursos e Educação', 'expense', '#0ea5e9'),
    (uid, 'Equipamentos', 'expense', '#8b5cf6'),
    (uid, 'Outros', 'expense', '#71717a')
  on conflict (user_id, name, type) do nothing;
end;
$$;
revoke all on function public.seed_default_financial_categories() from public, anon;
grant execute on function public.seed_default_financial_categories() to authenticated;

-- Gatilho de cadastro: só o próprio banco dispara; ninguém chama pela API.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Gatilho de updated_at com search_path fixo.
alter function public.update_updated_at() set search_path = '';
