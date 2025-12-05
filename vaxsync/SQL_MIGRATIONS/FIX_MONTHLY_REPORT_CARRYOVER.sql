-- ============================================
-- FIX MONTHLY REPORT WITH PROPER CARRYOVER
-- ============================================
-- This script:
-- 1. Deletes all existing data
-- 2. Inserts November data (Initial=0, IN=current quantities)
-- 3. Inserts December data (Initial=November Ending, IN=new additions)
-- 4. Properly calculates Ending for both months
-- ============================================

-- Step 1: DELETE ALL DATA
DELETE FROM vaccine_monthly_report;

-- ============================================
-- Step 2: INSERT NOVEMBER DATA
-- ============================================

WITH vaccine_data AS (
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
  '2025-11-01'::date as month,
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
FROM vaccine_data vd;

-- ============================================
-- Step 3: INSERT DECEMBER DATA WITH CARRYOVER
-- ============================================
-- December Initial = November Ending
-- December IN = new vaccines added in December
-- December Ending = Initial + IN - OUT - Wastage

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
  nov.vaccine_id,
  '2025-12-01'::date as month,
  nov.ending_inventory as initial_inventory,  -- December Initial = November Ending ✓
  0 as quantity_supplied,  -- No new vaccines in December (adjust if needed)
  0 as quantity_used,
  0 as quantity_wastage,
  nov.ending_inventory as ending_inventory,  -- Ending = Initial + IN - OUT - Wastage
  nov.vials_needed,
  nov.max_allocation,
  CASE 
    WHEN nov.max_allocation = 0 THEN 0
    ELSE ROUND((nov.ending_inventory::float / nov.max_allocation::float) * 100)
  END as stock_level_percentage,
  CASE 
    WHEN nov.max_allocation = 0 THEN 'GOOD'
    WHEN ROUND((nov.ending_inventory::float / nov.max_allocation::float) * 100) = 0 THEN 'STOCKOUT'
    WHEN ROUND((nov.ending_inventory::float / nov.max_allocation::float) * 100) < 25 THEN 'STOCKOUT'
    WHEN ROUND((nov.ending_inventory::float / nov.max_allocation::float) * 100) < 50 THEN 'UNDERSTOCK'
    WHEN ROUND((nov.ending_inventory::float / nov.max_allocation::float) * 100) > 75 THEN 'OVERSTOCK'
    ELSE 'GOOD'
  END as status,
  NOW() as created_at,
  NOW() as updated_at
FROM vaccine_monthly_report nov
WHERE nov.month = '2025-11-01';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show November data
SELECT 
  'NOVEMBER' as month_label,
  vaccine_id,
  month,
  initial_inventory,
  quantity_supplied as "IN",
  quantity_used as "OUT",
  quantity_wastage,
  ending_inventory,
  stock_level_percentage as "%Stock",
  status
FROM vaccine_monthly_report
WHERE month = '2025-11-01'
ORDER BY vaccine_id;

-- Show December data
SELECT 
  'DECEMBER' as month_label,
  vaccine_id,
  month,
  initial_inventory,
  quantity_supplied as "IN",
  quantity_used as "OUT",
  quantity_wastage,
  ending_inventory,
  stock_level_percentage as "%Stock",
  status
FROM vaccine_monthly_report
WHERE month = '2025-12-01'
ORDER BY vaccine_id;

-- Show carryover verification
SELECT 
  nov.vaccine_id,
  'November Ending' as nov_ending,
  nov.ending_inventory as nov_ending_value,
  'December Initial' as dec_initial,
  dec.initial_inventory as dec_initial_value,
  CASE 
    WHEN nov.ending_inventory = dec.initial_inventory THEN '✓ CORRECT'
    ELSE '✗ MISMATCH'
  END as carryover_status
FROM vaccine_monthly_report nov
LEFT JOIN vaccine_monthly_report dec 
  ON nov.vaccine_id = dec.vaccine_id 
  AND nov.month = '2025-11-01'
  AND dec.month = '2025-12-01'
ORDER BY nov.vaccine_id;

-- Show totals
SELECT COUNT(*) as total_records FROM vaccine_monthly_report;
