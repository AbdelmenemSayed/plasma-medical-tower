-- Replace email confirmation with founder-controlled account activation.

alter table public.insurance_profiles
  alter column activation_status set default 'PENDING_ADMIN';

drop trigger if exists on_insurance_email_verified on auth.users;

create or replace function private.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_active from public.users where id = (select auth.uid()) limit 1), false)
$$;

revoke all on function private.current_user_is_active() from public;
grant execute on function private.current_user_is_active() to authenticated;

create or replace function private.route_new_account_to_admin_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  registration_type text := coalesce(new.raw_user_meta_data->>'registration_type', '');
  new_org_id uuid;
begin
  if registration_type = 'insurance' then
    select organization_id into new_org_id from public.users where id = new.id;

    update public.users set is_active = false where id = new.id;
    update public.organizations set is_active = false where id = new_org_id;
    update public.insurance_profiles
      set activation_status = 'PENDING_ADMIN', activated_at = null, activated_by = null
      where organization_id = new_org_id;

  elsif registration_type = 'provider' then
    insert into public.organizations (
      name, type, phone, email, address, governorate, area, is_active
    ) values (
      coalesce(nullif(new.raw_user_meta_data->>'provider_name', ''), 'مقدم خدمة جديد'),
      'PROVIDER_CLINIC',
      coalesce(nullif(new.raw_user_meta_data->>'phone', ''), 'غير محدد'),
      new.email,
      coalesce(nullif(new.raw_user_meta_data->>'address', ''), 'غير محدد'),
      coalesce(nullif(new.raw_user_meta_data->>'governorate', ''), 'القاهرة'),
      coalesce(nullif(new.raw_user_meta_data->>'area', ''), 'غير محدد'),
      false
    ) returning id into new_org_id;

    insert into public.users (id, organization_id, full_name, phone, email, role_name, is_active)
    values (
      new.id,
      new_org_id,
      coalesce(nullif(new.raw_user_meta_data->>'provider_name', ''), 'مقدم خدمة جديد'),
      coalesce(nullif(new.raw_user_meta_data->>'phone', ''), 'غير محدد'),
      new.email,
      'PROVIDER_ADMIN',
      false
    );

    insert into public.provider_profiles (
      organization_id, provider_name, category, specialty, license_number,
      governorate, area, address, fee_estimate, verification_status, match_score
    ) values (
      new_org_id,
      coalesce(nullif(new.raw_user_meta_data->>'provider_name', ''), 'مقدم خدمة جديد'),
      'عيادة تخصية',
      coalesce(nullif(new.raw_user_meta_data->>'specialty', ''), 'طب عام'),
      coalesce(nullif(new.raw_user_meta_data->>'license_number', ''), 'قيد المراجعة'),
      coalesce(nullif(new.raw_user_meta_data->>'governorate', ''), 'القاهرة'),
      coalesce(nullif(new.raw_user_meta_data->>'area', ''), 'غير محدد'),
      coalesce(nullif(new.raw_user_meta_data->>'address', ''), 'غير محدد'),
      coalesce(nullif(new.raw_user_meta_data->>'fee_estimate', ''), 'يحدد لاحقًا'),
      'PENDING_REVIEW',
      70
    );
  else
    return new;
  end if;

  insert into public.platform_notifications (
    target_role, notification_type, title, message
  ) values (
    'ADMIN',
    'ACCOUNT_ACTIVATION',
    'طلب تفعيل حساب جديد',
    case when registration_type = 'insurance'
      then 'شركة تأمين جديدة تنتظر موافقة الإدارة.'
      else 'مقدم خدمة جديد ينتظر مراجعة الإدارة.'
    end
  );

  return new;
end;
$$;

drop trigger if exists zz_route_new_account_to_admin_review on auth.users;
create trigger zz_route_new_account_to_admin_review
  after insert on auth.users
  for each row execute function private.route_new_account_to_admin_review();

