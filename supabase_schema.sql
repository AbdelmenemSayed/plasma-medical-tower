-- ==========================================================
-- SUPABASE COMPLETE DATABASE SCHEMA FOR PLASMA MEDICAL TOWER
-- برج بلازما الطبي - النظام الإداري والطبي والسريري المتكامل
-- ==========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Branches Table (إدارة الفروع: 4 عاملة + 2 تحت الإنشاء)
CREATE TABLE IF NOT EXISTS public.pmt_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT,
    address_ar TEXT NOT NULL,
    phone TEXT,
    city_ar TEXT NOT NULL DEFAULT 'الجيزة',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_construction', 'inactive')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    opening_hours TEXT DEFAULT '٩:٠٠ ص - ١١:٠٠ م',
    completion_rate INT DEFAULT 100, -- 100% للفروع العاملة، نسبة إنجاز للفروع تحت الإنشاء
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Staff Profiles & Roles Table (تصنيف الموظفين والأدوار والصلاحيات)
-- الأدوار تشمل:
-- - admin: المدير العام / صاحب المنشأة (صلاحية مطلقة على كل الفروع والوحدات)
-- - branch_manager: مدير الفرع (صلاحية كاملة مقيدة بالفرع المخصص له فقط)
-- - reception: موظفو الاستقبال (تسجيل المرضى، كشف حر أو تأمين، المواعيد، الطوابير)
-- - doctor: الأطباء والعيادات (فحص الحالات، مراجعة التاريخ المرضي، تسجيل التشخيص والروشتة)
-- - laboratory: إدارة المعمل والتحاليل
-- - radiology: إدارة الأشعة والتصوير
-- - accounting: إدارة الحسابات والفواتير
-- - patient: حساب المريض
CREATE TABLE IF NOT EXISTS public.pmt_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('admin', 'branch_manager', 'doctor', 'reception', 'laboratory', 'radiology', 'accounting', 'patient')),
    specialty_ar TEXT, -- التخصص الطبي للأطباء: قلب، أطفال، عظام، باطنة...
    title_ar TEXT, -- اللقب الوظيفي: استشاري، أخصائي، مدير فرع...
    phone TEXT,
    branch_id UUID REFERENCES public.pmt_branches(id) ON DELETE SET NULL, -- الفرع التابع له (NULL للمدير العام)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Patients Directory (سجل المرضى الموحد وتصنيف الدفع والتأمين)
CREATE TABLE IF NOT EXISTS public.pmt_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mrn TEXT UNIQUE NOT NULL, -- الرقم الطبي الموحد (e.g. PLZ-1001)
    full_name_ar TEXT NOT NULL,
    phone TEXT NOT NULL,
    national_id TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')),
    date_of_birth DATE,
    blood_group TEXT,
    address_ar TEXT,
    billing_type TEXT NOT NULL DEFAULT 'cash' CHECK (billing_type IN ('cash', 'insurance')), -- كشف حر أم شركة تأمين
    insurance_company TEXT, -- اسم شركة التأمين (مصر للتأمين، متلايف، أكسا، بوبا، ثروة كير...)
    insurance_card_number TEXT, -- رقم بطاقة التأمين / البوليصة
    chronic_conditions TEXT, -- التاريخ المرضي المزمن (ضغط، سكر، حساسية أدوية، جراحات سابقة)
    registered_branch_id UUID REFERENCES public.pmt_branches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Appointments & Reception Queue Table (المواعيد وطابور الانتظار بالعيادات)
CREATE TABLE IF NOT EXISTS public.pmt_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code TEXT UNIQUE NOT NULL, -- كود الحجز الطبي e.g. PMT-24098
    patient_id UUID REFERENCES public.pmt_patients(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_address TEXT,
    branch_id UUID REFERENCES public.pmt_branches(id) ON DELETE SET NULL,
    specialty_ar TEXT NOT NULL,
    doctor_id UUID REFERENCES public.pmt_profiles(id) ON DELETE SET NULL,
    doctor_name TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    visit_type TEXT NOT NULL DEFAULT 'كشف جديد', -- كشف جديد، استشارة، متابعة، كشف منزلي
    billing_type TEXT NOT NULL DEFAULT 'cash' CHECK (billing_type IN ('cash', 'insurance')), -- كشف حر أم تأمين
    insurance_company TEXT,
    insurance_member_id TEXT,
    home_visit_requested BOOLEAN NOT NULL DEFAULT false,
    consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 350.00,
    booking_source TEXT NOT NULL DEFAULT 'landing_page', -- landing_page, reception, call_center
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'in_consultation', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Medical Records & EMR (الملف الطبي والتاريخ المرضي التراكمي والتشخيص السريري)
CREATE TABLE IF NOT EXISTS public.pmt_medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.pmt_patients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.pmt_appointments(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_mrn TEXT,
    branch_id UUID REFERENCES public.pmt_branches(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES public.pmt_profiles(id) ON DELETE SET NULL,
    doctor_name TEXT NOT NULL,
    specialty_ar TEXT NOT NULL,
    chief_complaint TEXT, -- الشكوى الرئيسية الحالية
    diagnosis TEXT NOT NULL, -- التشخيص الطبي للطبيب
    history_notes TEXT, -- التاريخ المرضي الموثق
    vitals JSONB DEFAULT '{}'::jsonb, -- { bp: "120/80", hr: 75, temp: 37.0, blood_sugar: 110, weight: 80 }
    prescriptions JSONB DEFAULT '[]'::jsonb, -- [ { drug_name: "Concor 5mg", dose: "قرص صباحاً", duration: "شهر" } ]
    lab_requests TEXT, -- طلبات المعمل
    radiology_requests TEXT, -- طلبات الأشعة
    clinical_notes TEXT, -- ملاحظات الطبيب وتوجيهات المتابعة
    follow_up_date DATE, -- موعد الزيارة / الاستشارة القادمة
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Laboratory & Radiology Orders (المعمل والأشعة)
CREATE TABLE IF NOT EXISTS public.pmt_lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.pmt_patients(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    test_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'in_progress', 'ready', 'delivered')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pmt_radiology_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.pmt_patients(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    exam_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'scheduled', 'ready', 'delivered')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Financial Transactions (الحسابات والماليات)
CREATE TABLE IF NOT EXISTS public.pmt_financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.pmt_branches(id) ON DELETE SET NULL,
    direction TEXT NOT NULL CHECK (direction IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Enable RLS and Create Policies
ALTER TABLE public.pmt_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmt_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmt_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmt_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmt_medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmt_lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmt_radiology_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmt_financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read branches" ON public.pmt_branches FOR SELECT USING (true);
CREATE POLICY "Allow public insert appointments" ON public.pmt_appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow staff select appointments" ON public.pmt_appointments FOR SELECT USING (true);
CREATE POLICY "Allow staff update appointments" ON public.pmt_appointments FOR UPDATE USING (true);
CREATE POLICY "Allow doctors manage medical records" ON public.pmt_medical_records FOR ALL USING (true);
CREATE POLICY "Allow staff manage patients" ON public.pmt_patients FOR ALL USING (true);
