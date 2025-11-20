# Database Schema Fix - Post-Login Issues

## Issues Encountered

After user login, the application encounters these errors:

1. **Foreign key relationship error**: `assigned_barangay_id` relationship not found in `user_profiles`
2. **Column error**: `vaccine_requests.requested_by` column doesn't exist

## Root Cause

The database schema doesn't match what the application code expects. The code was written assuming certain column names and relationships that don't exist in the actual database.

## Solution

### Step 1: Check Actual Database Schema

Go to **Supabase Dashboard** → **SQL Editor** and run these queries to see what columns actually exist:

```sql
-- Check user_profiles columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'user_profiles' ORDER BY ordinal_position;

-- Check vaccine_requests columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'vaccine_requests' ORDER BY ordinal_position;

-- Check barangays columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'barangays' ORDER BY ordinal_position;
```

### Step 2: Fix user_profiles Table

**If `assigned_barangay_id` column doesn't exist:**

```sql
-- Add the missing column if it doesn't exist
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS assigned_barangay_id UUID REFERENCES public.barangays(id);
```

**If the column exists but relationship is broken:**

```sql
-- Drop and recreate the foreign key
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_assigned_barangay_id_fkey;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_assigned_barangay_id_fkey 
FOREIGN KEY (assigned_barangay_id) REFERENCES public.barangays(id);
```

### Step 3: Fix vaccine_requests Table

**If `requested_by` column doesn't exist:**

```sql
-- Add the missing column
ALTER TABLE public.vaccine_requests
ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES public.user_profiles(id);

-- Update existing records if needed (set to a default user or NULL)
UPDATE public.vaccine_requests 
SET requested_by = NULL 
WHERE requested_by IS NULL;
```

**If the column exists but relationship is broken:**

```sql
-- Drop and recreate the foreign key
ALTER TABLE public.vaccine_requests
DROP CONSTRAINT IF EXISTS vaccine_requests_requested_by_fkey;

ALTER TABLE public.vaccine_requests
ADD CONSTRAINT vaccine_requests_requested_by_fkey 
FOREIGN KEY (requested_by) REFERENCES public.user_profiles(id);
```

### Step 4: Verify RLS Policies

Ensure RLS policies allow the queries:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'vaccine_requests');

-- If RLS is enabled, check policies
SELECT * FROM pg_policies WHERE tablename IN ('user_profiles', 'vaccine_requests');
```

**If RLS is blocking queries, add these policies:**

```sql
-- For user_profiles
CREATE POLICY "Allow authenticated users to read user_profiles"
ON public.user_profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- For vaccine_requests
CREATE POLICY "Health Worker can read own vaccine requests"
ON public.vaccine_requests
FOR SELECT
USING (requested_by = auth.uid());

CREATE POLICY "Head Nurse can read all vaccine requests"
ON public.vaccine_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse'
  )
);
```

### Step 5: Test the Fixes

1. **Test user profile loading:**
   - Log in as health worker
   - Check browser console for errors
   - Verify user profile loads with barangay info

2. **Test vaccine request loading:**
   - Navigate to vaccine request page
   - Check if requests load without errors
   - Verify notifications page works

## Temporary Workaround (If Schema Can't Be Fixed Immediately)

The application code has been updated to handle missing columns gracefully:

1. **If `requested_by` doesn't exist**: The app will fetch all vaccine requests and filter client-side
2. **If `assigned_barangay_id` relationship fails**: The app fetches barangay separately

This allows the app to work even with schema mismatches, though it's not ideal for performance.

## Verification Checklist

- [ ] `user_profiles` table has `assigned_barangay_id` column
- [ ] `vaccine_requests` table has `requested_by` column
- [ ] Foreign key relationships are properly configured
- [ ] RLS policies allow authenticated users to read data
- [ ] Health worker can log in without errors
- [ ] Vaccine requests page loads successfully
- [ ] Notifications page displays vaccine request notifications
- [ ] Real-time updates work when Head Nurse approves/rejects requests

## Files That Handle Schema Issues

The following files have been updated to handle schema mismatches:

1. **`/lib/accAuth.js`** - Fetches barangay separately if relationship fails
2. **`/lib/vaccineRequest.js`** - Handles missing `requested_by` column
3. **`/lib/notification.js`** - Handles missing `requested_by` column

## Next Steps

1. Run the schema check queries to see actual database structure
2. Apply the appropriate fixes based on what's missing
3. Test the application after fixes
4. Monitor console for any remaining errors

## Support

If you need to check the exact schema structure, run this comprehensive query:

```sql
-- Get complete schema information
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  tc.constraint_type
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN information_schema.table_constraints tc ON t.table_name = tc.table_name
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('user_profiles', 'vaccine_requests', 'barangays')
ORDER BY t.table_name, c.ordinal_position;
```

This will show you exactly what columns exist and what constraints are defined.