create or replace function public.admin_review_account(
  account_org_id uuid,
  decision text,
  review_notes text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_type text;
  approved boolean;
begin
  if (select role_name from public.users where id = (select auth.uid())) <> 'ADMIN' then
    raise exception 'Admin access required';
  end if;
  if decision not in ('APPROVE', 'REJECT') then
    raise exception 'Invalid review decision';
  end if;

  select type into org_type from public.organizations where id = account_org_id for update;
  if org_type is null then raise exception 'Account organization not found'; end if;
  approved := decision = 'APPROVE';

  update public.organizations
    set is_active = approved, updated_at = now()
    where id = account_org_id;
  update public.users
    set is_active = approved, updated_at = now()
    where organization_id = account_org_id;

  if org_type in ('INSURANCE_COMPANY', 'TPA') then
    update public.insurance_profiles
      set activation_status = case when approved then 'ACTIVE' else 'REJECTED' end,
          activated_at = case when approved then now() else null end,
          activated_by = case when approved then (select auth.uid()) else null end
      where organization_id = account_org_id;
  else
    update public.provider_profiles
      set verification_status = case when approved then 'VERIFIED' else 'REJECTED' end,
          verification_date = case when approved then now() else null end,
          updated_at = now()
      where organization_id = account_org_id;
  end if;

  insert into public.platform_notifications (
    target_organization_id, notification_type, title, message
  ) values (
    account_org_id,
    'ACCOUNT_ACTIVATION',
    case when approved then 'تم تفعيل حسابك' else 'لم تتم الموافقة على الحساب' end,
    coalesce(review_notes, case when approved then 'وافقت إدارة كونكت كير على تفعيل الحساب.' else 'راجع إدارة كونكت كير لمعرفة التفاصيل.' end)
  );

  return case when approved then 'ACTIVE' else 'REJECTED' end;
end;
$$;

revoke all on function public.admin_review_account(uuid, text, text) from public;
grant execute on function public.admin_review_account(uuid, text, text) to authenticated;

drop policy if exists "Organizations visible to owner or admin" on public.organizations;
create policy "Organizations visible to active owner or admin" on public.organizations
  for select to authenticated
  using (
    private.current_user_role() = 'ADMIN'
    or (id = private.current_org_id() and private.current_user_is_active())
  );

drop policy if exists "Organizations editable by owner or admin" on public.organizations;
create policy "Organizations editable by active owner or admin" on public.organizations
  for update to authenticated
  using (
    private.current_user_role() = 'ADMIN'
    or (id = private.current_org_id() and private.current_user_is_active())
  )
  with check (
    private.current_user_role() = 'ADMIN'
    or (id = private.current_org_id() and private.current_user_is_active())
  );

drop policy if exists "Insurance profile access" on public.insurance_profiles;
create policy "Insurance profile active access" on public.insurance_profiles
  for select to authenticated
  using (
    private.current_user_role() = 'ADMIN'
    or (organization_id = private.current_org_id() and private.current_user_is_active())
  );

drop policy if exists "Insurance profile update" on public.insurance_profiles;
create policy "Insurance profile active update" on public.insurance_profiles
  for update to authenticated
  using (
    private.current_user_role() = 'ADMIN'
    or (organization_id = private.current_org_id() and private.current_user_is_active())
  )
  with check (
    private.current_user_role() = 'ADMIN'
    or (organization_id = private.current_org_id() and private.current_user_is_active())
  );

drop policy if exists "Insurance contacts access" on public.insurance_contacts;
create policy "Insurance contacts active access" on public.insurance_contacts
  for all to authenticated
  using (
    private.current_user_role() = 'ADMIN'
    or (insurance_organization_id = private.current_org_id() and private.current_user_is_active())
  )
  with check (
    private.current_user_role() = 'ADMIN'
    or (insurance_organization_id = private.current_org_id() and private.current_user_is_active())
  );

drop policy if exists "Authenticated provider directory" on public.provider_profiles;
create policy "Authenticated provider directory" on public.provider_profiles
  for select to authenticated
  using (
    verification_status = 'VERIFIED'
    or private.current_user_role() = 'ADMIN'
    or (organization_id = private.current_org_id() and private.current_user_is_active())
  );

drop policy if exists "Contract request participants read" on public.contract_requests;
create policy "Active contract participants read" on public.contract_requests
  for select to authenticated
  using (
    private.current_user_role() = 'ADMIN'
    or (private.current_user_is_active() and (
      insurance_organization_id = private.current_org_id()
      or provider_organization_id = private.current_org_id()
    ))
  );

drop policy if exists "Contract request participants create" on public.contract_requests;
create policy "Active contract participants create" on public.contract_requests
  for insert to authenticated
  with check (
    private.current_user_is_active()
    and created_by_user_id = (select auth.uid())
    and (
      (initiated_by_party = 'INSURANCE' and insurance_organization_id = private.current_org_id())
      or (initiated_by_party = 'PROVIDER' and provider_organization_id = private.current_org_id())
    )
  );
