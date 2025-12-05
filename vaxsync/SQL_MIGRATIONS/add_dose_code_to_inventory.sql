-- ============================================
-- ADD DOSE CODE TO BARANGAY VACCINE INVENTORY
-- ============================================
-- Purpose: Track which specific vaccine dose is in inventory
-- This allows Health Workers to see dose-based inventory
-- and match it with vaccine requests by dose code

-- Add dose_code column to barangay_vaccine_inventory table
ALTER TABLE barangay_vaccine_inventory
ADD COLUMN dose_code VARCHAR(50) DEFAULT NULL;

-- Add index on dose_code for faster queries
CREATE INDEX idx_barangay_vaccine_inventory_dose_code 
ON barangay_vaccine_inventory(dose_code);

-- Add index on vaccine_id + dose_code for combined queries
CREATE INDEX idx_barangay_vaccine_inventory_vaccine_dose 
ON barangay_vaccine_inventory(vaccine_id, dose_code);

-- Update existing records to have a default dose_code based on vaccine name
-- This is a one-time migration to populate existing data
UPDATE barangay_vaccine_inventory bvi
SET dose_code = (
  SELECT CASE 
    WHEN v.name ILIKE '%TT%' THEN 'TT1'
    WHEN v.name ILIKE '%PENTA%' THEN 'PENTA1'
    WHEN v.name ILIKE '%PCV%' THEN 'PCV1'
    WHEN v.name ILIKE '%OPV%' THEN 'OPV1'
    WHEN v.name ILIKE '%IPV%' THEN 'IPV1'
    WHEN v.name ILIKE '%MMR%' THEN 'MMR1'
    WHEN v.name ILIKE '%MCV%' THEN 'MCV1'
    ELSE v.name
  END
  FROM vaccines v
  WHERE v.id = bvi.vaccine_id
)
WHERE dose_code IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN barangay_vaccine_inventory.dose_code IS 'Specific vaccine dose code (e.g., TT1, PENTA1, PCV1) - used to match vaccine requests by dose';
