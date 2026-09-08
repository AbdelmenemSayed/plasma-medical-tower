alter table public.pmt_profiles add column if not exists branch_id uuid;
alter table public.pmt_profiles drop constraint if exists pmt_profiles_role_check;
alter table public.pmt_profiles add constraint pmt_profiles_role_check check (role in ('patient','doctor','reception','admin','laboratory','radiology','call_center','accounting','branch_manager'));
create table if not exists public.pmt_branches (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  address_ar text not null,
  phone text,
  city_ar text not null default 'الجيزة',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.pmt_profiles add constraint pmt_profiles_branch_id_fkey foreign key (branch_id) references public.pmt_branches(id) on delete set null;
alter table public.pmt_appointments add column if not exists branch_id uuid references public.pmt_branches(id) on delete set null;
alter table public.pmt_branches enable row level security;
create policy "public read active branches" on public.pmt_branches for select using (is_active = true);
create policy "admin manage branches" on public.pmt_branches for all using (exists (select 1 from public.pmt_profiles where id = auth.uid() and role = 'admin'));
create policy "branch manager read own branch" on public.pmt_branches for select using (exists (select 1 from public.pmt_profiles p where p.id = auth.uid() and p.role = 'branch_manager' and p.branch_id = pmt_branches.id));
drop policy if exists "staff read appointments" on public.pmt_appointments;
create policy "staff read appointments" on public.pmt_appointments for select using (exists (select 1 from public.pmt_profiles p where p.id = auth.uid() and (p.role <> 'patient') and (p.role <> 'branch_manager' or p.branch_id = pmt_appointments.branch_id)));
insert into public.pmt_branches (name_ar, address_ar, phone, city_ar)
select 'فرع الحوامدية الرئيسي', 'بجوار بنك الإسكندرية، أمام مرور الحوامدية', '01021869999', 'الجيزة'
where not exists (select 1 from public.pmt_branches);
