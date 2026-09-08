-- CONNECT CARE - INSURANCE COMPANY ONBOARDING & CONTRACTING WORKFLOW
-- Adds secure insurance registration, contacts, activation, notifications,
-- bidirectional contract requests, and a public-safe provider directory.

set search_path to public, extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

alter table public.insurance_profiles
  add column if not exists activation_status text not null default 'PENDING_EMAIL'
    check (activation_status in ('PENDING_EMAIL', 'PENDING_ADMIN', 'ACTIVE', 'SUSPENDED', 'REJECTED')),
  add column if not exists activated_at timestamptz,
  add column if not exists activated_by uuid references auth.users(id) on delete set null,
  add column if not exists profile_completion integer not null default 70
    check (profile_completion between 0 and 100);

create table if not exists public.insurance_contacts (
  id uuid primary key default uuid_generate_v4(),
  insurance_organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_order smallint not null check (contact_order between 1 and 3),
  full_name text not null,
  phone text not null,
  position text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (insurance_organization_id, contact_order)
);

alter table public.contract_requests
  add column if not exists initiated_by_party text not null default 'INSURANCE'
    check (initiated_by_party in ('INSURANCE', 'PROVIDER')),
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists admin_notes text,
  add column if not exists responded_at timestamptz;

create table if not exists public.platform_notifications (
  id uuid primary key default uuid_generate_v4(),
  target_organization_id uuid references public.organizations(id) on delete cascade,
  target_role text check (target_role in ('ADMIN', 'INSURANCE_ADMIN', 'PROVIDER_ADMIN')),
  contract_request_id uuid references public.contract_requests(id) on delete cascade,
  notification_type text not null check (notification_type in ('CONTRACT_REQUEST', 'STATUS_UPDATE', 'ACCOUNT_ACTIVATION')),
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_insurance_contacts_org on public.insurance_contacts(insurance_organization_id);
create index if not exists idx_contract_requests_insurance on public.contract_requests(insurance_organization_id, created_at desc);
create index if not exists idx_contract_requests_provider on public.contract_requests(provider_organization_id, created_at desc);
create index if not exists idx_notifications_target on public.platform_notifications(target_organization_id, target_role, created_at desc);

create or replace function private.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id from public.users where id = (select auth.uid()) limit 1
$$;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role_name from public.users where id = (select auth.uid()) limit 1
$$;

revoke all on function private.current_org_id() from public;
revoke all on function private.current_user_role() from public;
grant execute on function private.current_org_id() to authenticated;
grant execute on function private.current_user_role() to authenticated;

create or replace function private.handle_insurance_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_org_id uuid;
  contacts jsonb;
  contact jsonb;
  contact_index integer := 0;
begin
  if coalesce(new.raw_user_meta_data->>'registration_type', '') <> 'insurance' then
    return new;
  end if;

  insert into public.organizations (
    name, type, logo_url, phone, email, address, governorate, area, is_active
  ) values (
    coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), 'شركة تأمين جديدة'),
    'INSURANCE_COMPANY',
    nullif(new.raw_user_meta_data->>'logo_url', ''),
    coalesce(nullif(new.raw_user_meta_data->>'primary_phone', ''), 'غير محدد'),
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
    coalesce(nullif(new.raw_user_meta_data->>'primary_contact_name', ''), 'مسؤول شركة التأمين'),
    coalesce(nullif(new.raw_user_meta_data->>'primary_phone', ''), 'غير محدد'),
    new.email,
    'INSURANCE_ADMIN',
    true
  );

  insert into public.insurance_profiles (
    organization_id, company_name, company_type, coverage_scale,
    primary_contact_name, primary_contact_phone, primary_contact_email,
    activation_status, profile_completion
  ) values (
    new_org_id,
    coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), 'شركة تأمين جديدة'),
    'شركة تأمين',
    coalesce(nullif(new.raw_user_meta_data->>'coverage_scale', ''), 'غير محدد'),
    coalesce(nullif(new.raw_user_meta_data->>'primary_contact_name', ''), 'مسؤول شركة التأمين'),
    coalesce(nullif(new.raw_user_meta_data->>'primary_phone', ''), 'غير محدد'),
    new.email,
    'PENDING_EMAIL',
    85
  );

  contacts := coalesce(new.raw_user_meta_data->'contacts', '[]'::jsonb);
  for contact in select value from jsonb_array_elements(contacts)
  loop
    contact_index := contact_index + 1;
    exit when contact_index > 3;
    insert into public.insurance_contacts (
      insurance_organization_id, contact_order, full_name, phone, position
    ) values (
      new_org_id,
      contact_index,
      coalesce(nullif(contact->>'name', ''), 'غير محدد'),
      coalesce(nullif(contact->>'phone', ''), 'غير محدد'),
      coalesce(nullif(contact->>'position', ''), 'غير محدد')
    );
  end loop;

  return new;
