# Schema Lock - Prevent Accidental Changes

**Purpose:** Protect your database schema from accidental or unauthorized modifications  
**Created:** November 20, 2025

---

## 🎯 What This Does

Prevents your teammate (or anyone) from accidentally changing the database structure by:

1. **Validating data** - Only correct data can be inserted
2. **Enforcing constraints** - Prevents NULL values, duplicates, invalid statuses
3. **Protecting relationships** - Foreign keys prevent orphaned records
4. **Locking structure** - (Optional) Prevents adding/removing/changing columns

---

## 📁 Files Created

### 1. SCHEMA_LOCK_CONSTRAINTS.sql ⭐ START HERE
- **What:** Data validation constraints
- **Size:** ~300 lines
- **Time to apply:** 5 minutes
- **Risk:** Very low (only validates data)
- **Recommended:** YES - Apply to all environments

**Prevents:**
- ✅ Invalid status values
- ✅ NULL values in critical fields
- ✅ Duplicate emails/barangay names
- ✅ Negative quantities
- ✅ Administered > target
- ✅ Orphaned records

### 2. SCHEMA_PROTECTION_GUIDE.md
- **What:** Complete guide to schema protection
- **Size:** ~400 lines
- **Contains:**
  - 3 levels of protection
  - When to use each level
  - Implementation steps
  - Verification queries
  - Troubleshooting

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Copy the SQL
Open: `SCHEMA_LOCK_CONSTRAINTS.sql`

### Step 2: Paste into Supabase
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Click "New Query"
4. Paste the entire SQL file
5. Click "Run"

### Step 3: Verify
```sql
-- Run this to check constraints were applied
SELECT constraint_name, table_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'barangays', 'vaccines', 'vaccine_requests', 'barangay_vaccine_inventory', 'vaccination_sessions')
ORDER BY table_name, constraint_name;
```

---

## 📊 What Gets Protected

### user_profiles
```
✅ user_role must be 'Health Worker' or 'Head Nurse'
✅ first_name, last_name, email cannot be NULL
✅ email must be unique
✅ Cannot have duplicate accounts
```

### barangays
```
✅ name and municipality cannot be NULL
✅ name must be unique
✅ population must be >= 0
✅ Cannot have duplicate barangays
```

### vaccines
```
✅ name cannot be NULL
✅ status must be 'Active' or 'Inactive'
✅ quantity_available must be >= 0
```

### vaccine_requests ⚠️ CRITICAL
```
✅ All critical fields cannot be NULL
✅ status must be 'pending', 'approved', 'rejected', or 'released'
✅ quantity_dose must be > 0
✅ quantity_vial must be >= 0
✅ Cannot have invalid statuses
```

### barangay_vaccine_inventory
```
✅ barangay_id, vaccine_id cannot be NULL
✅ quantity_vial, quantity_dose must be >= 0
✅ reserved_vial must be >= 0
```

### vaccination_sessions
```
✅ All critical fields cannot be NULL
✅ status must be 'Scheduled', 'In progress', or 'Completed'
✅ target must be > 0
✅ administered must be >= 0
✅ administered cannot exceed target
```

---

## 🔒 Three Levels of Protection

### Level 1: Data Validation ⭐ RECOMMENDED
**File:** `SCHEMA_LOCK_CONSTRAINTS.sql`
- Prevents invalid data
- Easy to implement
- No risk
- Allows schema changes

### Level 2: Role-Based Access (Optional)
**File:** Create from `SCHEMA_PROTECTION_GUIDE.md`
- Prevents unauthorized schema changes
- More complex
- Requires role management
- Still allows authorized changes

### Level 3: Complete Lock (Optional)
**File:** Create from `SCHEMA_PROTECTION_GUIDE.md`
- Prevents ALL schema changes
- Maximum protection
- Very restrictive
- Only for production

---

## ✅ Verification Checklist

After running the SQL:

- [ ] No errors in Supabase
- [ ] Constraints appear in verification query
- [ ] Can still insert valid data
- [ ] Invalid data is rejected
- [ ] Application still works
- [ ] All tests pass

---

## 🧪 Test the Constraints

### Test 1: Invalid Status (Should FAIL)
```sql
INSERT INTO vaccine_requests (barangay_id, vaccine_id, requested_by, quantity_dose, status)
VALUES ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 10, 'invalid_status');
-- Expected: ERROR - violates check constraint "check_request_status"
```

### Test 2: NULL Required Field (Should FAIL)
```sql
INSERT INTO user_profiles (first_name, last_name, email, user_role)
VALUES ('John', NULL, 'john@example.com', 'Health Worker');
-- Expected: ERROR - null value in column "last_name" violates not-null constraint
```

