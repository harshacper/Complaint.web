-- =======================================================
-- Complainsy - Complaint Management System
-- Supabase PostgreSQL Database Schema (Standard SERIAL Edition)
-- Run this script in your Supabase SQL Editor (SQL Editor -> New Query)
-- =======================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    phone TEXT,
    gender TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    contact TEXT,
    incident_date DATE DEFAULT CURRENT_DATE,
    location TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    image_data TEXT,
    estimated_days INT,
    priority_score NUMERIC(3,1),
    predicted_emotion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =======================================================
-- Indexes for High Performance Queries
-- =======================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_complaints_user_email ON public.complaints(user_email);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);

-- Insert Default Admin Account (password: harsha@#$)
INSERT INTO public.users (name, email, password, role, phone, gender, address)
VALUES (
    'System Admin', 
    'harsha@gmail.com', 
    '$2a$10$hM9ojfe9GORQo6qdi/Tax.eWuaEzS/K9X8P4sEVE.IrkocqVS6rcK', 
    'admin',
    '9876543210',
    'Male',
    'Bengaluru, Karnataka'
) ON CONFLICT (email) DO NOTHING;
