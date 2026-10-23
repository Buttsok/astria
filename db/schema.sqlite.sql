-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  role TEXT DEFAULT 'client' CHECK(role IN ('client', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- LEGAL INQUIRIES TABLE
CREATE TABLE IF NOT EXISTS legal_inquiries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  service_category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- DUMMY DATA FOR LOCAL TESTING
INSERT INTO users (id, full_name, email, role) 
VALUES 
  ('1', 'Test Client', 'client@test.com', 'client'),
  ('2', 'Test Admin', 'admin@test.com', 'admin');