# Residents Table SQL Modifications

## Overview
This document provides SQL commands to modify the residents table to support the new changes:
1. Add `mother` field (mother's name)
2. Change default status from `pending` to `approved` (auto-approve)

---

## SQL Commands

### Step 1: Add Mother Column
```sql
ALTER TABLE residents
ADD COLUMN mother VARCHAR(255) DEFAULT NULL;
```

**What it does:**
- Adds a new column `mother` to store the mother's name
- Allows NULL values (optional field)
- Type: VARCHAR(255) - text field up to 255 characters

---

### Step 2: Create Index for Mother Column (Optional but Recommended)
```sql
CREATE INDEX idx_residents_mother ON residents(mother);
```

**What it does:**
- Creates an index for faster queries filtering by mother's name
- Improves performance when searching by mother

---

### Step 3: Update Existing Residents Status (Optional)
```sql
-- OPTION A: Update all pending residents to approved
UPDATE residents 
SET status = 'approved' 
WHERE status = 'pending';
```

**What it does:**
- Changes all existing residents with `status = 'pending'` to `status = 'approved'`
- Only run this if you want to auto-approve all existing pending residents
- **CAUTION:** This is irreversible. Make sure you want to approve all pending residents.

---

### Step 4: Verify Changes
```sql
-- Check if mother column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'residents' 
AND column_name = 'mother';

-- Check resident status distribution
SELECT status, COUNT(*) as count 
FROM residents 
GROUP BY status;

-- Check residents with mother information
SELECT id, name, mother, status 
FROM residents 
WHERE mother IS NOT NULL 
LIMIT 10;
```

---

## Running the SQL

### In Supabase Dashboard:
1. Go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the SQL commands above
4. Click **Run** button
5. Check the results

### Order of Execution:
1. Run Step 1 (Add mother column) - **REQUIRED**
2. Run Step 2 (Create index) - **OPTIONAL but recommended**
3. Run Step 3 (Update status) - **OPTIONAL, only if you want to auto-approve all pending**
4. Run Step 4 (Verify) - **RECOMMENDED to confirm changes**

---

## What Changed in the Code

### Frontend Changes:
- **AddResidentWizard.jsx**: Now accepts `mother` field in form
- **Residents API**: Now accepts and stores `mother` field
- **Status**: All new residents are now created with `status = 'approved'` (auto-approved)

### Backend Changes:
- **POST /api/residents**: Now includes `mother` field in resident object
- **Default Status**: Changed from `'pending'` to `'approved'`

---

## Important Notes

⚠️ **Before Running SQL:**
- Make a backup of your database
- Test in a development environment first
- Review the SQL carefully before executing

✅ **After Running SQL:**
- New residents will be auto-approved
- Mother field will be available in the form
- Existing pending residents remain pending (unless you run Step 3)

---

## Rollback (If Needed)

If you need to undo the changes:

```sql
-- Remove mother column
ALTER TABLE residents
DROP COLUMN mother;

-- Drop the index (if created)
DROP INDEX IF EXISTS idx_residents_mother;

-- Revert status changes (if you ran Step 3)
UPDATE residents 
SET status = 'pending' 
WHERE status = 'approved' AND submitted_at > NOW() - INTERVAL '1 day';
```

---

## Questions?

If you encounter any issues:
1. Check the Supabase logs for error messages
2. Verify the column names match exactly
3. Ensure you have proper permissions to modify the table
4. Contact support if needed
