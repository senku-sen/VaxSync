-- ============================================
-- VAXSYNC - CORE TABLES SETUP
-- ============================================
-- Only: barangays, vaccine_requests, vaccination_sessions
-- Run this in Supabase SQL Editor
-- Last Updated: November 20, 2025
-- ============================================

-- ============================================
-- BARANGAYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.barangays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  municipality VARCHAR(255) NOT NULL DEFAULT 'Daet',
  population INTEGER DEFAULT 0,
  assigned_health_worker UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- VACCINE REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vaccine_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
  vaccine_id UUID NOT NULL REFERENCES public.vaccines(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  quantity_dose INTEGER NOT NULL,
  quantity_vial INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  requested_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  request_code VARCHAR(255)
);

-- ============================================
-- VACCINATION SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vaccination_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
  vaccine_id UUID NOT NULL REFERENCES public.vaccines(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  target INTEGER NOT NULL DEFAULT 0,
  administered INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
  created_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_barangays_name ON public.barangays(name);
CREATE INDEX IF NOT EXISTS idx_barangays_assigned_health_worker ON public.barangays(assigned_health_worker);

CREATE INDEX IF NOT EXISTS idx_vaccine_requests_barangay_id ON public.vaccine_requests(barangay_id);
CREATE INDEX IF NOT EXISTS idx_vaccine_requests_vaccine_id ON public.vaccine_requests(vaccine_id);
CREATE INDEX IF NOT EXISTS idx_vaccine_requests_requested_by ON public.vaccine_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_vaccine_requests_status ON public.vaccine_requests(status);
CREATE INDEX IF NOT EXISTS idx_vaccine_requests_created_at ON public.vaccine_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_vaccination_sessions_barangay_id ON public.vaccination_sessions(barangay_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_sessions_vaccine_id ON public.vaccination_sessions(vaccine_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_sessions_created_by ON public.vaccination_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_vaccination_sessions_session_date ON public.vaccination_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_vaccination_sessions_status ON public.vaccination_sessions(status);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.barangays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - BARANGAYS
-- ============================================

-- All authenticated users can read barangays
CREATE POLICY "Authenticated users can read barangays"
ON public.barangays FOR SELECT
USING (auth.role() = 'authenticated');

-- Head Nurse can insert barangays
CREATE POLICY "Head Nurse can insert barangays"
ON public.barangays FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- Head Nurse can update barangays
CREATE POLICY "Head Nurse can update barangays"
ON public.barangays FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- Head Nurse can delete barangays
CREATE POLICY "Head Nurse can delete barangays"
ON public.barangays FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- ============================================
-- RLS POLICIES - VACCINE REQUESTS
-- ============================================

-- Health Worker: Read own requests
CREATE POLICY "Health Worker SELECT vaccine_requests"
ON public.vaccine_requests FOR SELECT
USING (requested_by = auth.uid());

-- Health Worker: Create requests
CREATE POLICY "Health Worker INSERT vaccine_requests"
ON public.vaccine_requests FOR INSERT
WITH CHECK (requested_by = auth.uid());

-- Health Worker: Update own requests
CREATE POLICY "Health Worker UPDATE vaccine_requests"
ON public.vaccine_requests FOR UPDATE
USING (requested_by = auth.uid());

-- Health Worker: Delete own requests
CREATE POLICY "Health Worker DELETE vaccine_requests"
ON public.vaccine_requests FOR DELETE
USING (requested_by = auth.uid());

-- Head Nurse: Read all requests
CREATE POLICY "Head Nurse SELECT vaccine_requests"
ON public.vaccine_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- Head Nurse: Update all requests
CREATE POLICY "Head Nurse UPDATE vaccine_requests"
ON public.vaccine_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- Head Nurse: Delete all requests
CREATE POLICY "Head Nurse DELETE vaccine_requests"
ON public.vaccine_requests FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- ============================================
-- RLS POLICIES - VACCINATION SESSIONS
-- ============================================

-- All authenticated users can read sessions
CREATE POLICY "SELECT vaccination_sessions"
ON public.vaccination_sessions FOR SELECT
USING (auth.role() = 'authenticated');

-- All authenticated users can insert sessions
CREATE POLICY "INSERT vaccination_sessions"
ON public.vaccination_sessions FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update sessions
CREATE POLICY "UPDATE vaccination_sessions"
ON public.vaccination_sessions FOR UPDATE
USING (auth.role() = 'authenticated');

-- All authenticated users can delete sessions
CREATE POLICY "DELETE vaccination_sessions"
ON public.vaccination_sessions FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('barangays', 'vaccine_requests', 'vaccination_sessions');

-- Check columns
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public'
-- AND table_name IN ('barangays', 'vaccine_requests', 'vaccination_sessions')
-- ORDER BY table_name, ordinal_position;

-- Check indexes
-- SELECT tablename, indexname FROM pg_indexes 
-- WHERE tablename IN ('barangays', 'vaccine_requests', 'vaccination_sessions')
-- ORDER BY tablename;

-- Check RLS policies
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('barangays', 'vaccine_requests', 'vaccination_sessions')
-- ORDER BY tablename, policyname;

-- Check data
-- SELECT 'barangays' as table_name, COUNT(*) as count FROM barangays
-- UNION ALL
-- SELECT 'vaccine_requests', COUNT(*) FROM vaccine_requests
-- UNION ALL
-- SELECT 'vaccination_sessions', COUNT(*) FROM vaccination_sessions;
