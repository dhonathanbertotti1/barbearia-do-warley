-- SQL Schema for Barbearia do Warley
-- Copy and paste this script into your Supabase SQL Editor (https://supabase.com) to create the tables.

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'professional', 'client')),
  avatar_url TEXT,
  specialty TEXT,
  rating NUMERIC DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  password TEXT,
  commission_percent INTEGER DEFAULT 50,
  barber_services TEXT,
  absences TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Services Table
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration_min INTEGER NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  popular BOOLEAN DEFAULT false,
  icon_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  barber_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  barber_name TEXT NOT NULL,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_price NUMERIC NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS or create permissive policies for simplicity in this demo environment
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
