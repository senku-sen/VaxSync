-- Add sex column to residents table
-- This column stores the sex/gender of the resident (Male or Female)

ALTER TABLE public.residents
ADD COLUMN IF NOT EXISTS sex VARCHAR(10);

-- Add a check constraint to ensure only valid values
ALTER TABLE public.residents
DROP CONSTRAINT IF EXISTS sex_valid_values;

ALTER TABLE public.residents
ADD CONSTRAINT sex_valid_values 
CHECK (sex IS NULL OR sex IN ('Male', 'Female'));

-- Add a comment to document the column
COMMENT ON COLUMN public.residents.sex IS 'Sex of the resident. Valid values: Male, Female';

