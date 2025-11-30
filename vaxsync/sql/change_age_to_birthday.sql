-- Change age column to birthday column in residents table
-- This migration converts the age (integer) column to birthday (date) column

-- Step 1: Add the new birthday column
ALTER TABLE public.residents
ADD COLUMN IF NOT EXISTS birthday DATE;

-- Step 2: Migrate existing age data to approximate birthday
-- This calculates an approximate birthday based on age (assumes Jan 1st of birth year)
UPDATE public.residents
SET birthday = DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year' * age)
WHERE age IS NOT NULL AND birthday IS NULL;

-- Step 3: Make age column nullable to fix NOT NULL constraint error
ALTER TABLE public.residents
ALTER COLUMN age DROP NOT NULL;

-- Step 4: Set age to NULL for all rows (since we're using birthday now)
UPDATE public.residents
SET age = NULL
WHERE birthday IS NOT NULL;

-- Step 5: Drop the old age column (uncomment when ready to remove age completely)
-- ALTER TABLE public.residents DROP COLUMN IF EXISTS age;

-- Step 6: Add a comment to document the column
COMMENT ON COLUMN public.residents.birthday IS 'Birthday of the resident in MM/DD/YYYY format';

-- Step 7: Add a check constraint to ensure birthday is not in the future
ALTER TABLE public.residents
DROP CONSTRAINT IF EXISTS birthday_not_future;

ALTER TABLE public.residents
ADD CONSTRAINT birthday_not_future 
CHECK (birthday <= CURRENT_DATE);

