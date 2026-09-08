-- ==============================================================================
-- CONNECT CARE PLATFORM - COMPLETE PRODUCTION DATABASE SCHEMA & SECURITY POLICIES
-- Project: Connect Care Platform
-- Supabase Instance: kuurnrkzbjlzjlxrfmao.supabase.co
-- Date: 2026-09-04
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SET search_path TO public, extensions;

-- ------------------------------------------------------------------------------
-- 1. ORGANIZATIONS & USERS (Multi-Tenant Core & RBAC)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PROVIDER_HOSPITAL', 'PROVIDER_CLINIC', 'PROVIDER_CENTER', 'PROVIDER_LAB', 'PROVIDER_PHARMACY', 'INSURANCE_COMPANY', 'TPA', 'ADMIN')),
    tax_id TEXT,
    commercial_register TEXT,
    logo_url TEXT,
    website TEXT,
    phone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    governorate TEXT NOT NULL,
    area TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name TEXT NOT NULL UNIQUE CHECK (role_name IN ('ADMIN', 'PROVIDER_ADMIN', 'PROVIDER_STAFF', 'INSURANCE_ADMIN', 'INSURANCE_REVIEWER', 'PATIENT'))
);

INSERT INTO public.user_roles (role_name) VALUES 
('ADMIN'), ('PROVIDER_ADMIN'), ('PROVIDER_STAFF'), ('INSURANCE_ADMIN'), ('INSURANCE_REVIEWER'), ('PATIENT')
ON CONFLICT (role_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role_name TEXT NOT NULL REFERENCES public.user_roles(role_name),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. PROVIDER PROFILES & BRANCHES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.provider_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('مستشفى', 'مركز طبي', 'عيادة تخصية', 'مركز أشعة وتحاليل', 'صيدلية')),
    specialty TEXT NOT NULL,
    license_number TEXT NOT NULL,
    governorate TEXT NOT NULL,
    area TEXT NOT NULL,
    address TEXT NOT NULL,
    fee_estimate TEXT NOT NULL,
    rating NUMERIC(3,2) DEFAULT 5.0,
    verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED')),
    verification_date TIMESTAMPTZ,
    match_score INTEGER DEFAULT 95,
    lat FLOAT8 DEFAULT 30.0444,
    lng FLOAT8 DEFAULT 31.2357,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    branch_name TEXT NOT NULL,
    governorate TEXT NOT NULL,
    area TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    lat FLOAT8,
    lng FLOAT8,
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. INSURANCE PROFILES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.insurance_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    company_type TEXT NOT NULL CHECK (company_type IN ('شركة تأمين', 'إدارة رعاية طبية', 'شبكة طبية')),
    coverage_scale TEXT NOT NULL,
    sub_accounts_count INTEGER DEFAULT 1,
    primary_contact_name TEXT NOT NULL,
    primary_contact_phone TEXT NOT NULL,
    primary_contact_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. MEDICAL DOCUMENT VAULT & CONSENT MANAGEMENT
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('ترخيص النقابة', 'ترخيص مزاولة المهنة', 'ترخيص المنشأة الطبية', 'السجل التجاري', 'البطاقة الضريبية', 'قائمة الأسعار الرسمية', 'شهادات الاعتماد والجودة', 'مستندات أخرى')),
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    file_type TEXT,
    issue_date DATE,
    expiry_date DATE,
    verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'EXPIRED', 'REJECTED')),
    privacy_level TEXT DEFAULT 'INSURANCE_ONLY' CHECK (privacy_level IN ('PUBLIC', 'PRIVATE', 'INSURANCE_ONLY')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    accessed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    accessed_by_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('VIEW', 'DOWNLOAD', 'VERIFY_CHECK')),
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT
);

