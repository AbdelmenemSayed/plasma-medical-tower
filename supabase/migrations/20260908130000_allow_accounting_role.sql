alter table public.pmt_profiles drop constraint if exists pmt_profiles_role_check;
alter table public.pmt_profiles add constraint pmt_profiles_role_check check (role in ('patient','doctor','reception','admin','laboratory','radiology','call_center','accounting'));
