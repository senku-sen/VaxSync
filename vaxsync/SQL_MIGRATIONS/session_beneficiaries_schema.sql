-- ============================================
-- SESSION BENEFICIARIES TABLE
-- ============================================
-- Tracks which residents are scheduled for vaccination sessions
-- Links residents to vaccination sessions for monitoring

CREATE TABLE IF NOT EXISTS session_beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vaccination_sessions(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT false,
  vaccinated BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure no duplicate entries for same resident in same session
  UNIQUE(session_id, resident_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_session_beneficiaries_session_id 
  ON session_beneficiaries(session_id);

CREATE INDEX IF NOT EXISTS idx_session_beneficiaries_resident_id 
  ON session_beneficiaries(resident_id);

CREATE INDEX IF NOT EXISTS idx_session_beneficiaries_vaccinated 
  ON session_beneficiaries(vaccinated);

-- Enable RLS (Row Level Security)
ALTER TABLE session_beneficiaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read session_beneficiaries" ON session_beneficiaries;
DROP POLICY IF EXISTS "Allow authenticated users to insert session_beneficiaries" ON session_beneficiaries;
DROP POLICY IF EXISTS "Allow authenticated users to update session_beneficiaries" ON session_beneficiaries;
DROP POLICY IF EXISTS "Allow authenticated users to delete session_beneficiaries" ON session_beneficiaries;

-- Allow authenticated users to read session beneficiaries
CREATE POLICY "Allow authenticated users to read session_beneficiaries"
  ON session_beneficiaries
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert session beneficiaries
CREATE POLICY "Allow authenticated users to insert session_beneficiaries"
  ON session_beneficiaries
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update session beneficiaries
CREATE POLICY "Allow authenticated users to update session_beneficiaries"
  ON session_beneficiaries
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete session beneficiaries
CREATE POLICY "Allow authenticated users to delete session_beneficiaries"
  ON session_beneficiaries
  FOR DELETE
  USING (auth.role() = 'authenticated');