### Test 3: Duplicate Email (Should FAIL)
```sql
INSERT INTO user_profiles (first_name, last_name, email, user_role)
VALUES ('Jane', 'Doe', 'existing@example.com', 'Health Worker');
-- Expected: ERROR - duplicate key value violates unique constraint "unique_user_email"
```

### Test 4: Valid Data (Should SUCCEED)
```sql
INSERT INTO vaccines (name, status)
VALUES ('COVID-19', 'Active');
-- Expected: INSERT 0 1 (success)
```

---

## 🛠️ If You Need to Remove Constraints

### Remove One Constraint
```sql
ALTER TABLE public.vaccine_requests
DROP CONSTRAINT check_request_status;
```

### Remove All Constraints from a Table
```sql
ALTER TABLE public.vaccine_requests
DROP CONSTRAINT IF EXISTS check_request_status;
ALTER TABLE public.vaccine_requests
DROP CONSTRAINT IF EXISTS check_request_quantity;
ALTER TABLE public.vaccine_requests
DROP CONSTRAINT IF EXISTS check_request_vial;
```

---

## 📋 Constraint Types Applied

### CHECK Constraints
- Validate column values
- Example: `status IN ('pending', 'approved', 'rejected', 'released')`

### NOT NULL Constraints
- Require values in critical columns
- Example: `first_name NOT NULL`

### UNIQUE Constraints
- Prevent duplicate values
- Example: `email UNIQUE`

### FOREIGN KEY Constraints
- Link related tables
- Example: `barangay_id REFERENCES barangays(id)`

---

## 🎯 Benefits

✅ **Prevents Data Corruption**
- Invalid data cannot be inserted
- Maintains data integrity

✅ **Catches Errors Early**
- Bad data rejected at database level
- Saves debugging time

✅ **Protects Relationships**
- Foreign keys prevent orphaned records
- Maintains referential integrity

✅ **Easy to Implement**
- Just run the SQL script
- No code changes needed

✅ **Low Risk**
- Only validates data
- Doesn't prevent schema changes
- Easy to remove if needed

---

## ⚠️ Limitations

❌ **Does NOT prevent:**
- Adding new columns
- Dropping columns
- Renaming columns
- Changing column types
- Modifying table structure

❌ **Only validates:**
- Data values
- Relationships
- Constraints

**For complete schema lock, see Level 2 & 3 in SCHEMA_PROTECTION_GUIDE.md**

---

## 📞 Support

### If Constraints Cause Issues

1. **Check the error message** - It will tell you what's wrong
2. **Review the constraint** - See what values are allowed
3. **Fix your data** - Update to valid values
4. **Or remove constraint** - If it's too restrictive

### Common Issues

**"violates check constraint"**
- Your data doesn't match the constraint
- Fix the data or remove the constraint

**"null value in column violates not-null constraint"**
- You're trying to insert NULL in a required field
- Provide a value or remove the constraint

**"duplicate key value violates unique constraint"**
- You're trying to insert a duplicate value
- Use a different value or remove the constraint

---

## 🔄 Next Steps

1. **Apply Level 1:** Run `SCHEMA_LOCK_CONSTRAINTS.sql`
2. **Test:** Run the test queries above
3. **Verify:** Check constraints appear in Supabase
4. **Monitor:** Watch for constraint violations
5. **Optional:** Apply Level 2 or 3 for more protection

---

## 📚 Related Documentation

- **SCHEMA_PROTECTION_GUIDE.md** - Complete protection guide
- **COMPLETE_DATABASE_SCHEMA.md** - Full schema reference
- **DATABASE_QUICK_REFERENCE.md** - Quick lookup
- **SCHEMA_VISUAL_REFERENCE.md** - Visual diagrams

---

## 🎓 What You're Protecting

Your database has 6 tables with 68 columns and 12 foreign keys. These constraints protect:

- **6 tables** from invalid data
- **68 columns** with proper validation
- **12 relationships** with foreign keys
- **30+ constraints** enforcing rules

---

## ✨ Summary

**What:** Constraints that prevent invalid data  
**How:** Run SQL script in Supabase  
**Time:** 5 minutes  
**Risk:** Very low  
**Benefit:** Protects data integrity  
**Recommended:** YES - Apply to all environments  

---

**Ready to protect your schema?**

👉 Open `SCHEMA_LOCK_CONSTRAINTS.sql` and follow the Quick Start steps above!

---

**Last Updated:** November 20, 2025  
**Status:** Ready to Use
