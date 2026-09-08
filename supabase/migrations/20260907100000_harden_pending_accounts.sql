-- Pending accounts can authenticate, but cannot access operational platform data.

drop policy if exists "Contract request participants update" on public.contract_requests;
create policy "Active contract participants update" on public.contract_requests
  for update to authenticated
  using (
    private.current_user_role() = 'ADMIN'
    or (private.current_user_is_active() and (
      insurance_organization_id = private.current_org_id()
      or provider_organization_id = private.current_org_id()
    ))
  )
  with check (
    private.current_user_role() = 'ADMIN'
    or (private.current_user_is_active() and (
      insurance_organization_id = private.current_org_id()
      or provider_organization_id = private.current_org_id()
    ))
  );

drop policy if exists "Notification recipient access" on public.platform_notifications;
create policy "Active notification recipient access" on public.platform_notifications
  for select to authenticated
  using (
    private.current_user_role() = 'ADMIN'
    or (private.current_user_is_active() and (
      target_organization_id = private.current_org_id()
      or target_role = private.current_user_role()
    ))
  );

drop policy if exists "Notification recipient update" on public.platform_notifications;
create policy "Active notification recipient update" on public.platform_notifications
  for update to authenticated
  using (
    private.current_user_role() = 'ADMIN'
    or (private.current_user_is_active() and (
      target_organization_id = private.current_org_id()
      or target_role = private.current_user_role()
    ))
  )
  with check (
    private.current_user_role() = 'ADMIN'
    or (private.current_user_is_active() and (
      target_organization_id = private.current_org_id()
      or target_role = private.current_user_role()
    ))
  );

drop policy if exists "Insurance logo owner upload" on storage.objects;
create policy "Active insurance logo owner upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'insurance-logos'
    and private.current_user_is_active()
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
