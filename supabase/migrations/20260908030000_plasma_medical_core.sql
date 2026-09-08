create table if not exists public.pmt_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'patient' check (role in ('patient','doctor','reception','admin','laboratory','radiology','call_center')),
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.pmt_doctors (
  id uuid primary key default gen_random_uuid(),
  full_name_ar text not null,
  specialty_ar text not null,
  title_ar text,
  room_number text,
  consultation_fee numeric(10,2) not null default 350,
  availability_status text not null default 'available',
  created_at timestamptz not null default now()
);

create table if not exists public.pmt_appointments (
  id uuid primary key default gen_random_uuid(),
  booking_code text unique not null default ('PMT-' || upper(substr(md5(random()::text), 1, 8))),
  patient_id uuid references auth.users(id) on delete set null,
  patient_name text not null,
  patient_phone text not null,
  specialty_ar text not null,
  doctor_name text not null,
  appointment_date date not null,
  appointment_time text not null,
  visit_type text not null default 'كشف جديد',
  notes text,
  status text not null default 'confirmed' check (status in ('pending','confirmed','checked_in','completed','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.pmt_profiles enable row level security;
alter table public.pmt_doctors enable row level security;
alter table public.pmt_appointments enable row level security;

drop policy if exists "public read doctors" on public.pmt_doctors;
create policy "public read doctors" on public.pmt_doctors for select using (true);

drop policy if exists "public create appointments" on public.pmt_appointments;
create policy "public create appointments" on public.pmt_appointments for insert with check (true);

drop policy if exists "users read own profile" on public.pmt_profiles;
create policy "users read own profile" on public.pmt_profiles for select using (auth.uid() = id);

drop policy if exists "staff read appointments" on public.pmt_appointments;
create policy "staff read appointments" on public.pmt_appointments for select using (
  exists (select 1 from public.pmt_profiles where id = auth.uid() and role <> 'patient')
);

create or replace function public.pmt_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.pmt_profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), coalesce(new.raw_user_meta_data->>'role', 'patient'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists pmt_on_auth_user_created on auth.users;
create trigger pmt_on_auth_user_created after insert on auth.users for each row execute procedure public.pmt_handle_new_user();

insert into public.pmt_doctors (full_name_ar, specialty_ar, title_ar, room_number, consultation_fee)
select * from (values
  ('د. أحمد عادل', 'القلب والأوعية الدموية', 'استشاري القلب والقسطرة', '٣٠٤', 450),
  ('د. سارة فتحي', 'طب الأطفال', 'استشاري طب الأطفال وحديثي الولادة', '٢٠٥', 350),
  ('د. محمد الشاذلي', 'العظام والمفاصل', 'استشاري جراحة العظام', '٤٠٢', 400)
) as v(full_name_ar, specialty_ar, title_ar, room_number, consultation_fee)
where not exists (select 1 from public.pmt_doctors limit 1);
