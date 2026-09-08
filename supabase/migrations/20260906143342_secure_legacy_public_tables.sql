-- Secure legacy tables that were created before the role-based portal policies.
-- With RLS enabled and no broad policies, these operational records remain service-role/admin only.

alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.insurance_companies enable row level security;
alter table public.user_roles enable row level security;
alter table public.branches enable row level security;
alter table public.verification_records enable row level security;
alter table public.verification_audits enable row level security;
alter table public.contract_price_lists enable row level security;
alter table public.ticket_comments enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.invoices enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Admins can read user roles" on public.user_roles;
create policy "Admins can read user roles"
  on public.user_roles for select
  to authenticated
  using (private.current_user_role() = 'ADMIN');

drop policy if exists "Admins manage legacy insurance records" on public.insurance_companies;
create policy "Admins manage legacy insurance records"
  on public.insurance_companies for all
  to authenticated
  using (private.current_user_role() = 'ADMIN')
  with check (private.current_user_role() = 'ADMIN');

drop policy if exists "Admins read audit logs" on public.audit_logs;
create policy "Admins read audit logs"
  on public.audit_logs for select
  to authenticated
  using (private.current_user_role() = 'ADMIN');
