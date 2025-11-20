# VaxSync Schema Protection Guide

**Purpose:** Prevent accidental or unauthorized schema changes  
**Last Updated:** November 20, 2025

---

## 🔒 Three Levels of Schema Protection

### Level 1: Data Validation (Constraints)
**What it does:** Prevents invalid data from being inserted  
**What it prevents:** Bad data, NULL values, duplicates, invalid statuses  
**What it allows:** Schema structure changes  
**File:** `SCHEMA_LOCK_CONSTRAINTS.sql`

### Level 2: Role-Based Access Control
**What it does:** Restricts who can modify the schema  
**What it prevents:** Unauthorized users from altering tables  
**What it allows:** Authorized admins to make changes  
**File:** `SCHEMA_ROLE_PERMISSIONS.sql` (see below)

### Level 3: Complete Schema Lock
**What it does:** Prevents ALL schema modifications  
**What it prevents:** Adding/dropping/renaming columns, changing types  
**What it allows:** Only data operations (INSERT, UPDATE, DELETE)  
**File:** `SCHEMA_COMPLETE_LOCK.sql` (see below)

---

## 📋 Level 1: Data Validation Constraints

**Status:** ✅ Ready to use  
**File:** `SCHEMA_LOCK_CONSTRAINTS.sql`

### What Gets Protected

```sql
✅ user_profiles
  ├─ user_role must be 'Health Worker' or 'Head Nurse'
  ├─ first_name, last_name, email, user_role cannot be NULL
  └─ email must be unique

✅ barangays
  ├─ name and municipality cannot be NULL
  ├─ name must be unique
  └─ population must be >= 0

✅ vaccines
  ├─ name cannot be NULL
  ├─ status must be 'Active' or 'Inactive'
  └─ quantity_available must be >= 0

✅ vaccine_requests
  ├─ All critical fields cannot be NULL
  ├─ status must be 'pending', 'approved', 'rejected', or 'released'
  ├─ quantity_dose must be > 0
  └─ quantity_vial must be >= 0 (if not NULL)

✅ barangay_vaccine_inventory
  ├─ barangay_id, vaccine_id, quantity_vial, quantity_dose cannot be NULL
  ├─ All quantities must be >= 0
  └─ reserved_vial must be >= 0 (if not NULL)

✅ vaccination_sessions
  ├─ All critical fields cannot be NULL
  ├─ status must be 'Scheduled', 'In progress', or 'Completed'
  ├─ target must be > 0
  ├─ administered must be >= 0
  └─ administered cannot exceed target
```

### How to Apply

```sql
-- Copy entire SCHEMA_LOCK_CONSTRAINTS.sql
-- Paste into Supabase SQL Editor
-- Run the script
```

### Benefits
✅ Prevents invalid data  
✅ Catches errors early  
✅ Maintains data integrity  
✅ Easy to implement  

### Limitations
❌ Doesn't prevent schema structure changes  
❌ Doesn't prevent unauthorized access  

---

## 🔐 Level 2: Role-Based Access Control

**Status:** 📝 Template provided below  
**File:** Create `SCHEMA_ROLE_PERMISSIONS.sql`

### Concept

Restrict who can modify the schema based on their role:

```sql
-- Only Head Nurse can modify schema
-- Health Workers cannot modify schema
-- Public cannot access schema
```

### Implementation

```sql
-- ============================================
-- SCHEMA ROLE PERMISSIONS
-- ============================================

-- Create a role for schema administrators
CREATE ROLE schema_admin;

-- Grant schema modification permissions to admin only
GRANT USAGE ON SCHEMA public TO schema_admin;
GRANT CREATE ON SCHEMA public TO schema_admin;

-- Revoke from public
REVOKE CREATE ON SCHEMA public FROM public;

-- Grant table permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO schema_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO schema_admin;

-- Assign Head Nurse to schema_admin role
-- (In Supabase, this is done via user_role in user_profiles)

-- For Health Workers: read-only on most tables
CREATE ROLE health_worker;
GRANT SELECT ON public.barangays TO health_worker;
GRANT SELECT ON public.vaccines TO health_worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccine_requests TO health_worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccination_sessions TO health_worker;
```

