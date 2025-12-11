-- FIX_PHN_BARANGAY_ASSIGNMENT.sql
-- This script updates Public Health Nurse users to have null assigned_barangay_id
-- while keeping Rural Health Midwife (RHM) users with their assigned barangays.

-- IMPORTANT: Backup your 'user_profiles' table before running this script.

BEGIN;

-- Step 1: Set assigned_barangay_id to NULL for all Public Health Nurse users
UPDATE public.user_profiles
SET assigned_barangay_id = NULL,
    updated_at = NOW()
WHERE user_role = 'Public Health Nurse'
  AND assigned_barangay_id IS NOT NULL;

-- Step 2: Verify the changes
-- This query will show all users with their roles and assigned barangays
-- Public Health Nurse should show NULL for assigned_barangay_id
-- Rural Health Midwife (RHM) should show their assigned barangay_id
SELECT 
    id,
    email,
    user_role,
    assigned_barangay_id,
    updated_at
FROM public.user_profiles
ORDER BY user_role, email;

COMMIT;

-- Expected Result:
-- All Public Health Nurse users should have assigned_barangay_id = NULL
-- All Rural Health Midwife (RHM) users should retain their assigned_barangay_id values


