-- Accounts approved by the founder no longer require a separate email confirmation.

create or replace function private.confirm_auth_on_admin_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.is_active is false and new.is_active is true then
    update auth.users
      set email_confirmed_at = coalesce(email_confirmed_at, now()),
          updated_at = now()
      where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_platform_account_approved on public.users;
create trigger on_platform_account_approved
  after update of is_active on public.users
  for each row execute function private.confirm_auth_on_admin_approval();
