-- Code Sellers — Status do contato acompanha os negócios
-- Execute este arquivo no Supabase SQL Editor (pode rodar mais de uma vez).
--
-- Antes era preciso mudar a mesma coisa em dois lugares (etapa do negócio e
-- status do contato). Agora:
--   • negócio aberto para um Lead (ou Inativo/Perdido) → contato vira Negociando;
--   • negócio ganho → contato vira Cliente.
-- Negócio perdido não mexe no contato (ele pode ter outros negócios).

create or replace function public.sync_contact_status_from_deal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.contact_id is null then
    return new;
  end if;

  if new.status = 'won' then
    update public.contacts
      set status = 'client'
      where id = new.contact_id
        and user_id = new.user_id
        and status <> 'client';
  elsif new.status = 'open' then
    update public.contacts
      set status = 'negotiating'
      where id = new.contact_id
        and user_id = new.user_id
        and status in ('lead', 'inactive', 'lost');
  end if;

  return new;
end;
$$;

revoke all on function public.sync_contact_status_from_deal() from public, anon, authenticated;

drop trigger if exists deals_sync_contact_status on public.deals;
create trigger deals_sync_contact_status
  after insert or update of status, contact_id on public.deals
  for each row execute function public.sync_contact_status_from_deal();
