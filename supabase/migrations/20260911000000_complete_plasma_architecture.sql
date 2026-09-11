-- ==========================================================
-- SUPABASE COMPLETE ARCHITECTURE MIGRATION - PLASMA MEDICAL TOWER
-- برج بلازما الطبي - النظام المتكامل للأدوار، الفروع، والاستقبال، والأطباء، وسجلات المرضى
-- ==========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Branches Table (الفروع الستة: 4 عاملة + 2 تحت الإنشاء)
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
    completion_rate INT DEFAULT 100, -- 100% for active, percentage for under construction
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist in pmt_branches in case table pre-existed
ALTER TABLE public.pmt_branches ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.pmt_branches ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.pmt_branches ADD COLUMN IF NOT EXISTS opening_hours TEXT DEFAULT '٩:٠٠ ص - ١١:٠٠ م';
ALTER TABLE public.pmt_branches ADD COLUMN IF NOT EXISTS completion_rate INT DEFAULT 100;
ALTER TABLE public.pmt_branches ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Staff Profiles & Roles Table (سجل المستخدمين وتصنيفات الموظفين)
CREATE TABLE IF NOT EXISTS public.pmt_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('admin', 'branch_manager', 'doctor', 'reception', 'laboratory', 'radiology', 'accounting', 'patient')),
    specialty_ar TEXT, -- For doctors e.g. القلب والأوعية الدموية, العظام, الأطفال
    title_ar TEXT, -- e.g. استشاري, أخصائي, مدير فرع, موظف استقبال
    phone TEXT,
    branch_id UUID REFERENCES public.pmt_branches(id) ON DELETE SET NULL, -- Null for global admin, specific branch for managers/staff
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist in case table was created earlier
ALTER TABLE public.pmt_profiles ADD COLUMN IF NOT EXISTS specialty_ar TEXT;
ALTER TABLE public.pmt_profiles ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE public.pmt_profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.pmt_branches(id) ON DELETE SET NULL;
ALTER TABLE public.pmt_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Update role constraint if needed
ALTER TABLE public.pmt_profiles DROP CONSTRAINT IF EXISTS pmt_profiles_role_check;
ALTER TABLE public.pmt_profiles ADD CONSTRAINT pmt_profiles_role_check CHECK (role IN ('admin', 'branch_manager', 'doctor', 'reception', 'laboratory', 'radiology', 'accounting', 'patient'));

-- 4. Patients Directory (سجل المرضى الموحد والتاريخ المرضي)
CREATE TABLE IF NOT EXISTS public.pmt_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mrn TEXT UNIQUE NOT NULL, -- Medical Record Number e.g. PLZ-1001
    full_name_ar TEXT NOT NULL,
    phone TEXT NOT NULL,
    national_id TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')),
    date_of_birth DATE,
    blood_group TEXT,
    address_ar TEXT,
    billing_type TEXT NOT NULL DEFAULT 'cash' CHECK (billing_type IN ('cash', 'insurance')), -- كشف حر أم شركة تأمين
    insurance_company TEXT, -- اسم شركة التأمين إذا كان مؤمناً
    insurance_card_number TEXT, -- رقم الكارنيه/البوليصة
    chronic_conditions TEXT, -- أمراض مزمنة: ضغط، سكر، حساسية، عمليات سابقة
    registered_branch_id UUID REFERENCES public.pmt_branches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pmt_patients_phone ON public.pmt_patients(phone);
CREATE INDEX IF NOT EXISTS idx_pmt_patients_mrn ON public.pmt_patients(mrn);

-- 5. Appointments & Reception Queue Table (الحجوزات واستقبال الحالات)
CREATE TABLE IF NOT EXISTS public.pmt_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code TEXT UNIQUE NOT NULL,
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
    billing_type TEXT NOT NULL DEFAULT 'cash' CHECK (billing_type IN ('cash', 'insurance')), -- كشف حر أو شركة تأمين
    insurance_company TEXT,
    insurance_member_id TEXT,
    home_visit_requested BOOLEAN NOT NULL DEFAULT false,
    consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 350.00,
    booking_source TEXT NOT NULL DEFAULT 'landing_page', -- landing_page, reception, call_center
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'in_consultation', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns in pmt_appointments exist
ALTER TABLE public.pmt_appointments ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.pmt_branches(id) ON DELETE SET NULL;
ALTER TABLE public.pmt_appointments ADD COLUMN IF NOT EXISTS billing_type TEXT NOT NULL DEFAULT 'cash';
ALTER TABLE public.pmt_appointments ADD COLUMN IF NOT EXISTS insurance_company TEXT;
ALTER TABLE public.pmt_appointments ADD COLUMN IF NOT EXISTS insurance_member_id TEXT;
ALTER TABLE public.pmt_appointments ADD COLUMN IF NOT EXISTS home_visit_requested BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.pmt_appointments ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 350.00;
ALTER TABLE public.pmt_appointments ADD COLUMN IF NOT EXISTS booking_source TEXT NOT NULL DEFAULT 'landing_page';
ALTER TABLE public.pmt_appointments ADD COLUMN IF NOT EXISTS notes TEXT;

