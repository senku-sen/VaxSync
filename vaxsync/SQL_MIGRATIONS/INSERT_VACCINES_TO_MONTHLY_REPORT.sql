-- ============================================
-- INSERT VACCINES INTO MONTHLY REPORT
-- ============================================
-- This script inserts all vaccines from the vaccines table
-- into the vaccine_monthly_report table for December 2025
-- ============================================

-- Get current month (December 2025)
-- Adjust the month variable as needed
WITH current_month AS (
  SELECT '2025-12-01'::date as month_date
),

-- Get all vaccines with their NIP reference values
vaccine_data AS (
  SELECT 
    v.id as vaccine_id,
    v.name as vaccine_name,
    v.quantity_available as quantity,
    CASE 
      WHEN LOWER(TRIM(v.name)) = 'bcg' THEN 11
      WHEN LOWER(TRIM(v.name)) = 'bcg diluent' THEN 11
      WHEN LOWER(TRIM(v.name)) = 'hep b' THEN 11
      WHEN LOWER(TRIM(v.name)) = 'hep b (10 dose)' THEN 11
      WHEN LOWER(TRIM(v.name)) = 'pentavalent' THEN 289
      WHEN LOWER(TRIM(v.name)) = 'bopv' THEN 18
      WHEN LOWER(TRIM(v.name)) = 'dropper' THEN 18
      WHEN LOWER(TRIM(v.name)) = 'pcv10' THEN 72
      WHEN LOWER(TRIM(v.name)) = 'pcv10 (4 dose)' THEN 72
      WHEN LOWER(TRIM(v.name)) = 'ipv' THEN 22
      WHEN LOWER(TRIM(v.name)) = 'ipv 10 dose' THEN 22
      WHEN LOWER(TRIM(v.name)) = 'mmr' THEN 24
      WHEN LOWER(TRIM(v.name)) = 'mmr diluent' THEN 24
      WHEN LOWER(TRIM(v.name)) = 'mr' THEN 24
      WHEN LOWER(TRIM(v.name)) = 'mr diluent' THEN 24
      WHEN LOWER(TRIM(v.name)) = 'td' THEN 22
      WHEN LOWER(TRIM(v.name)) = 'td10' THEN 22
      WHEN LOWER(TRIM(v.name)) = 'tt' THEN 108
      WHEN LOWER(TRIM(v.name)) = 'tt1' THEN 108
      WHEN LOWER(TRIM(v.name)) = 'hpv' THEN 96
      WHEN LOWER(TRIM(v.name)) = 'ppv' THEN 96
      WHEN LOWER(TRIM(v.name)) = 'ppv23' THEN 96
      WHEN LOWER(TRIM(v.name)) = 'flu' THEN 11
      ELSE 0
    END as vials_needed,
    CASE 
      WHEN LOWER(TRIM(v.name)) = 'bcg' THEN 23
      WHEN LOWER(TRIM(v.name)) = 'bcg diluent' THEN 275
      WHEN LOWER(TRIM(v.name)) = 'hep b' THEN 22
      WHEN LOWER(TRIM(v.name)) = 'hep b (10 dose)' THEN 22
      WHEN LOWER(TRIM(v.name)) = 'pentavalent' THEN 578
      WHEN LOWER(TRIM(v.name)) = 'bopv' THEN 37
      WHEN LOWER(TRIM(v.name)) = 'dropper' THEN 439
      WHEN LOWER(TRIM(v.name)) = 'pcv10' THEN 145
      WHEN LOWER(TRIM(v.name)) = 'pcv10 (4 dose)' THEN 145
      WHEN LOWER(TRIM(v.name)) = 'ipv' THEN 43
      WHEN LOWER(TRIM(v.name)) = 'ipv 10 dose' THEN 43
      WHEN LOWER(TRIM(v.name)) = 'mmr' THEN 49
      WHEN LOWER(TRIM(v.name)) = 'mmr diluent' THEN 586
      WHEN LOWER(TRIM(v.name)) = 'mr' THEN 49
      WHEN LOWER(TRIM(v.name)) = 'mr diluent' THEN 586
      WHEN LOWER(TRIM(v.name)) = 'td' THEN 43
      WHEN LOWER(TRIM(v.name)) = 'td10' THEN 43
      WHEN LOWER(TRIM(v.name)) = 'tt' THEN 217
      WHEN LOWER(TRIM(v.name)) = 'tt1' THEN 217
      WHEN LOWER(TRIM(v.name)) = 'hpv' THEN 193
      WHEN LOWER(TRIM(v.name)) = 'ppv' THEN 193
      WHEN LOWER(TRIM(v.name)) = 'ppv23' THEN 193
      WHEN LOWER(TRIM(v.name)) = 'flu' THEN 23
      ELSE 0
    END as max_allocation
  FROM vaccines v
  WHERE v.quantity_available > 0
)

-- Insert into monthly report
INSERT INTO vaccine_monthly_report (
  vaccine_id,
  month,
  initial_inventory,
  quantity_supplied,
  quantity_used,
  quantity_wastage,
  ending_inventory,
  vials_needed,
  max_allocation,
  stock_level_percentage,
  status,
  created_at,
  updated_at
)
SELECT 
  vd.vaccine_id,
  cm.month_date,
  0 as initial_inventory,
  vd.quantity as quantity_supplied,
  0 as quantity_used,
  0 as quantity_wastage,
  vd.quantity as ending_inventory,
  vd.vials_needed,
  vd.max_allocation,
  CASE 
    WHEN vd.max_allocation = 0 THEN 0
    ELSE ROUND((vd.quantity::float / vd.max_allocation::float) * 100)
  END as stock_level_percentage,
  CASE 
    WHEN vd.max_allocation = 0 THEN 'GOOD'
    WHEN ROUND((vd.quantity::float / vd.max_allocation::float) * 100) = 0 THEN 'STOCKOUT'
    WHEN ROUND((vd.quantity::float / vd.max_allocation::float) * 100) < 25 THEN 'STOCKOUT'
    WHEN ROUND((vd.quantity::float / vd.max_allocation::float) * 100) < 50 THEN 'UNDERSTOCK'
    WHEN ROUND((vd.quantity::float / vd.max_allocation::float) * 100) > 75 THEN 'OVERSTOCK'
    ELSE 'GOOD'
  END as status,
  NOW() as created_at,
  NOW() as updated_at
FROM vaccine_data vd, current_month cm
ON CONFLICT (vaccine_id, month) DO UPDATE SET
  quantity_supplied = EXCLUDED.quantity_supplied,
  ending_inventory = EXCLUDED.ending_inventory,
  stock_level_percentage = EXCLUDED.stock_level_percentage,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the data was inserted correctly
SELECT 
  vaccine_id,
  month,
  initial_inventory,
  quantity_supplied as "IN",
  quantity_used as "OUT",
  quantity_wastage,
  ending_inventory,
  vials_needed,
  max_allocation,
  stock_level_percentage as "%Stock",
  status
FROM vaccine_monthly_report
WHERE month = '2025-12-01'
ORDER BY vaccine_id;
