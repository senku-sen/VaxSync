-- ============================================================================
-- VaxSync Supabase Database Setup
-- ============================================================================
-- Copy and paste this entire SQL into Supabase SQL Editor to set up all tables
-- ============================================================================

-- ============================================================================
-- 1. INVENTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory (
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

-- Enable RLS on inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory
CREATE POLICY "Enable read access for all users" ON inventory FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON inventory FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON inventory FOR DELETE USING (true);

-- ============================================================================
-- 2. VACCINE_USAGE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vaccine_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  barangay VARCHAR(100),
  purpose VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on vaccine_usage
ALTER TABLE vaccine_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vaccine_usage
CREATE POLICY "Enable read access for all users" ON vaccine_usage FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON vaccine_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON vaccine_usage FOR UPDATE USING (true);

-- ============================================================================
-- 3. ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts (
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

-- Enable RLS on alerts
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alerts
CREATE POLICY "Enable read access for all users" ON alerts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON alerts FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON alerts FOR DELETE USING (true);

-- ============================================================================
-- 4. BARANGAYS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS barangays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on barangays
ALTER TABLE barangays ENABLE ROW LEVEL SECURITY;

-- RLS Policies for barangays
CREATE POLICY "Enable read access for all users" ON barangays FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON barangays FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON barangays FOR UPDATE USING (true);

-- ============================================================================
-- 5. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  barangay VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON users FOR UPDATE USING (true);

-- ============================================================================
-- 6. VACCINE_REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vaccine_requests (
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

-- Enable RLS on vaccine_requests
ALTER TABLE vaccine_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vaccine_requests
CREATE POLICY "Enable read access for all users" ON vaccine_requests FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON vaccine_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON vaccine_requests FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON vaccine_requests FOR DELETE USING (true);

-- ============================================================================
-- 7. RESIDENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS residents (
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

-- Enable RLS on residents
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for residents
CREATE POLICY "Enable read access for all users" ON residents FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON residents FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON residents FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON residents FOR DELETE USING (true);

-- ============================================================================
-- 8. VACCINATION_SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vaccination_sessions (
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

-- Enable RLS on vaccination_sessions
ALTER TABLE vaccination_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vaccination_sessions
CREATE POLICY "Enable read access for all users" ON vaccination_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON vaccination_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON vaccination_sessions FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON vaccination_sessions FOR DELETE USING (true);

-- ============================================================================
-- 9. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  notification_type VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Enable read access for all users" ON notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON notifications FOR UPDATE USING (true);

-- ============================================================================
-- END OF SETUP
-- ============================================================================
-- All tables created with RLS policies enabled
-- Ready for DASH-01 to DASH-04 features
-- ============================================================================
