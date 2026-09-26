-- Code Sellers — Data real do ganho de cada negócio
-- Execute este arquivo no Supabase SQL Editor.
--
-- Até aqui a receita usava deals.updated_at: editar um negócio ganho (uma
-- anotação, o valor) jogava a receita dele para o mês da edição. Agora cada
-- negócio guarda won_at, preenchido sozinho quando o status vira 'won'.

alter table deals add column if not exists won_at timestamptz;

-- Negócios já ganhos: a melhor estimativa disponível é a última atualização.
update deals set won_at = updated_at where status = 'won' and won_at is null;

create or replace function set_deal_won_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'won' then
    if tg_op = 'INSERT' or old.status is distinct from 'won' then
      new.won_at := coalesce(new.won_at, now());
    end if;
  else
    new.won_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists deals_set_won_at on deals;
create trigger deals_set_won_at
  before insert or update of status on deals
  for each row execute function set_deal_won_at();

create index if not exists deals_user_won_at_idx on deals(user_id, won_at) where won_at is not null;
