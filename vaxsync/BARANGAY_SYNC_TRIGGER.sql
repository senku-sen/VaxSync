-- ============================================================================
-- CREATE TRIGGER FOR AUTO-SYNCING BARANGAYS
-- ============================================================================
-- This trigger automatically adds barangays to the barangays table
-- whenever a new inventory record is inserted with a new barangay
-- ============================================================================

-- Create the trigger function
CREATE OR REPLACE FUNCTION sync_barangay_from_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the barangay already exists in the barangays table
  IF NOT EXISTS (
    SELECT 1 FROM barangays WHERE code = NEW.barangay
  ) THEN
    -- If it doesn't exist, insert it
    INSERT INTO barangays (code, name)
    VALUES (NEW.barangay, NEW.barangay)
    ON CONFLICT (code) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the inventory table
DROP TRIGGER IF EXISTS inventory_sync_barangay ON inventory;

CREATE TRIGGER inventory_sync_barangay
AFTER INSERT ON inventory
FOR EACH ROW
EXECUTE FUNCTION sync_barangay_from_inventory();

-- ============================================================================
-- TRIGGER CREATED SUCCESSFULLY
-- ============================================================================
-- Now whenever you add a row to the inventory table with a new barangay,
-- it will automatically be added to the barangays table!
-- ============================================================================
