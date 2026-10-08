-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS FOR USER ROLES & CONTRACT STATUS
CREATE TYPE user_role AS ENUM ('client', 'admin');
CREATE TYPE service_type AS ENUM (
  'General Legal Inquiry',
  'Contract Drafting & Review',
  'Online Intake Form',
  'Corporate & Advisory'
);
CREATE TYPE intake_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');

-- 2. USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(15), -- Philippine format: +63 9XX XXX XXXX
  role user_role DEFAULT 'client' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. INTAKE / LEGAL INQUIRIES TABLE
CREATE TABLE legal_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(15),
  service_category service_type NOT NULL,
  message TEXT NOT NULL,
  status intake_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CONTRACT / CLAUSE DRAFTS TABLE (Astria Engine)
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID REFERENCES legal_inquiries(id) ON DELETE SET NULL,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  clause_data JSONB DEFAULT '{}'::jsonb, -- Stores custom parameters for Astria Engine
  file_url TEXT,
  status VARCHAR(50) DEFAULT 'draft' NOT NULL, -- draft, under_attorney_review, finalized
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_inquiries_user ON legal_inquiries(user_id);
CREATE INDEX idx_contracts_client ON contracts(client_id);