-- 6. Medical Records & EMR (الملف الطبي والتاريخ المرضي التراكمي وسجل الكشف)
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
    diagnosis TEXT NOT NULL, -- التشخيص الطبي
    history_notes TEXT, -- التاريخ المرضي
    vitals JSONB DEFAULT '{}'::jsonb, -- { bp: "120/80", hr: 75, temp: 37.0, blood_sugar: 110, weight: 80 }
    prescriptions JSONB DEFAULT '[]'::jsonb, -- [ { drug_name: "Aspirin 81mg", dose: "قرص بعد الغداء", duration: "شهر" } ]
    lab_requests TEXT, -- طلبات التحاليل
    radiology_requests TEXT, -- طلبات الأشعة
    clinical_notes TEXT, -- ملاحظات الطبيب
    follow_up_date DATE, -- ميعاد الاستشارة القادمة
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist for pmt_medical_records
ALTER TABLE public.pmt_medical_records ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.pmt_patients(id) ON DELETE SET NULL;
ALTER TABLE public.pmt_medical_records ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.pmt_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.pmt_medical_records ADD COLUMN IF NOT EXISTS chief_complaint TEXT;
ALTER TABLE public.pmt_medical_records ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.pmt_medical_records ADD COLUMN IF NOT EXISTS lab_requests TEXT;
ALTER TABLE public.pmt_medical_records ADD COLUMN IF NOT EXISTS radiology_requests TEXT;
ALTER TABLE public.pmt_medical_records ADD COLUMN IF NOT EXISTS clinical_notes TEXT;
ALTER TABLE public.pmt_medical_records ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE public.pmt_medical_records ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.pmt_branches(id) ON DELETE SET NULL;
ALTER TABLE public.pmt_medical_records ADD COLUMN IF NOT EXISTS patient_mrn TEXT;

-- 7. Row Level Security Policies (الأمان وعزل الصلاحيات)
ALTER TABLE public.pmt_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmt_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmt_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmt_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmt_medical_records ENABLE ROW LEVEL SECURITY;

-- Branches Policies
DROP POLICY IF EXISTS "public read branches" ON public.pmt_branches;
CREATE POLICY "public read branches" ON public.pmt_branches FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin manage branches" ON public.pmt_branches;
CREATE POLICY "admin manage branches" ON public.pmt_branches FOR ALL USING (
    EXISTS (SELECT 1 FROM public.pmt_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Appointments Policies
DROP POLICY IF EXISTS "public insert appointments" ON public.pmt_appointments;
CREATE POLICY "public insert appointments" ON public.pmt_appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "staff read appointments" ON public.pmt_appointments;
CREATE POLICY "staff read appointments" ON public.pmt_appointments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.pmt_profiles p
        WHERE p.id = auth.uid()
        AND (
            p.role = 'admin' -- الأدمن يرى كل الفروع
            OR (p.role = 'branch_manager' AND p.branch_id = pmt_appointments.branch_id) -- مدير الفرع يرى فرعه فقط
            OR (p.role IN ('reception', 'doctor', 'laboratory', 'radiology', 'accounting') AND (p.branch_id IS NULL OR p.branch_id = pmt_appointments.branch_id))
        )
    )
);

-- Medical Records Policies (خاص بالأطباء ومدير النظام)
DROP POLICY IF EXISTS "doctors read medical records" ON public.pmt_medical_records;
CREATE POLICY "doctors read medical records" ON public.pmt_medical_records FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.pmt_profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin')
    )
);

DROP POLICY IF EXISTS "doctors insert medical records" ON public.pmt_medical_records;
CREATE POLICY "doctors insert medical records" ON public.pmt_medical_records FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.pmt_profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin')
    )
);

-- 8. Seed Initial Data (الفروع الستة المطلوبة)
INSERT INTO public.pmt_branches (name_ar, name_en, address_ar, phone, city_ar, status, is_active, completion_rate, notes)
VALUES
    ('فرع الحوامدية الرئيسي', 'Al Hawamdia Main', 'بجوار بنك الإسكندرية، أمام مرور الحوامدية', '01021869999', 'الجيزة', 'active', true, 100, 'الفرع التشغيلي الرئيسي - مركز متكامل لكافة العيادات والمعمل والأشعة'),
    ('فرع البدرشين', 'Al Badrasheen', 'شارع النيل، مجمع العيادات التخصصية', '01035719999', 'الجيزة', 'active', true, 100, 'عيادات تخصصية متكاملة وقسم طوارئ واستقبال'),
    ('فرع طموه / المنيب', 'Tamouh / El Mounib', 'طريق مصر أسوان الزراعي، مدخل طموه', '0238120999', 'الجيزة', 'active', true, 100, 'مركز سحب عينات واستقبال وعيادات خارجية'),
    ('فرع العياط', 'Al Ayat Branch', 'شارع الجيش، برج الأطباء، الدور الثاني', '01021869998', 'الجيزة', 'active', true, 100, 'عيادات استشارية متقدمة ومركز أشعة رقمي'),
    ('فرع مدينة 6 أكتوبر', '6th of October Branch', 'المحور المركزي، بالقرب من ميدان الحصري', '01099912345', 'الجيزة', 'under_construction', false, 75, 'فرع قيد الإنشاء والتشطيب (نسبة الإنجاز ٧٥٪ - الافتتاح قريباً)'),
    ('فرع المعادي', 'Maadi Branch', 'شارع النصر، المعادي الجديدة', '01088854321', 'القاهرة', 'under_construction', false, 40, 'فرع قيد الإنشاء والترخيص (نسبة الإنجاز ٤٠٪ - المرحلة الهندسية)')
