-- CONNECT CARE PLATFORM - INITIAL MIGRATION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    governorate TEXT NOT NULL,
    address TEXT NOT NULL,
    insurance_card_url TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    governorate TEXT NOT NULL,
    area TEXT NOT NULL,
    fee TEXT NOT NULL,
    rating NUMERIC(3,2) DEFAULT 5.0,
    lat FLOAT8,
    lng FLOAT8,
    is_verified BOOLEAN DEFAULT TRUE,
    clinic_documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.insurance_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    logo_url TEXT,
    coverage_scale TEXT NOT NULL,
    sub_accounts TEXT,
    contacts JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
