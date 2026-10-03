-- Sites do Code Maker no teste grátis: mostram o selo "Feito com Code Sellers"
-- e saem do ar quando o teste acaba sem assinatura. Volta sozinho ao assinar
-- (a situação do dono é calculada a cada visita).

-- Plano do dono de um site, só leitura (mesmas regras de billing_status_for,
-- sem gravar nada): 'paid' (assinante ou conta liberada), 'trial' ou 'none'.
create or replace function public.site_owner_plan(p_user uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  access public.account_access;
  sub public.subscriptions;
  owner_email text;
  has_access boolean;
begin
  select * into access from public.account_access where user_id = p_user;
  has_access := found;
  if has_access and access.exempt then
    return 'paid';
  end if;

  select lower(email) into owner_email from auth.users where id = p_user;
  select * into sub from public.subscriptions
    where user_id = p_user or (owner_email is not null and email = owner_email)
    order by updated_at desc limit 1;

  if sub.status = 'active'
    or (sub.status = 'late' and sub.updated_at > now() - interval '5 days')
    or (sub.status = 'canceled' and sub.next_charge_at > now()) then
    return 'paid';
  end if;

  -- Conta sem linha de acesso ainda está no começo do teste.
  if not has_access or access.trial_ends_at > now() then
    if sub.status is distinct from 'refunded' then
      return 'trial';
    end if;
  end if;
  return 'none';
end;
$$;

revoke all on function public.site_owner_plan(uuid) from public, anon, authenticated;

-- Página pública /apelido: devolve o HTML com o selo no teste grátis, ou
-- "fora do ar" quando o teste do dono acabou sem assinatura.
create or replace function public.get_public_site(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_site public.sites%rowtype;
  v_plan text;
begin
  select * into v_site from public.sites
  where slug = lower(p_slug) and published and status = 'ready' and html is not null;
  if not found then
    return null;
  end if;

  v_plan := public.site_owner_plan(v_site.user_id);
  if v_plan = 'none' then
    return jsonb_build_object('name', v_site.name, 'offline', true);
  end if;

  update public.sites set views = views + 1 where id = v_site.id;
  return jsonb_build_object('name', v_site.name, 'html', v_site.html, 'badge', v_plan = 'trial');
end;
$$;

revoke all on function public.get_public_site(text) from public;
grant execute on function public.get_public_site(text) to anon, authenticated;