### Benefits
✅ Prevents unauthorized schema changes  
✅ Role-based access control  
✅ Audit trail of who changed what  

### Limitations
❌ Requires role management  
❌ More complex to set up  
❌ Still allows authorized changes  

---

## 🛡️ Level 3: Complete Schema Lock

**Status:** 📝 Template provided below  
**File:** Create `SCHEMA_COMPLETE_LOCK.sql`

### Concept

Completely prevent ANY schema modifications. Only data operations allowed.

### Implementation

```sql
-- ============================================
-- COMPLETE SCHEMA LOCK
-- ============================================

-- Disable all DDL (Data Definition Language) operations
-- Allow only DML (Data Manipulation Language) operations

-- Method 1: Using event triggers (PostgreSQL 9.3+)
CREATE OR REPLACE FUNCTION prevent_schema_changes()
RETURNS event_trigger AS $$
BEGIN
  RAISE EXCEPTION 'Schema modifications are not allowed. Contact database administrator.';
END;
$$ LANGUAGE plpgsql;

CREATE EVENT TRIGGER prevent_ddl ON ddl_command_start
EXECUTE FUNCTION prevent_schema_changes();

-- Method 2: Revoke all DDL permissions
REVOKE ALL ON SCHEMA public FROM public;
REVOKE ALL ON SCHEMA public FROM authenticated;

-- Only allow SELECT, INSERT, UPDATE, DELETE on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

### Benefits
✅ Completely prevents schema changes  
✅ Only data operations allowed  
✅ Maximum protection  

### Limitations
❌ Cannot make ANY schema changes without disabling  
❌ Requires database admin access to modify  
❌ May break migrations/updates  

---

## 🎯 Recommended Approach

### For Development
Use **Level 1 (Constraints)** only:
- Allows flexibility for schema changes
- Protects data integrity
- Easy to implement

### For Staging
Use **Level 1 + Level 2 (Constraints + Role-Based Access)**:
- Prevents unauthorized changes
- Still allows admin to make changes
- Good balance

### For Production
Use **Level 1 + Level 2 + Level 3 (All Three)**:
- Maximum protection
- Only data operations allowed
- Schema changes require admin intervention

---

## 📊 Comparison Table

```
┌──────────────────┬──────────┬──────────┬──────────┐
│ Protection       │ Level 1  │ Level 2  │ Level 3  │
├──────────────────┼──────────┼──────────┼──────────┤
│ Data Validation  │    ✅    │    ✅    │    ✅    │
│ Access Control   │    ❌    │    ✅    │    ✅    │
│ Schema Lock      │    ❌    │    ❌    │    ✅    │
│ Flexibility      │   HIGH   │  MEDIUM  │   LOW    │
│ Complexity       │   LOW    │  MEDIUM  │   HIGH   │
│ Recommended For  │   DEV    │  STAGING │  PROD    │
└──────────────────┴──────────┴──────────┴──────────┘
```

---

## 🚀 Implementation Steps

### Step 1: Apply Level 1 (Data Validation)

```bash
1. Open Supabase SQL Editor
2. Copy entire SCHEMA_LOCK_CONSTRAINTS.sql
3. Paste into SQL Editor
4. Run the script
5. Verify: Check constraints appear in Supabase
```

### Step 2: Apply Level 2 (Role-Based Access) - Optional

```bash
1. Create SCHEMA_ROLE_PERMISSIONS.sql
2. Paste into Supabase SQL Editor
3. Run the script
4. Assign roles to users
```

### Step 3: Apply Level 3 (Complete Lock) - Optional

```bash
1. Create SCHEMA_COMPLETE_LOCK.sql
2. Paste into Supabase SQL Editor
3. Run the script
4. Test that only data operations work
```

---

## ✅ Verification

### Check Constraints Are Applied

```sql
-- View all constraints
SELECT constraint_name, table_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'barangays', 'vaccines', 'vaccine_requests', 'barangay_vaccine_inventory', 'vaccination_sessions')
ORDER BY table_name, constraint_name;

