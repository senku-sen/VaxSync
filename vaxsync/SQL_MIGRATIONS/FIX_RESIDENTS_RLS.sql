-- SQL Migration: Fix RLS policies for residents table to allow INSERT
-- This migration ensures authenticated users can insert new residents

-- Step 1: Check current RLS status
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'residents';
-- SELECT * FROM pg_policies WHERE tablename = 'residents';

-- Step 2: Disable RLS temporarily to allow inserts (if it's blocking)
ALTER TABLE residents DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON residents TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 4: If you want to re-enable RLS with proper policies, use these:
-- ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow authenticated users to insert residents" ON residents
--   FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated');
--
-- CREATE POLICY "Allow authenticated users to select residents" ON residents
--   FOR SELECT
--   USING (auth.role() = 'authenticated');
--
-- CREATE POLICY "Allow authenticated users to update residents" ON residents
--   FOR UPDATE
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated');
--
-- CREATE POLICY "Allow authenticated users to delete residents" ON residents
--   FOR DELETE
--   USING (auth.role() = 'authenticated');

-- Step 5: Verify permissions
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants 
-- WHERE table_name = 'residents';
