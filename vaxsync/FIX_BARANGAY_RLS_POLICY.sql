-- ============================================
-- FIX: BARANGAY RLS POLICIES
-- ============================================
-- Issue: "Failed RLS" when adding barangay
-- Solution: Update RLS policies to allow Head Nurse to insert
-- Last Updated: November 20, 2025
-- ============================================

-- ============================================
-- DROP EXISTING POLICIES (SAFE)
-- ============================================
DROP POLICY IF EXISTS "Head Nurse can insert barangays" ON public.barangays;
DROP POLICY IF EXISTS "Authenticated users can read barangays" ON public.barangays;
DROP POLICY IF EXISTS "Head Nurse can update barangays" ON public.barangays;
DROP POLICY IF EXISTS "Head Nurse can delete barangays" ON public.barangays;

-- ============================================
-- CREATE NEW POLICIES - BARANGAYS
-- ============================================

-- POLICY 1: All authenticated users can READ barangays
CREATE POLICY "Authenticated users can read barangays"
ON public.barangays
FOR SELECT
TO authenticated
USING (true);

-- POLICY 2: Head Nurse can INSERT barangays
CREATE POLICY "Head Nurse can insert barangays"
ON public.barangays
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- POLICY 3: Head Nurse can UPDATE barangays
CREATE POLICY "Head Nurse can update barangays"
ON public.barangays
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- POLICY 4: Head Nurse can DELETE barangays
CREATE POLICY "Head Nurse can delete barangays"
ON public.barangays
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'barangays';

-- Check all policies on barangays
-- SELECT policyname, permissive, roles, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'barangays'
-- ORDER BY policyname;

-- ============================================
-- TESTING AFTER APPLYING POLICIES
-- ============================================

-- Test 1: As Head Nurse, try to insert a barangay
-- INSERT INTO public.barangays (name, municipality, population)
-- VALUES ('Test Barangay', 'Daet', 5000);

-- Test 2: As Health Worker, try to insert (should fail)
-- This will fail because Health Worker is not Head Nurse

-- Test 3: Verify barangay was inserted
-- SELECT * FROM public.barangays WHERE name = 'Test Barangay';

-- ============================================
-- NOTES
-- ============================================
-- 
-- Key Changes:
-- 1. Added "TO authenticated" to specify who can use the policy
-- 2. Changed WITH CHECK to use proper syntax
-- 3. Added WITH CHECK to UPDATE policy (required for UPDATE)
-- 4. Simplified policy logic
--
-- If still getting "Failed RLS" error:
-- 1. Check user_role in user_profiles is exactly 'Head Nurse' (case-sensitive)
-- 2. Verify auth.uid() returns the correct user ID
-- 3. Check if user_profiles table has RLS enabled (may be blocking the subquery)
--
-- ============================================
