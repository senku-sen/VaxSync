-- ============================================
-- VAXSYNC - COMPLETE RLS POLICIES SETUP
-- ============================================
-- Run these policies in Supabase SQL Editor
-- Last Updated: November 20, 2025
-- ============================================

-- ============================================
-- USER PROFILES - RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Head Nurse can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read user_profiles" ON public.user_profiles;

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow Head Nurse to read all profiles
CREATE POLICY "Head Nurse can read all profiles"
ON public.user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- BARANGAYS - RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read barangays" ON public.barangays;
DROP POLICY IF EXISTS "Head Nurse can insert barangays" ON public.barangays;
DROP POLICY IF EXISTS "Head Nurse can update barangays" ON public.barangays;
DROP POLICY IF EXISTS "Head Nurse can delete barangays" ON public.barangays;
DROP POLICY IF EXISTS "Allow read user profiles for barangay relationships" ON public.user_profiles;

-- Allow all authenticated users to read barangays
CREATE POLICY "Authenticated users can read barangays"
ON public.barangays
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow Head Nurse to insert barangays
CREATE POLICY "Head Nurse can insert barangays"
ON public.barangays
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- Allow Head Nurse to update barangays
CREATE POLICY "Head Nurse can update barangays"
ON public.barangays
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- Allow Head Nurse to delete barangays
CREATE POLICY "Head Nurse can delete barangays"
ON public.barangays
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- Allow authenticated users to read user_profiles for barangay relationships
CREATE POLICY "Allow read user profiles for barangay relationships"
ON public.user_profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- ============================================
-- VACCINES - RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read vaccines" ON public.vaccines;
DROP POLICY IF EXISTS "Head Nurse can insert vaccines" ON public.vaccines;
DROP POLICY IF EXISTS "Head Nurse can update vaccines" ON public.vaccines;
DROP POLICY IF EXISTS "Head Nurse can delete vaccines" ON public.vaccines;

-- Allow all authenticated users to read vaccines
CREATE POLICY "Authenticated users can read vaccines"
ON public.vaccines
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow Head Nurse to insert vaccines
CREATE POLICY "Head Nurse can insert vaccines"
ON public.vaccines
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- Allow Head Nurse to update vaccines
CREATE POLICY "Head Nurse can update vaccines"
ON public.vaccines
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- Allow Head Nurse to delete vaccines
CREATE POLICY "Head Nurse can delete vaccines"
ON public.vaccines
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- ============================================
-- VACCINE REQUESTS - RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Health Worker SELECT" ON public.vaccine_requests;
DROP POLICY IF EXISTS "Health Worker INSERT" ON public.vaccine_requests;
DROP POLICY IF EXISTS "Health Worker UPDATE" ON public.vaccine_requests;
DROP POLICY IF EXISTS "Health Worker DELETE" ON public.vaccine_requests;
DROP POLICY IF EXISTS "Head Nurse SELECT" ON public.vaccine_requests;
DROP POLICY IF EXISTS "Head Nurse UPDATE" ON public.vaccine_requests;
DROP POLICY IF EXISTS "Head Nurse DELETE" ON public.vaccine_requests;
DROP POLICY IF EXISTS "Health Worker can read own vaccine requests" ON public.vaccine_requests;
DROP POLICY IF EXISTS "Health Worker can create vaccine requests" ON public.vaccine_requests;
DROP POLICY IF EXISTS "Health Worker can delete own vaccine requests" ON public.vaccine_requests;
DROP POLICY IF EXISTS "Head Nurse can read all vaccine requests" ON public.vaccine_requests;
DROP POLICY IF EXISTS "Head Nurse can update vaccine request status" ON public.vaccine_requests;
DROP POLICY IF EXISTS "Head Nurse can delete vaccine requests" ON public.vaccine_requests;

