-- Add vaccines_given column to residents table
-- This column stores an array of vaccine types that a resident has received
-- Example: ['penta1', 'opv2', 'mmr1']

ALTER TABLE public.residents
ADD COLUMN IF NOT EXISTS vaccines_given text[] DEFAULT '{}';

-- Add a comment to document the column
COMMENT ON COLUMN public.residents.vaccines_given IS 'Array of vaccine types received by the resident. Valid values: penta1, penta2, pcv1, pcv2, pcv3, mcv1, mcv2, opv1, opv2, mmr1, mmr2, ipv1, ipv2, tt1, tt2';

-- Optional: Add a check constraint to validate vaccine types (uncomment if you want strict validation)
-- ALTER TABLE public.residents
-- ADD CONSTRAINT vaccines_given_valid_types 
-- CHECK (
--   vaccines_given <@ ARRAY['penta1', 'penta2', 'pcv1', 'pcv2', 'pcv3', 'mcv1', 'mcv2', 'opv1', 'opv2', 'mmr1', 'mmr2', 'ipv1', 'ipv2', 'tt1', 'tt2']::text[]
-- );

