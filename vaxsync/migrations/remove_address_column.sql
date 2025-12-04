-- Migration: Remove address column from residents table
-- This migration removes the address column from the residents table
-- Run this in your Supabase SQL editor

-- Step 1: Drop the address column
ALTER TABLE residents
DROP COLUMN IF EXISTS address;

-- Verification: Check the table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'residents'
-- ORDER BY ordinal_position;
