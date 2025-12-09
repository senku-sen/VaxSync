# SQL Error Fix - Column "created_at" Does Not Exist

## The Problem

You got this error:
```
ERROR: 42703: column "created_at" does not exist
LINE 42: SELECT id, name, mother, status, created_at
HINT: Perhaps you meant to reference the column "residents.updated_at".
```

## The Cause

The residents table uses `updated_at` instead of `created_at` for tracking timestamps.

The SQL_QUICK_REFERENCE.sql file had incorrect column names in the verification queries.

## The Solution

### Option 1: Use the Corrected File (RECOMMENDED)
1. Open `SQL_CORRECTED.sql` (new file)
2. Copy all the commands
3. Paste into Supabase SQL Editor
4. Run the queries

### Option 2: Fix Manually
Replace `created_at` with `updated_at` in these queries:

**Query 1 - Check residents with mother information:**
```sql
-- BEFORE (WRONG):
SELECT id, name, mother, status, created_at
FROM residents 
WHERE mother IS NOT NULL 
ORDER BY created_at DESC
LIMIT 10;

-- AFTER (CORRECT):
SELECT id, name, mother, status, updated_at
FROM residents 
WHERE mother IS NOT NULL 
ORDER BY updated_at DESC
LIMIT 10;
```

**Query 2 - Rollback (in comments):**
```sql
-- BEFORE (WRONG):
-- WHERE status = 'approved' AND created_at > NOW() - INTERVAL '1 day';

-- AFTER (CORRECT):
-- WHERE status = 'approved' AND updated_at > NOW() - INTERVAL '1 day';
```

---

## Correct Column Names in Residents Table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | Resident name |
| birthday | date | Birth date |
| sex | text | Male/Female |
| status | text | approved/pending |
| mother | text | **NEW** - Mother's name |
| updated_at | timestamp | Last update time |
| submitted_at | timestamp | Submission time |

---

## Steps to Fix

### Step 1: Run the Corrected Queries
1. Open `SQL_CORRECTED.sql`
2. Copy all commands
3. Go to Supabase → SQL Editor
4. Paste and run

### Step 2: Verify the Changes
Run the verification queries to confirm:
- ✅ Mother column exists
- ✅ Status distribution shows approved/pending
- ✅ Residents with mother info display correctly

### Step 3: Continue with Your Work
- Add residents with mother field
- Verify auto-approval is working
- Test the new features

---

## Files to Use

### ✅ CORRECT:
- `SQL_CORRECTED.sql` - All queries verified and fixed

### ⚠️ OUTDATED:
- `SQL_QUICK_REFERENCE.sql` - Has the created_at error (don't use)

---

## What Was Wrong

The original SQL_QUICK_REFERENCE.sql had:
```sql
SELECT id, name, mother, status, created_at  ← WRONG
FROM residents 
WHERE mother IS NOT NULL 
ORDER BY created_at DESC  ← WRONG
```

Should be:
```sql
SELECT id, name, mother, status, updated_at  ← CORRECT
FROM residents 
WHERE mother IS NOT NULL 
ORDER BY updated_at DESC  ← CORRECT
```

---

## Prevention

When writing SQL queries for the residents table:
- Use `updated_at` for last modification time
- Use `submitted_at` for submission time
- Don't use `created_at` (doesn't exist in this table)

---

## Need Help?

If you get more errors:
1. Check the column name in the error message
2. Verify the table name is correct
3. Use `information_schema.columns` to list all columns
4. Compare with the table above

---

**Status:** ✅ Fixed
**File to Use:** SQL_CORRECTED.sql
**Last Updated:** December 8, 2025