CREATE TABLE IF NOT EXISTS public.consent_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insurance_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    requested_document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 5. VERIFICATION ENGINE & AUDITS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.verification_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    reviewer_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED')),
    review_notes TEXT,
    rejected_reasons JSONB DEFAULT '[]'::jsonb,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verification_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_record_id UUID REFERENCES public.verification_records(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. CONTRACT LIFECYCLE MANAGEMENT
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.contract_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insurance_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    request_type TEXT DEFAULT 'NEW_CONTRACT' CHECK (request_type IN ('NEW_CONTRACT', 'RENEWAL', 'EXPANSION')),
    target_discount_percentage NUMERIC(5,2),
    proposed_start_date DATE,
    notes TEXT,
    status TEXT DEFAULT 'REQUESTED' CHECK (status IN ('DISCOVERY', 'REQUESTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number TEXT NOT NULL UNIQUE,
    contract_request_id UUID REFERENCES public.contract_requests(id) ON DELETE SET NULL,
    insurance_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    discount_percentage NUMERIC(5,2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'NEGOTIATION', 'SIGNED', 'ACTIVE', 'RENEWAL_DUE', 'EXPIRED', 'TERMINATED')),
    contract_pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contract_price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    category TEXT NOT NULL,
    standard_price NUMERIC(10,2) NOT NULL,
    contracted_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. PROVIDER RELATIONSHIP MANAGEMENT (PRM) & TICKETS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT NOT NULL UNIQUE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('CONTRACT', 'PAYMENT', 'TECHNICAL', 'VERIFICATION', 'DOCUMENT', 'OTHER')),
    priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. BUSINESS MODEL & REVENUE SUBSCRIPTIONS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    target_audience TEXT NOT NULL CHECK (target_audience IN ('PROVIDER', 'INSURANCE')),
    tier TEXT NOT NULL CHECK (tier IN ('BASIC', 'PRO', 'ENTERPRISE')),
    monthly_price_egp NUMERIC(10,2) NOT NULL,
    annual_price_egp NUMERIC(10,2) NOT NULL,
    max_branches INTEGER DEFAULT 1,
    max_users INTEGER DEFAULT 3,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('MONTHLY', 'ANNUAL')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('TRIAL', 'ACTIVE', 'RENEWAL_DUE', 'EXPIRED', 'CANCELLED')),
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT NOT NULL UNIQUE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    amount_egp NUMERIC(10,2) NOT NULL,
    vat_egp NUMERIC(10,2) DEFAULT 0.00,
    total_amount_egp NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PAID', 'OVERDUE', 'CANCELLED')),
    paid_at TIMESTAMPTZ,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. SYSTEM AUDIT LOGS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all core tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Organizations Policy: Public read for verified profiles, authenticated edit for own org
CREATE POLICY "Public read active organizations" ON public.organizations
    FOR SELECT USING (is_active = true);

-- Provider Profiles Policy: Public/Insurance can read verified profiles
CREATE POLICY "Public read verified provider profiles" ON public.provider_profiles
    FOR SELECT USING (verification_status = 'VERIFIED' OR auth.role() = 'authenticated');

-- Documents Policy: Providers read own docs; Insurance reads approved docs with consent
CREATE POLICY "Provider manage own documents" ON public.documents
    FOR ALL USING (organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Insurance view public or consented docs" ON public.documents
    FOR SELECT USING (
        privacy_level = 'PUBLIC' OR 
        id IN (
            SELECT requested_document_id FROM public.consent_requests 
            WHERE status = 'APPROVED' AND insurance_organization_id IN (
                SELECT organization_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

-- Contracts Policy: Parties involved can read/edit contracts
CREATE POLICY "Contract parties access contracts" ON public.contracts
    FOR ALL USING (
        provider_organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()) OR
        insurance_organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
    );

-- ------------------------------------------------------------------------------
-- 11. SUPABASE STORAGE BUCKETS CONFIGURATION
-- ------------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public) VALUES 
('provider-documents', 'provider-documents', false),
('contract-documents', 'contract-documents', false),
('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Bucket Policies
CREATE POLICY "Provider Document Upload Access" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'provider-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Profile Images Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');
