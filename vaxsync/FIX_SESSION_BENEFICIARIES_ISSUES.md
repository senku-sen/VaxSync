# Fix Session Beneficiaries Issues

## Issues Found

### 1. RLS Policy Error (403 Forbidden)
**Error:** `new row violates row-level security policy for table "session_beneficiaries"`

**Root Cause:** The RLS policies may be conflicting or not properly configured.

**Solution:** 
1. Go to Supabase Dashboard → SQL Editor
2. Run this query to reset the RLS policies:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read session_beneficiaries" ON session_beneficiaries;
DROP POLICY IF EXISTS "Allow authenticated users to insert session_beneficiaries" ON session_beneficiaries;
DROP POLICY IF EXISTS "Allow authenticated users to update session_beneficiaries" ON session_beneficiaries;
DROP POLICY IF EXISTS "Allow authenticated users to delete session_beneficiaries" ON session_beneficiaries;

-- Recreate policies
CREATE POLICY "Allow authenticated users to read session_beneficiaries"
  ON session_beneficiaries
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert session_beneficiaries"
  ON session_beneficiaries
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update session_beneficiaries"
  ON session_beneficiaries
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete session_beneficiaries"
  ON session_beneficiaries
  FOR DELETE
  USING (auth.role() = 'authenticated');
```

### 2. Vaccine Inventory Issue
**Error:** `Not enough vials available to reserve. Available: 0, Requested: 1. Total vials: 20, Already reserved: 20`

**Root Cause:** All 20 vials are marked as reserved, leaving 0 available.

**Solution:** Use the fix-reserved endpoint to recalculate:

```bash
curl -X POST http://localhost:3000/api/inventory/fix-reserved \
  -H "Content-Type: application/json" \
  -d '{
    "barangayId": "39b82afd-48db-4c6e-86e0-c1658563199c",
    "vaccineId": "fa85f42e-b1c1-424f-a607-07c56936984e"
  }'
```

Or in JavaScript:
```javascript
const result = await fetch('/api/inventory/fix-reserved', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    barangayId: '39b82afd-48db-4c6e-86e0-c1658563199c',
    vaccineId: 'fa85f42e-b1c1-424f-a607-07c56936984e'
  })
});
```

## Steps to Fix

1. **Fix RLS Policies:**
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Run the SQL query above
   - Wait for success

2. **Fix Inventory:**
   - Call the fix-reserved endpoint with the barangayId and vaccineId
   - This recalculates reserved vials based on actual sessions

3. **Test:**
   - Try adding a session again
   - Participants should now be saved to database
   - Inventory reservation should work

## Files Modified

- `SQL_MIGRATIONS/session_beneficiaries_schema.sql` - Updated RLS policies
- `app/api/inventory/fix-reserved/route.js` - Created endpoint to fix inventory
- `lib/barangayVaccineInventory.js` - Added `recalculateReservedVials` function

## Status

✅ Code changes completed
⏳ Awaiting manual Supabase SQL execution
⏳ Awaiting inventory fix via API call
