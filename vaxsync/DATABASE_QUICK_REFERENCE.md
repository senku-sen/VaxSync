# VaxSync Database - Quick Reference Guide

**For Developers & Troubleshooting**

---

## Table Summary

| Table | Purpose | Key Fields | RLS |
|-------|---------|-----------|-----|
| **user_profiles** | Users & roles | id, email, user_role, assigned_barangay_id | ✅ Enabled |
| **barangays** | Villages | id, name, municipality, assigned_health_worker | ✅ Enabled |
| **vaccines** | Vaccine master data | id, name, batch_number, expiry_date | ✅ Enabled |
| **vaccine_requests** | Vaccine requests | id, vaccine_id, barangay_id, requested_by, status | ✅ Enabled |
| **barangay_vaccine_inventory** | Vaccine stock | id, barangay_id, vaccine_id, quantity_vial | ✅ Enabled |
| **vaccination_sessions** | Scheduled sessions | id, barangay_id, vaccine_id, session_date, status | ✅ Enabled |

---

## Column Checklist

### ✅ Must Exist Columns

**user_profiles:**
- [ ] `id` (UUID, PK)
- [ ] `first_name` (VARCHAR)
- [ ] `last_name` (VARCHAR)
- [ ] `email` (VARCHAR, UNIQUE)
- [ ] `user_role` (VARCHAR) - "Health Worker" or "Head Nurse"
- [ ] `assigned_barangay_id` (UUID, FK to barangays)
- [ ] `created_at` (TIMESTAMP)

**barangays:**
- [ ] `id` (UUID, PK)
- [ ] `name` (VARCHAR, UNIQUE)
- [ ] `municipality` (VARCHAR)
- [ ] `population` (INTEGER)
- [ ] `assigned_health_worker` (UUID, FK to user_profiles)
- [ ] `created_at` (TIMESTAMP)

**vaccines:**
- [ ] `id` (UUID, PK)
- [ ] `name` (VARCHAR)
- [ ] `batch_number` (VARCHAR)
- [ ] `quantity_available` (INTEGER)
- [ ] `expiry_date` (DATE)
- [ ] `status` (VARCHAR) - "Active" or "Inactive"
- [ ] `created_at` (TIMESTAMP)

**vaccine_requests:**
- [ ] `id` (UUID, PK)
- [ ] `barangay_id` (UUID, FK)
- [ ] `vaccine_id` (UUID, FK)
- [ ] `requested_by` (UUID, FK to user_profiles) ⚠️ **CRITICAL**
- [ ] `quantity_dose` (INTEGER)
- [ ] `quantity_vial` (INTEGER)
- [ ] `status` (VARCHAR) - "pending", "approved", "rejected", "released"
- [ ] `created_at` (TIMESTAMP)

**barangay_vaccine_inventory:**
- [ ] `id` (UUID, PK)
- [ ] `barangay_id` (UUID, FK)
- [ ] `vaccine_id` (UUID, FK)
- [ ] `quantity_vial` (INTEGER)
- [ ] `quantity_dose` (INTEGER)
- [ ] `batch_number` (VARCHAR)
- [ ] `expiry_date` (DATE)
- [ ] `created_at` (TIMESTAMP)

**vaccination_sessions:**
- [ ] `id` (UUID, PK)
- [ ] `barangay_id` (UUID, FK)
- [ ] `vaccine_id` (UUID, FK)
- [ ] `session_date` (DATE)
- [ ] `session_time` (TIME)
- [ ] `target` (INTEGER)
- [ ] `administered` (INTEGER)
- [ ] `status` (VARCHAR) - "Scheduled", "In progress", "Completed"
- [ ] `created_by` (UUID, FK to user_profiles)
- [ ] `created_at` (TIMESTAMP)

---

## Common Issues & Fixes

### ❌ Issue: "Column 'requested_by' not found"

**Error:**
```
ERROR: column "requested_by" does not exist
```

