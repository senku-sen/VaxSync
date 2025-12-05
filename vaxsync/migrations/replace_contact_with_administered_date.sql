-- Migration: Replace contact column with administered_date
-- This migration removes the contact column and adds administered_date column to the residents table
-- Run this in your Supabase SQL editor

-- Step 1: Add the new administered_date column (if it doesn't exist)
ALTER TABLE residents
ADD COLUMN IF NOT EXISTS administered_date DATE;

-- Step 2: Drop the contact column
ALTER TABLE residents
DROP COLUMN IF EXISTS contact;

-- Step 3: Make administered_date NOT NULL (optional, based on your requirements)
-- Uncomment the line below if you want to enforce NOT NULL constraint
-- ALTER TABLE residents
-- ALTER COLUMN administered_date SET NOT NULL;

-- Step 4: Create an index on administered_date for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_residents_administered_date ON residents(administered_date);

-- Verification: Check the table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'residents'
-- ORDER BY ordinal_position;