-- View check constraints
SELECT constraint_name, table_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public'
ORDER BY table_name, constraint_name;
```

### Test Data Validation

```sql
-- This should FAIL (invalid status)
INSERT INTO vaccine_requests (barangay_id, vaccine_id, requested_by, quantity_dose, status)
VALUES ('uuid', 'uuid', 'uuid', 10, 'invalid_status');

-- This should FAIL (NULL required field)
INSERT INTO user_profiles (first_name, last_name, email, user_role)
VALUES ('John', NULL, 'john@example.com', 'Health Worker');

-- This should FAIL (duplicate email)
INSERT INTO user_profiles (first_name, last_name, email, user_role)
VALUES ('Jane', 'Doe', 'existing@example.com', 'Health Worker');

-- This should SUCCEED (valid data)
INSERT INTO vaccines (name, status)
VALUES ('COVID-19', 'Active');
```

---

## 🔄 Removing Constraints (If Needed)

### Remove Specific Constraint

```sql
-- Remove a specific constraint
ALTER TABLE public.vaccine_requests
DROP CONSTRAINT check_request_status;
```

### Remove All Constraints from a Table

```sql
-- Remove all check constraints from vaccine_requests
ALTER TABLE public.vaccine_requests
DROP CONSTRAINT IF EXISTS check_request_status;
ALTER TABLE public.vaccine_requests
DROP CONSTRAINT IF EXISTS check_request_quantity;
ALTER TABLE public.vaccine_requests
DROP CONSTRAINT IF EXISTS check_request_vial;
```

### Remove All Constraints (Complete Reset)

```sql
-- Drop all constraints (dangerous!)
-- Only do this if you need to completely reset the schema

-- First, identify all constraints
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND constraint_type = 'CHECK';

-- Then drop them one by one
ALTER TABLE public.table_name DROP CONSTRAINT constraint_name;
```

---

## 📝 Best Practices

### DO ✅
- Apply Level 1 constraints to all tables
- Test constraints before production
- Document all constraints
- Review constraints regularly
- Use meaningful constraint names

### DON'T ❌
- Apply Level 3 lock without testing
- Remove constraints without backup
- Ignore constraint violations
- Skip verification after applying
- Apply constraints to production without staging first

---

## 🆘 Troubleshooting

### Issue: "Constraint already exists"
```sql
-- Drop existing constraint first
ALTER TABLE public.vaccine_requests
DROP CONSTRAINT IF EXISTS check_request_status;

-- Then create new one
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT check_request_status 
CHECK (status IN ('pending', 'approved', 'rejected', 'released'));
```

### Issue: "Cannot add constraint - violates existing data"
```sql
-- Fix existing data first
UPDATE public.vaccine_requests 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'approved', 'rejected', 'released');

-- Then add constraint
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT check_request_status 
CHECK (status IN ('pending', 'approved', 'rejected', 'released'));
```

### Issue: "Foreign key constraint violation"
```sql
-- Check for orphaned records
SELECT * FROM public.vaccine_requests 
WHERE barangay_id NOT IN (SELECT id FROM public.barangays);

-- Delete orphaned records
DELETE FROM public.vaccine_requests 
WHERE barangay_id NOT IN (SELECT id FROM public.barangays);

-- Then add constraint
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT fk_vaccine_requests_barangay_id 
FOREIGN KEY (barangay_id) REFERENCES public.barangays(id);
```

---

## 📚 Related Files

- **SCHEMA_LOCK_CONSTRAINTS.sql** - Ready-to-use constraints
- **COMPLETE_DATABASE_SCHEMA.md** - Full schema reference
- **DATABASE_QUICK_REFERENCE.md** - Quick lookup guide
- **RLS_POLICIES_SETUP.sql** - Permission policies

---

## 🎯 Summary

**Level 1 (Constraints):**
- ✅ Prevents invalid data
- ✅ Easy to implement
- ✅ Recommended for all environments

**Level 2 (Role-Based Access):**
- ✅ Prevents unauthorized schema changes
- ✅ Maintains audit trail
- ✅ Recommended for staging/production

**Level 3 (Complete Lock):**
- ✅ Maximum protection
- ✅ Only data operations allowed
- ✅ Recommended for production only

---

**Schema Protection Guide Complete**  
**Last Updated:** November 20, 2025
