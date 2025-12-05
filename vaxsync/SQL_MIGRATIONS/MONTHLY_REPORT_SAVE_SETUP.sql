-- ============================================
-- MONTHLY REPORT SAVE IMPLEMENTATION
-- ============================================
-- Setup SQL commands to enable saving monthly reports
-- RLS is DISABLED for easier access during development
-- ============================================

-- Step 1: Disable RLS on vaccine_monthly_report table
-- This allows all authenticated users to read/write without restrictions
ALTER TABLE vaccine_monthly_report DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant full permissions to authenticated users
-- Allows authenticated users to SELECT, INSERT, UPDATE, DELETE
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report_with_details TO authenticated;

-- Step 3: Grant permissions to anon users (optional, for public access)
-- Allows anonymous users to SELECT, INSERT, UPDATE, DELETE
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report_with_details TO anon;

-- Step 4: Ensure schema access
-- Allows users to access the public schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Step 5: Grant sequence permissions (for auto-increment if any)
-- Allows users to use sequences for ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Step 6: Verify table structure
-- Run this to check the current table structure
-- SELECT * FROM vaccine_monthly_report LIMIT 1;

-- Step 7: Verify permissions
-- Run this to check current permissions
-- SELECT grantee, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_name='vaccine_monthly_report';

-- ============================================
-- NOTES:
-- ============================================
-- 1. RLS is DISABLED - all authenticated users can access all records
-- 2. To enable RLS later, use: ALTER TABLE vaccine_monthly_report ENABLE ROW LEVEL SECURITY;
-- 3. The vaccine_monthly_report_with_details view provides easier querying with vaccine names
-- 4. All timestamps are automatically managed (created_at, updated_at)
-- 5. The table has a UNIQUE constraint on (vaccine_id, month) to prevent duplicates
-- ============================================
