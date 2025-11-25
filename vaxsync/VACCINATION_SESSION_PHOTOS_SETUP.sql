-- ============================================
-- VACCINATION SESSION PHOTOS TABLE SETUP
-- ============================================
-- Purpose: Store photos uploaded during vaccination sessions
-- Health Workers: Upload photos when session is in progress/completed
-- Head Nurses: View all photos for monitoring
-- ============================================

-- ============================================
-- 1. CREATE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vaccination_session_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.vaccination_sessions(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  photo_type VARCHAR(50) DEFAULT 'documentation',  -- 'setup', 'crowd', 'completion', 'documentation'
  uploaded_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_session_photos_session_id ON public.vaccination_session_photos(session_id);
CREATE INDEX IF NOT EXISTS idx_session_photos_uploaded_by ON public.vaccination_session_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_session_photos_created_at ON public.vaccination_session_photos(created_at);
CREATE INDEX IF NOT EXISTS idx_session_photos_photo_type ON public.vaccination_session_photos(photo_type);

-- ============================================
-- 3. DISABLE ROW LEVEL SECURITY
-- ============================================
-- RLS disabled - security enforced at application level
ALTER TABLE public.vaccination_session_photos DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================
-- Run these to verify the setup:

-- Check table exists
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'vaccination_session_photos';

-- Check indexes
-- SELECT tablename, indexname FROM pg_indexes 
-- WHERE tablename = 'vaccination_session_photos';

-- Check RLS policies
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE tablename = 'vaccination_session_photos';

-- ============================================
-- 6. SAMPLE DATA (for testing)
-- ============================================
-- Uncomment to insert test data:
/*
INSERT INTO public.vaccination_session_photos 
  (session_id, photo_url, caption, photo_type, uploaded_by)
VALUES 
  (
    (SELECT id FROM vaccination_sessions LIMIT 1),
    'https://example.com/photo1.jpg',
    'Vaccination setup at barangay hall',
    'setup',
    (SELECT id FROM user_profiles WHERE user_role = 'Health Worker' LIMIT 1)
  );
*/
