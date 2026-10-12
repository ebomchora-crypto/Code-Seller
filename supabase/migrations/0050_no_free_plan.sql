-- Fim do plano grátis: sem assinatura (ou conta liberada) não há acesso.
-- Já aplicada no banco; este arquivo documenta o que mudou.
-- billing_status_for não tem mais o estado 'trial' e novas contas nascem com trial_ends_at = agora.
-- site_owner_plan devolve 'paid' ou 'none' (site de quem não paga fica fora do ar).
alter table public.account_access alter column trial_ends_at set default now();
-- (As funções billing_status_for e site_owner_plan foram recriadas sem o ramo do teste grátis.)
-- Quem paga (ou tem conta liberada) usa tudo sem limite: usage_for devolve limite null para
-- Copilot, sites, alterações e buscas do Buyers Hunter (0 só para quem não tem acesso).