ON CONFLICT DO NOTHING;

-- 9. Seed Initial Patients with Insurance vs Cash
INSERT INTO public.pmt_patients (mrn, full_name_ar, phone, gender, date_of_birth, blood_group, address_ar, billing_type, insurance_company, insurance_card_number, chronic_conditions)
VALUES
    ('PLZ-1001', 'أحمد محمد السيد', '01012345678', 'male', '1984-05-12', 'A+', 'الحوامدية - شارع الجمهورية', 'cash', NULL, NULL, 'ارتفاع ضغط الدم، لا توجد حساسية دوائية'),
    ('PLZ-1002', 'منى عبد الرحمن حسن', '01123456789', 'female', '1992-11-20', 'O+', 'البدرشين - بجوار محطة القطار', 'insurance', 'مصر للتأمين', 'MS-882941', 'حساسية بنسلين، حساسية موسمية'),
    ('PLZ-1003', 'محمود خليل إبراهيم', '01234567890', 'male', '1976-03-15', 'B+', 'طموه - الجزيرة', 'insurance', 'أكسا مصر', 'AX-551029', 'داء السكري من النوع الثاني، جراحة غضروف فقري سابقة عام ٢٠٢٠'),
    ('PLZ-1004', 'فاطمة علي الدسوقي', '01555667788', 'female', '1988-08-04', 'AB+', 'العياط - شارع الكورنيش', 'cash', NULL, NULL, 'لا توجد أمراض مزمنة، كشف روتيني متابعة حمل')
ON CONFLICT (mrn) DO NOTHING;

-- 10. Seed Initial Medical History / Consultations
INSERT INTO public.pmt_medical_records (patient_name, patient_phone, patient_mrn, specialty_ar, doctor_name, chief_complaint, diagnosis, vitals, prescriptions, clinical_notes)
VALUES
    ('أحمد محمد السيد', '01012345678', 'PLZ-1001', 'القلب والأوعية الدموية', 'د. أحمد عادل', 'صداع مستمر خلف الرأس وخفقان عند بذل مجهود خفيف', 'ارتفاع أولي في ضغط الدم الدرجة الأولى (Primary Hypertension Stage 1)', '{"bp":"145/92","hr":82,"temp":36.8,"blood_sugar":98}'::jsonb, '[{"drug_name":"Concor 5mg","dose":"قرص صباحاً على الريق","duration":"مستمر"},{"drug_name":"Aspirin Protect 100mg","dose":"قرص يومياً بعد الغداء","duration":"مستمر"}]'::jsonb, 'يوصى بتقليل الملح في الطعام وتجنب الإجهاد، والمتابعة بإيكو للقلب بعد أسبوعين'),
    ('أحمد محمد السيد', '01012345678', 'PLZ-1001', 'الباطنة والسكر', 'د. إبراهيم فؤاد', 'زيارة متابعة روتينية وضبط مؤشرات السكر التراكمي', 'مرحلة ما قبل السكري (Impaired Fasting Glucose)', '{"bp":"130/85","hr":76,"temp":37.0,"blood_sugar":118}'::jsonb, '[{"drug_name":"Glucophage 500mg","dose":"قرص مرة واحدة مساءً","duration":"شهر"}]'::jsonb, 'الحالة مستقرة، تم عمل تحليل سكر تراكمي HbA1c ونتيجته ٥.٩٪'),
    ('محمود خليل إبراهيم', '01234567890', 'PLZ-1003', 'العظام والمفاصل', 'د. محمد الشاذلي', 'ألم أسفل الظهر يمتد للساق اليمنى مع صعوبة في الوقوف الطويل', 'انزلاق غضروفي قطني خفيف L4-L5 مع عرق النسا', '{"bp":"125/80","hr":74,"temp":36.9,"blood_sugar":135}'::jsonb, '[{"drug_name":"Celebrex 200mg","dose":"كبسولة يومياً بعد الأكل","duration":"١٠ أيام"},{"drug_name":"Milga Advance","dose":"قرص مرتين يومياً","duration":"شهر"}]'::jsonb, 'تم تحويل الحالة لعمل ٦ جلسات علاج طبيعي وتجنب حمل الأوزان الثقيلة')
ON CONFLICT DO NOTHING;
