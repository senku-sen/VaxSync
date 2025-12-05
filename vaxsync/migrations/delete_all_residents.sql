-- Delete all resident data from the database
-- WARNING: This will permanently delete all resident records
-- The residents table structure will remain intact

-- Step 1: Delete all residents
DELETE FROM residents;

-- Step 2: Reset the auto-increment sequence (if using PostgreSQL)
-- This resets the ID counter to start from 1 for new records
ALTER SEQUENCE residents_id_seq RESTART WITH 1;

-- Verification: Check that the table is empty
-- SELECT COUNT(*) as total_residents FROM residents;