**Fix:**
```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'vaccine_requests' AND column_name = 'requested_by';

-- If not found, add it
ALTER TABLE public.vaccine_requests
ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES public.user_profiles(id);

-- Update existing records
UPDATE public.vaccine_requests 
SET requested_by = NULL 
WHERE requested_by IS NULL;
```

---

### ❌ Issue: "Foreign key constraint violation"

**Error:**
```
ERROR: insert or update on table "vaccine_requests" violates foreign key constraint
```

**Fix:**
```sql
-- Check if FK exists
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'vaccine_requests' AND constraint_type = 'FOREIGN KEY';

-- If missing, add it
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT fk_vaccine_requests_requested_by 
FOREIGN KEY (requested_by) REFERENCES public.user_profiles(id);
```

---

### ❌ Issue: "Permission denied" or empty results

**Error:**
```
Permission denied for schema public
```

**Fix:**
1. Check RLS is enabled:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'vaccine_requests';
```

2. Check policies exist:
```sql
SELECT policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'vaccine_requests';
```

3. If no policies, run: `RLS_POLICIES_SETUP.sql`

---

### ❌ Issue: "assigned_barangay_id relationship not found"

**Error:**
```
ERROR: relationship "assigned_barangay_id" does not exist
```

**Fix:**
```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'assigned_barangay_id';

-- If not found, add it
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS assigned_barangay_id UUID REFERENCES public.barangays(id);

-- If FK is broken, recreate it
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_assigned_barangay_id_fkey;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_assigned_barangay_id_fkey 
FOREIGN KEY (assigned_barangay_id) REFERENCES public.barangays(id);
```

---

## Verification Queries

### Check Table Structure

```sql
-- Show all columns in a table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'vaccine_requests' 
ORDER BY ordinal_position;
```

### Check Foreign Keys

```sql
-- Show all foreign keys
SELECT constraint_name, table_name, column_name, 
       referenced_table_name, referenced_column_name
FROM information_schema.referential_constraints
WHERE table_name IN ('vaccine_requests', 'user_profiles', 'barangay_vaccine_inventory');
```

### Check Indexes

```sql
-- Show all indexes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### Check RLS Policies

```sql
-- Show all policies
SELECT tablename, policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('vaccine_requests', 'user_profiles', 'vaccines', 'barangays', 'barangay_vaccine_inventory', 'vaccination_sessions')
ORDER BY tablename, policyname;
```

### Check Data

```sql
-- Count records in each table
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM user_profiles
UNION ALL
SELECT 'barangays', COUNT(*) FROM barangays
UNION ALL
SELECT 'vaccines', COUNT(*) FROM vaccines
UNION ALL
SELECT 'vaccine_requests', COUNT(*) FROM vaccine_requests
UNION ALL
SELECT 'barangay_vaccine_inventory', COUNT(*) FROM barangay_vaccine_inventory
UNION ALL
SELECT 'vaccination_sessions', COUNT(*) FROM vaccination_sessions;
```

---

## Frontend Code Mapping

### Where Each Table Is Used

**user_profiles:**
- `lib/accAuth.js` - `getUserProfile()`
- `lib/vaccineRequest.js` - `loadUserProfile()`
- `app/pages/signin/page.js` - User login

**barangays:**
- `lib/barangay.js` - `fetchBarangays()`
- `app/pages/Head_Nurse/barangay-management/page.jsx` - Manage barangays

**vaccines:**
- `lib/vaccine.js` - `fetchVaccines()`
- `app/pages/Health_Worker/vaccination_schedule/page.jsx` - Select vaccine

**vaccine_requests:**
- `lib/vaccineRequest.js` - All vaccine request functions
- `app/pages/Health_Worker/vaccination_request/page.jsx` - Create requests
- `app/pages/Head_Nurse/vaccination_request/page.jsx` - Approve requests

**barangay_vaccine_inventory:**
- `lib/barangayVaccineInventory.js` - Inventory management
- `app/pages/Health_Worker/inventory/page.jsx` - View inventory

