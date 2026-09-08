-- ==========================================================
-- SUPABASE DATABASE SCHEMA FOR PLASMA MEDICAL TOWER
-- برج بلازما الطبي - نظام إداري وطبي متكامل
-- ==========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Patients Table (سجل المرضى)
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mrn VARCHAR(20) UNIQUE NOT NULL, -- Medical Record Number e.g. PLZ-8842
    full_name_ar VARCHAR(150) NOT NULL,
    full_name_en VARCHAR(150),
    national_id VARCHAR(14) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    date_of_birth DATE,
    blood_group VARCHAR(5),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Doctors Table (سجل الأطباء والعيادات)
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name_ar VARCHAR(150) NOT NULL,
    full_name_en VARCHAR(150) NOT NULL,
    specialty VARCHAR(50) NOT NULL, -- e.g. dentistry, orthopedics, cardiology
    subspecialty VARCHAR(100),
    title_ar VARCHAR(100),
    title_en VARCHAR(100),
    room_number VARCHAR(10),
    consultation_fee NUMERIC(10, 2) DEFAULT 250.00,
    rating NUMERIC(2, 1) DEFAULT 4.9,
    availability_status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Appointments Table (الحجوزات والتعيينات)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    patient_name VARCHAR(150) NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    specialty VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Queue Management Table (نظام الانتظار والاستدعاء الآلي)
CREATE TABLE IF NOT EXISTS public.queue_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(10) NOT NULL, -- e.g. A105, B204
    patient_name VARCHAR(150) NOT NULL,
    clinic_room VARCHAR(20) NOT NULL,
    doctor_name VARCHAR(150),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'calling', 'in_consultation', 'completed', 'no_show')),
    priority_level INT DEFAULT 1, -- 1: Normal, 2: VIP, 3: Emergency
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Medical Records / EMR (الملف الطبي الإلكتروني)
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    diagnosis TEXT NOT NULL,
    prescription JSONB, -- Array of medications with dosages
    vitals JSONB, -- { blood_pressure: "120/80", pulse: 72, temp: 36.8, weight: 75 }
    lab_requests JSONB,
    radiology_requests JSONB,
    doctor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Laboratory Tests (إدارة المعمل - LIMS)
CREATE TABLE IF NOT EXISTS public.lab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    test_code VARCHAR(30) NOT NULL,
    test_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('pending', 'in_progress', 'ready', 'delivered')),
    result_values JSONB,
    ref_range VARCHAR(100),
    sample_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Radiology Examinations (إدارة الأشعة - PACS)
CREATE TABLE IF NOT EXISTS public.radiology_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    modality VARCHAR(20) CHECK (modality IN ('X-RAY', 'MRI', 'CT', 'ULTRASOUND', 'DEXA')),
    body_part VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'scanned', 'reported', 'verified')),
    dicom_study_uid VARCHAR(100),
    radiologist_report TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Billing & Invoices (الفواتير والحسابات)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    services_summary JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'visa', 'insurance', 'instapay')),
    payment_status VARCHAR(20) DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Call Center CRM Logs (سجل الاتصالات والخدمة)
CREATE TABLE IF NOT EXISTS public.call_center_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_name VARCHAR(150),
    caller_phone VARCHAR(20) NOT NULL,
    call_type VARCHAR(20) CHECK (call_type IN ('inbound', 'outbound', 'missed')),
    agent_name VARCHAR(100),
    duration_seconds INT DEFAULT 0,
    outcome VARCHAR(50), -- e.g. booked_appointment, inquiry_resolved, follow_up_required
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) & Create Public Policies for Demo
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select for demo" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Allow public insert for appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select for appointments" ON public.appointments FOR SELECT USING (true);
