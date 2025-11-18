-- ============================================
-- VACCINATION SESSIONS TABLE
-- ============================================
-- Stores vaccination session schedules
-- Health workers create sessions for their assigned barangay
-- ============================================

-- Create vaccination_sessions table
CREATE TABLE IF NOT EXISTS public.vaccination_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barangay_id UUID NOT NULL,
  vaccine_id UUID NOT NULL,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  target INTEGER NOT NULL DEFAULT 0,
  administered INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_barangay FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON DELETE CASCADE,
  CONSTRAINT fk_vaccine FOREIGN KEY (vaccine_id) REFERENCES public.vaccines(id) ON DELETE CASCADE,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_vaccination_sessions_barangay_id ON public.vaccination_sessions(barangay_id);
CREATE INDEX idx_vaccination_sessions_vaccine_id ON public.vaccination_sessions(vaccine_id);
CREATE INDEX idx_vaccination_sessions_created_by ON public.vaccination_sessions(created_by);
CREATE INDEX idx_vaccination_sessions_session_date ON public.vaccination_sessions(session_date);
CREATE INDEX idx_vaccination_sessions_status ON public.vaccination_sessions(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.vaccination_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR VACCINATION_SESSIONS
-- ============================================

-- Allow all authenticated users to read vaccination sessions
CREATE POLICY "SELECT vaccination_sessions"
ON public.vaccination_sessions
FOR SELECT
USING (
  auth.role() = 'authenticated'
);

-- Allow all authenticated users to insert vaccination sessions
CREATE POLICY "INSERT vaccination_sessions"
ON public.vaccination_sessions
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow all authenticated users to update vaccination sessions
CREATE POLICY "UPDATE vaccination_sessions"
ON public.vaccination_sessions
FOR UPDATE
USING (
  auth.role() = 'authenticated'
);

-- Allow all authenticated users to delete vaccination sessions
CREATE POLICY "DELETE vaccination_sessions"
ON public.vaccination_sessions
FOR DELETE
USING (
  auth.role() = 'authenticated'
);
