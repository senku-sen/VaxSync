-- SQL Migration: Add missed_schedule_of_vaccine column to residents table
-- This column stores vaccines that the resident missed during their scheduled vaccination

-- Add missed_schedule_of_vaccine column if it doesn't exist
ALTER TABLE residents
ADD COLUMN IF NOT EXISTS missed_schedule_of_vaccine TEXT[] DEFAULT '{}';

-- Add comment to document the column
COMMENT ON COLUMN residents.missed_schedule_of_vaccine IS 'Array of vaccine names that the resident missed during their scheduled vaccination dates. Example: {penta1, pcv1}';

-- Create index for faster queries on missed vaccines
CREATE INDEX IF NOT EXISTS idx_residents_missed_schedule_of_vaccine ON residents USING GIN (missed_schedule_of_vaccine);
