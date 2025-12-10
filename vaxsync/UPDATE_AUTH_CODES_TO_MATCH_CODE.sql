-- UPDATE_AUTH_CODES_TO_MATCH_CODE.sql
-- This script updates auth_code values in the user_profiles table
-- to match the current codes defined in app/api/signup/route.js
--
-- Current codes in code:
-- - Rural Health Midwife (RHM): 'RHM-4Z7Q'
-- - Public Health Nurse: 'PHN-6A9F'
--
-- This script will update old codes (HW-6A9F, HN-4Z7Q) to the new codes

-- IMPORTANT: Backup your 'user_profiles' table before running this script.

BEGIN;

-- Step 1: Update auth codes for Rural Health Midwife (RHM) users
-- Change from old codes (HW-6A9F, etc.) to new code: RHM-4Z7Q
UPDATE public.user_profiles
SET auth_code = 'RHM-4Z7Q',
    updated_at = NOW()
WHERE user_role = 'Rural Health Midwife (RHM)'
  AND auth_code != 'RHM-4Z7Q';  -- Only update if different

-- Step 2: Update auth codes for Public Health Nurse users
-- Change from old codes (HN-4Z7Q, etc.) to new code: PHN-6A9F
UPDATE public.user_profiles
SET auth_code = 'PHN-6A9F',
    updated_at = NOW()
WHERE user_role = 'Public Health Nurse'
  AND auth_code != 'PHN-6A9F';  -- Only update if different

-- Step 3: Verify the changes
-- This query will show all users with their roles and auth codes
SELECT 
    id,
    email,
    user_role,
    auth_code,
    updated_at
FROM public.user_profiles
ORDER BY user_role, email;

COMMIT;

-- Expected Result:
-- All Rural Health Midwife (RHM) users should have auth_code = 'RHM-4Z7Q'
-- All Public Health Nurse users should have auth_code = 'PHN-6A9F'

