# Migration: Replace Contact Field with Administered Date

## Overview
Changed the residents form to use `administered_date` (vaccination date) instead of `contact` (phone number).

## Changes Made

### 1. Frontend Components Updated

#### Health Worker Residents Page
**File:** `vaxsync/app/pages/Health_Worker/residents/page.jsx`
- Replaced `contact` field with `administered_date` in form state
- Updated form input from text field to date picker
- Updated form data initialization in add/edit dialogs
- Updated `openEditDialog` function to load `administered_date`

#### Head Nurse Residents Page
**File:** `vaxsync/app/pages/Head_Nurse/residents/page.jsx`
- Replaced `contact` field with `administered_date` in form state
- Updated form input from text field to date picker
- Updated form data initialization in add/edit dialogs
- Updated `openEditDialog` function to load `administered_date`
- Updated export function to include `administered_date` in CSV headers

### 2. API Routes Updated

**File:** `vaxsync/app/api/residents/route.js`

#### POST Endpoint
- Changed destructuring to use `administered_date` instead of `contact`
- Updated validation to check for `administered_date` instead of `contact`
- Updated insert statement to use `administered_date` field

#### GET Endpoint
- Removed `contact` field from search filter

#### PUT Endpoint
- No changes needed (generic update handler)

### 3. Database Migration

**File:** `vaxsync/migrations/replace_contact_with_administered_date.sql`

Run this SQL in your Supabase SQL editor:

```sql
-- Add the new administered_date column
ALTER TABLE residents
ADD COLUMN IF NOT EXISTS administered_date DATE;

-- Drop the contact column
ALTER TABLE residents
DROP COLUMN IF EXISTS contact;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_residents_administered_date ON residents(administered_date);
```

## How to Apply the Migration

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the SQL from `vaxsync/migrations/replace_contact_with_administered_date.sql`
5. Run the query
6. Verify the table structure changed correctly

## Field Details

### Old Field: `contact`
- Type: Text/String
- Purpose: Phone number
- Format: e.g., "09XXXXXXXXX"

### New Field: `administered_date`
- Type: Date
- Purpose: When the resident was vaccinated
- Format: YYYY-MM-DD (ISO format)
- UI: Date picker input

## Testing Checklist

- [ ] Add a new resident - verify `administered_date` is required and accepts date input
- [ ] Edit an existing resident - verify `administered_date` field loads and can be updated
- [ ] Export residents to CSV - verify `administered_date` column appears in export
- [ ] Search residents - verify search still works (no longer searches contact field)
- [ ] Check database - verify `contact` column is removed and `administered_date` exists

## Rollback (if needed)

If you need to rollback this change, run:

```sql
-- Add contact column back
ALTER TABLE residents
ADD COLUMN contact TEXT;

-- Drop administered_date column
ALTER TABLE residents
DROP COLUMN IF EXISTS administered_date;

-- Drop the index
DROP INDEX IF EXISTS idx_residents_administered_date;
```

Then revert the code changes in the frontend and API routes.
