-- Add missing columns to existing residents table
-- Run this in your Supabase SQL editor

-- Add the missing status column
ALTER TABLE residents 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add other missing columns if needed
ALTER TABLE residents 
ADD COLUMN IF NOT EXISTS vaccine_status VARCHAR(50) DEFAULT 'not_vaccinated' 
CHECK (vaccine_status IN ('not_vaccinated', 'partially_vaccinated', 'fully_vaccinated'));

ALTER TABLE residents 
ADD COLUMN IF NOT EXISTS barangay VARCHAR(100);

ALTER TABLE residents 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE residents 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE residents 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_residents_status ON residents(status);
CREATE INDEX IF NOT EXISTS idx_residents_barangay ON residents(barangay);
CREATE INDEX IF NOT EXISTS idx_residents_vaccine_status ON residents(vaccine_status);
CREATE INDEX IF NOT EXISTS idx_residents_submitted_at ON residents(submitted_at);

-- Enable Row Level Security
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations
CREATE POLICY "Allow all operations on residents" ON residents
    FOR ALL USING (true);
