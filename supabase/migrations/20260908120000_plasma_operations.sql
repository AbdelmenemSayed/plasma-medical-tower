alter table public.pmt_appointments add column if not exists patient_address text;
alter table public.pmt_appointments add column if not exists insurance_company text;
alter table public.pmt_appointments add column if not exists insurance_member_id text;
alter table public.pmt_appointments add column if not exists booking_source text not null default 'landing_page';
alter table public.pmt_appointments add column if not exists home_visit_requested boolean not null default false;

create table if not exists public.pmt_medical_records (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.pmt_appointments(id) on delete set null,
  patient_phone text not null,
  patient_name text not null,
  specialty_ar text not null,
  doctor_name text not null,
  diagnosis text,
  history_notes text,
  prescriptions text,
  created_at timestamptz not null default now()
);

create table if not exists public.pmt_lab_orders (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  patient_phone text not null,
  test_name text not null,
  status text not null default 'requested' check (status in ('requested','in_progress','ready','delivered')),
  requested_at timestamptz not null default now()
);

create table if not exists public.pmt_radiology_orders (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  patient_phone text not null,
  exam_name text not null,
  status text not null default 'requested' check (status in ('requested','scheduled','ready','delivered')),
  requested_at timestamptz not null default now()
);

create table if not exists public.pmt_financial_transactions (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('income','expense')),
  category text not null,
  description text not null,
  amount numeric(10,2) not null check (amount >= 0),
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.pmt_medical_records enable row level security;
alter table public.pmt_lab_orders enable row level security;
alter table public.pmt_radiology_orders enable row level security;
alter table public.pmt_financial_transactions enable row level security;

create policy "staff read medical records" on public.pmt_medical_records for select using (exists (select 1 from public.pmt_profiles where id = auth.uid() and role in ('doctor','admin')));
create policy "doctors write medical records" on public.pmt_medical_records for insert with check (exists (select 1 from public.pmt_profiles where id = auth.uid() and role in ('doctor','admin')));
create policy "staff read lab orders" on public.pmt_lab_orders for select using (exists (select 1 from public.pmt_profiles where id = auth.uid() and role in ('laboratory','doctor','admin','reception')));
create policy "staff manage lab orders" on public.pmt_lab_orders for all using (exists (select 1 from public.pmt_profiles where id = auth.uid() and role in ('laboratory','doctor','admin')));
create policy "staff read radiology orders" on public.pmt_radiology_orders for select using (exists (select 1 from public.pmt_profiles where id = auth.uid() and role in ('radiology','doctor','admin','reception')));
create policy "staff manage radiology orders" on public.pmt_radiology_orders for all using (exists (select 1 from public.pmt_profiles where id = auth.uid() and role in ('radiology','doctor','admin')));
create policy "admin manage finances" on public.pmt_financial_transactions for all using (exists (select 1 from public.pmt_profiles where id = auth.uid() and role = 'admin'));

insert into public.pmt_financial_transactions (direction, category, description, amount)
select * from (values
  ('income','كشف','إيراد حجوزات اليوم',84250::numeric),
  ('expense','تشغيل','مستلزمات طبية',12600::numeric),
  ('expense','رواتب','دفعة فريق الاستقبال',18000::numeric)
) as v(direction, category, description, amount)
where not exists (select 1 from public.pmt_financial_transactions);
