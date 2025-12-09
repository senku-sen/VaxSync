-- ============================================
-- ADD MOTHER FIELD TO RESIDENTS TABLE
-- ============================================
-- Adds mother's name field to track resident's mother information

-- Step 1: Add mother column
ALTER TABLE residents
ADD COLUMN mother VARCHAR(255) DEFAULT NULL;

-- Step 2: Create index for faster queries
CREATE INDEX idx_residents_mother ON residents(mother);

-- Step 3: Add comment to column
COMMENT ON COLUMN residents.mother IS 'Mother''s name of the resident';

-- ============================================
-- MODIFY RESIDENTS TABLE - AUTO-APPROVE
-- ============================================
-- Changes residents to auto-approve instead of pending approval

-- Step 4: Change default status from 'pending' to 'approved'
ALTER TABLE residents
ALTER COLUMN status SET DEFAULT 'approved';

-- Step 5: Update all existing pending residents to approved (optional - comment out if you want to keep pending)
-- UPDATE residents SET status = 'approved' WHERE status = 'pending';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the changes:

-- Check if mother column was added
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'residents' AND column_name = 'mother';

-- Check resident status distribution
-- SELECT status, COUNT(*) as count FROM residents GROUP BY status;

-- Check residents with mother information
-- SELECT id, name, mother, status FROM residents WHERE mother IS NOT NULL LIMIT 10;