**vaccination_sessions:**
- `lib/vaccinationSession.js` - Session management
- `app/pages/Health_Worker/vaccination_schedule/page.jsx` - Create sessions

---

## Data Validation Rules

### vaccine_requests

```javascript
// Required fields
- vaccine_id: UUID (must exist in vaccines table)
- barangay_id: UUID (must exist in barangays table)
- requested_by: UUID (must be current user ID)
- quantity_dose: INTEGER > 0
- status: "pending" | "approved" | "rejected" | "released"

// Optional fields
- quantity_vial: INTEGER >= 0
- notes: TEXT
```

### vaccination_sessions

```javascript
// Required fields
- barangay_id: UUID (must exist)
- vaccine_id: UUID (must exist)
- session_date: DATE (must be today or future)
- session_time: TIME (valid time format)
- target: INTEGER > 0
- created_by: UUID (current user)
- status: "Scheduled" | "In progress" | "Completed"

// Auto-set fields
- administered: INTEGER (default 0)
- created_at: TIMESTAMP (current time)
```

---

## Performance Tips

### Indexes to Check

```sql
-- These should exist for good performance
CREATE INDEX idx_vaccine_requests_requested_by ON vaccine_requests(requested_by);
CREATE INDEX idx_vaccine_requests_status ON vaccine_requests(status);
CREATE INDEX idx_vaccine_requests_created_at ON vaccine_requests(created_at);
CREATE INDEX idx_vaccination_sessions_created_by ON vaccination_sessions(created_by);
CREATE INDEX idx_vaccination_sessions_session_date ON vaccination_sessions(session_date);
CREATE INDEX idx_barangay_vaccine_inventory_barangay_id ON barangay_vaccine_inventory(barangay_id);
```

### Query Optimization

**Instead of:**
```sql
SELECT * FROM vaccine_requests;
```

**Use:**
```sql
SELECT id, vaccine_id, barangay_id, status, created_at 
FROM vaccine_requests 
WHERE requested_by = 'user-id'
ORDER BY created_at DESC
LIMIT 50;
```

---

## Backup & Recovery

### Export Data

```sql
-- Export vaccine_requests
COPY vaccine_requests TO '/tmp/vaccine_requests.csv' WITH CSV HEADER;

-- Export vaccination_sessions
COPY vaccination_sessions TO '/tmp/vaccination_sessions.csv' WITH CSV HEADER;
```

### Restore Data

```sql
-- Restore vaccine_requests
COPY vaccine_requests FROM '/tmp/vaccine_requests.csv' WITH CSV HEADER;
```

---

## Testing Checklist

- [ ] Can create user profile
- [ ] Can assign barangay to health worker
- [ ] Can create vaccine request
- [ ] Can approve vaccine request
- [ ] Can view barangay inventory
- [ ] Can create vaccination session
- [ ] Can update session progress
- [ ] Can delete session
- [ ] Health worker sees only own requests
- [ ] Head nurse sees all requests
- [ ] RLS policies prevent unauthorized access

---

## Emergency Procedures

### If Data Is Corrupted

1. **Stop the application** - Prevent further writes
2. **Check backups** - Supabase auto-backups
3. **Restore from backup** - Via Supabase dashboard
4. **Verify data integrity** - Run verification queries
5. **Restart application** - Resume operations

### If RLS Policies Are Broken

1. **Temporarily disable RLS:**
```sql
ALTER TABLE public.vaccine_requests DISABLE ROW LEVEL SECURITY;
```

2. **Verify data is accessible**

3. **Re-enable RLS:**
```sql
ALTER TABLE public.vaccine_requests ENABLE ROW LEVEL SECURITY;
```

4. **Run RLS_POLICIES_SETUP.sql** to fix policies

---

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Schema File:** `COMPLETE_DATABASE_SCHEMA.md`
- **RLS Setup:** `RLS_POLICIES_SETUP.sql`

---

**Last Updated:** November 20, 2025  
**Maintained By:** VaxSync Development Team