-- HEALTH WORKER: Read only their own requests
CREATE POLICY "Health Worker SELECT"
ON public.vaccine_requests
FOR SELECT
USING (
  requested_by = auth.uid()
);

-- HEALTH WORKER: Create vaccine requests
CREATE POLICY "Health Worker INSERT"
ON public.vaccine_requests
FOR INSERT
WITH CHECK (
  requested_by = auth.uid()
);

-- HEALTH WORKER: Update their own requests
CREATE POLICY "Health Worker UPDATE"
ON public.vaccine_requests
FOR UPDATE
USING (
  requested_by = auth.uid()
);

-- HEALTH WORKER: Delete their own requests
CREATE POLICY "Health Worker DELETE"
ON public.vaccine_requests
FOR DELETE
USING (
  requested_by = auth.uid()
);

-- HEAD NURSE: Read all requests
CREATE POLICY "Head Nurse SELECT"
ON public.vaccine_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- HEAD NURSE: Update all requests (approve/reject/release)
CREATE POLICY "Head Nurse UPDATE"
ON public.vaccine_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- HEAD NURSE: Delete all requests
CREATE POLICY "Head Nurse DELETE"
ON public.vaccine_requests
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- ============================================
-- BARANGAY VACCINE INVENTORY - RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Health Worker can read own barangay inventory" ON public.barangay_vaccine_inventory;
DROP POLICY IF EXISTS "Health Worker can update own barangay inventory" ON public.barangay_vaccine_inventory;
DROP POLICY IF EXISTS "Head Nurse can read all inventory" ON public.barangay_vaccine_inventory;
DROP POLICY IF EXISTS "Head Nurse can insert inventory" ON public.barangay_vaccine_inventory;
DROP POLICY IF EXISTS "Head Nurse can update all inventory" ON public.barangay_vaccine_inventory;
DROP POLICY IF EXISTS "Head Nurse can delete inventory" ON public.barangay_vaccine_inventory;

-- HEALTH WORKER: Read inventory for assigned barangay
CREATE POLICY "Health Worker can read own barangay inventory"
ON public.barangay_vaccine_inventory
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.assigned_barangay_id = barangay_vaccine_inventory.barangay_id
  )
);

-- HEALTH WORKER: Update inventory for assigned barangay
CREATE POLICY "Health Worker can update own barangay inventory"
ON public.barangay_vaccine_inventory
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.assigned_barangay_id = barangay_vaccine_inventory.barangay_id
  )
);

-- HEAD NURSE: Read all inventory
CREATE POLICY "Head Nurse can read all inventory"
ON public.barangay_vaccine_inventory
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- HEAD NURSE: Insert inventory
CREATE POLICY "Head Nurse can insert inventory"
ON public.barangay_vaccine_inventory
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- HEAD NURSE: Update all inventory
CREATE POLICY "Head Nurse can update all inventory"
ON public.barangay_vaccine_inventory
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- HEAD NURSE: Delete inventory
CREATE POLICY "Head Nurse can delete inventory"
ON public.barangay_vaccine_inventory
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- ============================================
-- VACCINATION SESSIONS - RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "SELECT vaccination_sessions" ON public.vaccination_sessions;
DROP POLICY IF EXISTS "INSERT vaccination_sessions" ON public.vaccination_sessions;
DROP POLICY IF EXISTS "UPDATE vaccination_sessions" ON public.vaccination_sessions;
DROP POLICY IF EXISTS "DELETE vaccination_sessions" ON public.vaccination_sessions;

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

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify policies are set up correctly:

-- Check all policies
-- SELECT * FROM pg_policies WHERE tablename IN ('user_profiles', 'barangays', 'vaccines', 'vaccine_requests', 'barangay_vaccine_inventory', 'vaccination_sessions');

-- Check RLS status
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'barangays', 'vaccines', 'vaccine_requests', 'barangay_vaccine_inventory', 'vaccination_sessions');

-- ============================================
-- END OF RLS POLICIES SETUP
-- ============================================