end;
$$;

create or replace function private.handle_insurance_email_verified()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_id uuid;
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    select organization_id into org_id from public.users where id = new.id;
    if org_id is not null then
      update public.insurance_profiles
      set activation_status = 'ACTIVE',
          activated_at = now()
      where organization_id = org_id and activation_status = 'PENDING_EMAIL';

      update public.organizations
      set is_active = true,
          updated_at = now()
      where id = org_id;

      insert into public.platform_notifications (
        target_role, notification_type, title, message
      ) values (
        'ADMIN', 'ACCOUNT_ACTIVATION', 'تم تفعيل شركة تأمين جديدة',
        'تم تفعيل حساب شركة تأمين بعد تأكيد رمز البريد الإلكتروني.'
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_insurance_user_created on auth.users;
create trigger on_insurance_user_created
  after insert on auth.users
  for each row execute function private.handle_insurance_signup();

drop trigger if exists on_insurance_email_verified on auth.users;
create trigger on_insurance_email_verified
  after update of email_confirmed_at on auth.users
  for each row execute function private.handle_insurance_email_verified();

create or replace function private.notify_contract_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  insurance_name text;
  provider_display_name text;
  receiver_org uuid;
  receiver_role text;
begin
  select name into insurance_name from public.organizations where id = new.insurance_organization_id;
  select p.provider_name into provider_display_name from public.provider_profiles p where p.organization_id = new.provider_organization_id;

  if new.initiated_by_party = 'INSURANCE' then
    receiver_org := new.provider_organization_id;
    receiver_role := 'PROVIDER_ADMIN';
  else
    receiver_org := new.insurance_organization_id;
    receiver_role := 'INSURANCE_ADMIN';
  end if;

  insert into public.platform_notifications (
    target_organization_id, target_role, contract_request_id,
    notification_type, title, message
  ) values (
    receiver_org, receiver_role, new.id,
    'CONTRACT_REQUEST', 'طلب تعاقد جديد',
    case when new.initiated_by_party = 'INSURANCE'
      then coalesce(insurance_name, 'شركة تأمين') || ' ترغب في التعاقد معكم.'
      else coalesce(provider_display_name, 'مقدم خدمة') || ' يرغب في الانضمام إلى شبكتكم.'
    end
  );

  insert into public.platform_notifications (
    target_role, contract_request_id, notification_type, title, message
  ) values (
    'ADMIN', new.id, 'CONTRACT_REQUEST', 'طلب تعاقد يحتاج متابعة',
    coalesce(insurance_name, 'شركة تأمين') || ' × ' || coalesce(provider_display_name, 'مقدم خدمة')
  );
  return new;
end;
$$;

drop trigger if exists on_contract_request_created on public.contract_requests;
create trigger on_contract_request_created
  after insert on public.contract_requests
  for each row execute function private.notify_contract_request();

alter table public.insurance_contacts enable row level security;
alter table public.insurance_profiles enable row level security;
alter table public.contract_requests enable row level security;
alter table public.platform_notifications enable row level security;

drop policy if exists "Users visible to self or admin" on public.users;
create policy "Users visible to self or admin" on public.users
  for select to authenticated
  using (id = (select auth.uid()) or private.current_user_role() = 'ADMIN');

drop policy if exists "Public read active organizations" on public.organizations;
drop policy if exists "Organizations visible to owner or admin" on public.organizations;
create policy "Organizations visible to owner or admin" on public.organizations
  for select to authenticated
  using (id = private.current_org_id() or private.current_user_role() = 'ADMIN');

drop policy if exists "Organizations editable by owner or admin" on public.organizations;
create policy "Organizations editable by owner or admin" on public.organizations
  for update to authenticated
  using (id = private.current_org_id() or private.current_user_role() = 'ADMIN')
  with check (id = private.current_org_id() or private.current_user_role() = 'ADMIN');

drop policy if exists "Insurance profile access" on public.insurance_profiles;
create policy "Insurance profile access" on public.insurance_profiles
  for select to authenticated
  using (organization_id = private.current_org_id() or private.current_user_role() = 'ADMIN');

drop policy if exists "Insurance profile update" on public.insurance_profiles;
create policy "Insurance profile update" on public.insurance_profiles
  for update to authenticated
  using (organization_id = private.current_org_id() or private.current_user_role() = 'ADMIN')
  with check (organization_id = private.current_org_id() or private.current_user_role() = 'ADMIN');

drop policy if exists "Insurance contacts access" on public.insurance_contacts;
create policy "Insurance contacts access" on public.insurance_contacts
  for all to authenticated
  using (insurance_organization_id = private.current_org_id() or private.current_user_role() = 'ADMIN')
  with check (insurance_organization_id = private.current_org_id() or private.current_user_role() = 'ADMIN');

drop policy if exists "Public read verified provider profiles" on public.provider_profiles;
drop policy if exists "Verified provider directory" on public.provider_profiles;
drop policy if exists "Public verified provider directory" on public.provider_profiles;
drop policy if exists "Authenticated provider directory" on public.provider_profiles;
create policy "Public verified provider directory" on public.provider_profiles
  for select to anon
  using (verification_status = 'VERIFIED');

create policy "Authenticated provider directory" on public.provider_profiles
  for select to authenticated
  using (
    verification_status = 'VERIFIED'
    or organization_id = private.current_org_id()
    or private.current_user_role() = 'ADMIN'
  );

drop policy if exists "Contract request participants read" on public.contract_requests;
create policy "Contract request participants read" on public.contract_requests
  for select to authenticated
  using (
    insurance_organization_id = private.current_org_id()
    or provider_organization_id = private.current_org_id()
    or private.current_user_role() = 'ADMIN'
  );

drop policy if exists "Contract request participants create" on public.contract_requests;
create policy "Contract request participants create" on public.contract_requests
  for insert to authenticated
  with check (
    created_by_user_id = (select auth.uid())
    and (
      (initiated_by_party = 'INSURANCE' and insurance_organization_id = private.current_org_id())
      or
      (initiated_by_party = 'PROVIDER' and provider_organization_id = private.current_org_id())
    )
  );

drop policy if exists "Contract request participants update" on public.contract_requests;
create policy "Contract request participants update" on public.contract_requests
  for update to authenticated
  using (
    insurance_organization_id = private.current_org_id()
    or provider_organization_id = private.current_org_id()
    or private.current_user_role() = 'ADMIN'
  )
  with check (
    insurance_organization_id = private.current_org_id()
    or provider_organization_id = private.current_org_id()
    or private.current_user_role() = 'ADMIN'
  );

drop policy if exists "Notification recipient access" on public.platform_notifications;
create policy "Notification recipient access" on public.platform_notifications
  for select to authenticated
  using (
    target_organization_id = private.current_org_id()
    or (target_role = private.current_user_role())
    or private.current_user_role() = 'ADMIN'
  );

drop policy if exists "Notification recipient update" on public.platform_notifications;
create policy "Notification recipient update" on public.platform_notifications
  for update to authenticated
  using (
    target_organization_id = private.current_org_id()
    or target_role = private.current_user_role()
    or private.current_user_role() = 'ADMIN'
  )
  with check (
    target_organization_id = private.current_org_id()
    or target_role = private.current_user_role()
    or private.current_user_role() = 'ADMIN'
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('insurance-logos', 'insurance-logos', true, 3145728, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Insurance logo public read" on storage.objects;
create policy "Insurance logo public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'insurance-logos');

drop policy if exists "Insurance logo owner upload" on storage.objects;
create policy "Insurance logo owner upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'insurance-logos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

grant select, update on public.organizations to authenticated;
grant select on public.users to authenticated;
grant select, update on public.insurance_profiles to authenticated;
grant select, insert, update, delete on public.insurance_contacts to authenticated;
grant select on public.provider_profiles to anon, authenticated;
grant select, insert, update on public.contract_requests to authenticated;
grant select, update on public.platform_notifications to authenticated;
grant all on public.organizations, public.users, public.insurance_profiles,
  public.insurance_contacts, public.contract_requests, public.platform_notifications to service_role;
