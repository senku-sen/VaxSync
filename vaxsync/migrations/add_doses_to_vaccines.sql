-- Add doses column to vaccines table
-- This stores the number of doses per vial for each vaccine type
-- Used to calculate vials needed for vaccination sessions

ALTER TABLE vaccines
ADD COLUMN doses INT DEFAULT 10;

-- Add comment explaining the column
COMMENT ON COLUMN vaccines.doses IS 'Number of doses per vial for this vaccine type. Used to calculate vials needed for sessions.';

-- Update existing vaccines with typical dose values
-- These are standard WHO/CDC recommendations
UPDATE vaccines SET doses = 10 WHERE name ILIKE '%TT%' OR name ILIKE '%tetanus%';
UPDATE vaccines SET doses = 10 WHERE name ILIKE '%pentavalent%';
UPDATE vaccines SET doses = 10 WHERE name ILIKE '%dpt%';
UPDATE vaccines SET doses = 1 WHERE name ILIKE '%mmr%';
UPDATE vaccines SET doses = 1 WHERE name ILIKE '%polio%' OR name ILIKE '%ipv%';
UPDATE vaccines SET doses = 1 WHERE name ILIKE '%hepatitis%';
UPDATE vaccines SET doses = 10 WHERE name ILIKE '%bcg%';
UPDATE vaccines SET doses = 1 WHERE name ILIKE '%covid%' OR name ILIKE '%covid-19%';

-- Create index for faster queries
CREATE INDEX idx_vaccines_doses ON vaccines(doses);

-- Verify the connection between vaccines and barangay_vaccine_inventory
-- barangay_vaccine_inventory.vaccine_id references vaccines.id
-- Now you can calculate vials needed using: target / vaccine.doses
-- Example: If target=100 and vaccine.doses=10, then vials_needed = 10
