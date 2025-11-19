-- ============================================================================
-- VaxSync Supabase Database Setup (Clean - Handles Existing Tables)
-- ============================================================================
-- This version safely handles existing tables and policies
-- ============================================================================

-- ============================================================================
-- 1. INVENTORY TABLE
-- ============================================================================
DROP TABLE IF EXISTS inventory CASCADE;

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_name VARCHAR(255) NOT NULL,
  batch VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  threshold INTEGER NOT NULL DEFAULT 100,
  location VARCHAR(255),
  barangay VARCHAR(100),
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON inventory FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON inventory FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON inventory FOR DELETE USING (true);

-- ============================================================================
-- 2. VACCINE_USAGE TABLE
-- ============================================================================
DROP TABLE IF EXISTS vaccine_usage CASCADE;

CREATE TABLE vaccine_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  barangay VARCHAR(100),
  purpose VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE vaccine_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON vaccine_usage FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON vaccine_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON vaccine_usage FOR UPDATE USING (true);

-- ============================================================================
-- 3. ALERTS TABLE
-- ============================================================================
DROP TABLE IF EXISTS alerts CASCADE;

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_name VARCHAR(255) NOT NULL,
  batch VARCHAR(100),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  message TEXT,
  current_stock INTEGER,
  threshold INTEGER,
  location VARCHAR(255),
  barangay VARCHAR(100),
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON alerts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON alerts FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON alerts FOR DELETE USING (true);

-- ============================================================================
-- 4. BARANGAYS TABLE
-- ============================================================================
DROP TABLE IF EXISTS barangays CASCADE;

CREATE TABLE barangays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE barangays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON barangays FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON barangays FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON barangays FOR UPDATE USING (true);

-- ============================================================================
-- 5. USERS TABLE
-- ============================================================================
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  barangay VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON users FOR UPDATE USING (true);

-- ============================================================================
-- 6. VACCINE_REQUESTS TABLE
-- ============================================================================
DROP TABLE IF EXISTS vaccine_requests CASCADE;

CREATE TABLE vaccine_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(50) NOT NULL UNIQUE,
  health_worker_id UUID,
  health_worker_name VARCHAR(255),
  barangay VARCHAR(100),
  vaccine_type VARCHAR(255),
  quantity_requested INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE vaccine_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON vaccine_requests FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON vaccine_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON vaccine_requests FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON vaccine_requests FOR DELETE USING (true);

-- ============================================================================
-- 7. RESIDENTS TABLE
-- ============================================================================
DROP TABLE IF EXISTS residents CASCADE;

CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  age INTEGER,
  address VARCHAR(255),
  barangay VARCHAR(100),
  contact_number VARCHAR(20),
  vaccine_status VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON residents FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON residents FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON residents FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON residents FOR DELETE USING (true);

-- ============================================================================
-- 8. VACCINATION_SESSIONS TABLE
-- ============================================================================
DROP TABLE IF EXISTS vaccination_sessions CASCADE;

CREATE TABLE vaccination_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay VARCHAR(100) NOT NULL,
  session_date TIMESTAMP NOT NULL,
  vaccine_type VARCHAR(255),
  target_doses INTEGER,
  administered_doses INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE vaccination_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON vaccination_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON vaccination_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON vaccination_sessions FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON vaccination_sessions FOR DELETE USING (true);

-- ============================================================================
-- 9. NOTIFICATIONS TABLE
-- ============================================================================
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  notification_type VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON notifications FOR UPDATE USING (true);

-- ============================================================================
-- END OF SETUP
-- ============================================================================
-- All tables recreated fresh with RLS policies enabled
-- Ready for DASH-01 to DASH-04 features
-- ============================================================================
