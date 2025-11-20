# Core Tables - Quick Reference

**Tables:** barangays, vaccine_requests, vaccination_sessions

---

## 📊 Table Comparison

| Feature | barangays | vaccine_requests | vaccination_sessions |
|---------|-----------|------------------|----------------------|
| **Columns** | 6 | 11 | 11 |
| **Primary Key** | id (UUID) | id (UUID) | id (UUID) |
| **Foreign Keys** | 1 | 3 | 3 |
| **Indexes** | 2 | 5 | 5 |
| **RLS Policies** | 4 | 8 | 4 |
| **Constraints** | 2 | 3 | 4 |

---

## 🔍 Quick Column Check

### barangays (6 columns)
```
✅ id (UUID, PK)
✅ name (VARCHAR, UNIQUE)
✅ municipality (VARCHAR, default: 'Daet')
✅ population (INTEGER)
✅ assigned_health_worker (UUID, FK)
✅ created_at (TIMESTAMP)
```

### vaccine_requests (11 columns) ⚠️ CRITICAL
```
✅ id (UUID, PK)
✅ barangay_id (UUID, FK)
✅ vaccine_id (UUID, FK)
✅ requested_by (UUID, FK) ⚠️ MUST EXIST
✅ quantity_dose (INTEGER)
✅ quantity_vial (INTEGER)
✅ status (VARCHAR) - pending/approved/rejected/released
✅ created_at (TIMESTAMP)
✅ requested_at (TIMESTAMP)
✅ notes (TEXT)
✅ request_code (VARCHAR)
```

### vaccination_sessions (11 columns)
```
✅ id (UUID, PK)
✅ barangay_id (UUID, FK)
✅ vaccine_id (UUID, FK)
✅ session_date (DATE)
✅ session_time (TIME)
✅ target (INTEGER)
✅ administered (INTEGER)
✅ status (VARCHAR) - Scheduled/In progress/Completed
✅ created_by (UUID, FK)
✅ created_at (TIMESTAMP)
✅ updated_at (TIMESTAMP)
```

---

## 📋 Verification Checklist

- [ ] barangays table exists
- [ ] vaccine_requests table exists
- [ ] vaccination_sessions table exists
- [ ] All columns exist (see above)
- [ ] All foreign keys are set up
- [ ] All indexes are created
- [ ] RLS is enabled on all 3 tables
- [ ] RLS policies are in place
- [ ] Can insert valid data
- [ ] Invalid data is rejected

---

## 🚀 Quick Setup

### Step 1: Copy SQL
```
File: CORE_TABLES_SETUP.sql
```

### Step 2: Run in Supabase
1. SQL Editor → New Query
2. Paste entire file
3. Click Run

### Step 3: Verify
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('barangays', 'vaccine_requests', 'vaccination_sessions');
```

---

## 🔐 RLS Permissions

### barangays
- **All Users:** READ
- **Head Nurse:** INSERT, UPDATE, DELETE

### vaccine_requests
- **Health Worker:** READ/CREATE/UPDATE/DELETE own only
- **Head Nurse:** READ/UPDATE/DELETE all

### vaccination_sessions
- **All Users:** READ, CREATE, UPDATE, DELETE

---

## 📊 Status Values

### vaccine_requests.status
- `pending` - Awaiting approval
- `approved` - Approved by Head Nurse
- `rejected` - Rejected by Head Nurse
- `released` - Ready for use

### vaccination_sessions.status
- `Scheduled` - Not started
- `In progress` - Currently happening
- `Completed` - Finished

---

## 🔗 Relationships

```
barangays
    ├─ vaccine_requests (barangay_id)
    └─ vaccination_sessions (barangay_id)

vaccines
    ├─ vaccine_requests (vaccine_id)
    └─ vaccination_sessions (vaccine_id)

user_profiles
    ├─ vaccine_requests (requested_by)
    └─ vaccination_sessions (created_by)
```

---

## ✅ Test Queries

### Check Data
```sql
SELECT * FROM barangays LIMIT 5;
SELECT * FROM vaccine_requests LIMIT 5;
SELECT * FROM vaccination_sessions LIMIT 5;
```

### Count Records
```sql
SELECT COUNT(*) FROM barangays;
SELECT COUNT(*) FROM vaccine_requests;
SELECT COUNT(*) FROM vaccination_sessions;
```

### Check Foreign Keys
```sql
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_name IN ('barangays', 'vaccine_requests', 'vaccination_sessions')
AND constraint_type = 'FOREIGN KEY';
```

### Check Indexes
```sql
SELECT tablename, indexname FROM pg_indexes 
WHERE tablename IN ('barangays', 'vaccine_requests', 'vaccination_sessions');
```

### Check RLS Policies
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('barangays', 'vaccine_requests', 'vaccination_sessions');
```

---

## 🛠️ Common Issues

### Issue: vaccine_requests.requested_by not found
**Fix:**
```sql
ALTER TABLE public.vaccine_requests
ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES public.user_profiles(id);
```

### Issue: Foreign key constraint violation
**Fix:**
```sql
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT fk_vaccine_requests_barangay_id 
FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON DELETE CASCADE;
```

### Issue: Permission denied
**Fix:** Run CORE_TABLES_SETUP.sql to add RLS policies

### Issue: Invalid status value
**Fix:** Use only valid status values (see Status Values above)

---

## 📁 Related Files

- **SCHEMA_CORE_TABLES.md** - Detailed documentation
- **CORE_TABLES_SETUP.sql** - SQL to create tables
- **SCHEMA_LOCK_CONSTRAINTS.sql** - Add data validation
- **RLS_POLICIES_SETUP.sql** - Add RLS policies

---

## 🎯 Summary

**3 Core Tables:**
- barangays (6 columns)
- vaccine_requests (11 columns)
- vaccination_sessions (11 columns)

**Total:**
- 28 columns
- 9 foreign keys
- 15 indexes
- 16 RLS policies

**Files:**
- SCHEMA_CORE_TABLES.md (detailed)
- CORE_TABLES_SETUP.sql (SQL)
- CORE_TABLES_QUICK_REF.md (this file)

---

**Last Updated:** November 20, 2025
