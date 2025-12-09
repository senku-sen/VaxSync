-- ============================================
-- QUICK SQL REFERENCE FOR RESIDENTS CHANGES
-- ============================================
-- Copy and paste these commands into Supabase SQL Editor

-- ============================================
-- STEP 1: ADD MOTHER COLUMN (REQUIRED)
-- ============================================
ALTER TABLE residents
ADD COLUMN mother VARCHAR(255) DEFAULT NULL;

-- ============================================
-- STEP 2: CREATE INDEX FOR FASTER QUERIES (OPTIONAL)
-- ============================================
CREATE INDEX idx_residents_mother ON residents(mother);

-- ============================================
-- STEP 3: AUTO-APPROVE EXISTING PENDING RESIDENTS (OPTIONAL)
-- ============================================
-- WARNING: This is irreversible! Only run if you want to approve all pending residents.
-- UPDATE residents 
-- SET status = 'approved' 
-- WHERE status = 'pending';

-- ============================================
-- VERIFICATION QUERIES (RUN THESE TO CHECK)
-- ============================================

-- Check if mother column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'residents' 
AND column_name = 'mother';

-- Check resident status distribution
SELECT status, COUNT(*) as count 
FROM residents 
GROUP BY status
ORDER BY count DESC;

-- Check residents with mother information
SELECT id, name, mother, status, updated_at
FROM residents 
WHERE mother IS NOT NULL 
ORDER BY updated_at DESC
LIMIT 10;

-- Check total residents
SELECT COUNT(*) as total_residents FROM residents;

-- Check approved vs pending
SELECT 
  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
FROM residents;

-- ============================================
-- ROLLBACK COMMANDS (IF NEEDED)
-- ============================================

-- Remove mother column
-- ALTER TABLE residents DROP COLUMN mother;

-- Drop the index
-- DROP INDEX IF EXISTS idx_residents_mother;

-- Revert status changes (only recent ones)
-- UPDATE residents 
-- SET status = 'pending' 
-- WHERE status = 'approved' AND updated_at > NOW() - INTERVAL '1 day';
