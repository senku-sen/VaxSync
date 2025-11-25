# Auto-Increment Request Code (VRC000) - Setup Guide

**Purpose:** Automatically generate VRC001, VRC002, VRC003, etc. for vaccine requests  
**Status:** Ready to implement  
**Date:** November 20, 2025

---

## 🎯 What This Does

Automatically generates unique request codes like:
- ✅ VRC001 (first request)
- ✅ VRC002 (second request)
- ✅ VRC003 (third request)
- ✅ VRC010 (tenth request)
- ✅ VRC100 (hundredth request)

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Copy SQL
Open: `AUTO_INCREMENT_REQUEST_CODE.sql`

### Step 2: Run in Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Paste entire SQL file
4. Click "Run"

### Step 3: Test
```sql
-- Insert a test vaccine request
INSERT INTO public.vaccine_requests 
(barangay_id, vaccine_id, requested_by, quantity_dose, status)
VALUES ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 10, 'pending')
RETURNING id, request_code;

-- Expected result: request_code = 'VRC001'
```

---

## 📋 What Gets Created

### 1. Sequence
```sql
vaccine_request_code_seq
```
- Generates sequential numbers: 1, 2, 3, 4, ...
- Automatically increments

### 2. Function: generate_request_code()
```sql
-- Converts: 1 → VRC001, 2 → VRC002, etc.
SELECT public.generate_request_code();
-- Returns: VRC001, VRC002, VRC003, ...
```

### 3. Function: set_request_code()
```sql
-- Automatically called on INSERT
-- Sets request_code if NULL
```

### 4. Trigger: vaccine_requests_set_code_trigger
```sql
-- Runs BEFORE INSERT on vaccine_requests
-- Automatically calls set_request_code()
```

---

## 💻 How It Works

### When You Insert a Request:
```javascript
// Frontend code
const { data, error } = await supabase
  .from('vaccine_requests')
  .insert({
    barangay_id: 'uuid',
    vaccine_id: 'uuid',
    requested_by: 'uuid',
    quantity_dose: 10,
    status: 'pending'
    // Note: Don't set request_code - it's automatic!
  })
  .select();

// Result: request_code = 'VRC001' (automatically set)
```

### Database Flow:
```
1. INSERT request (request_code = NULL)
   ↓
2. Trigger fires (BEFORE INSERT)
   ↓
3. set_request_code() function runs
   ↓
4. generate_request_code() called
   ↓
5. Sequence increments (1 → 2 → 3...)
   ↓
6. Code formatted: VRC001, VRC002, VRC003...
   ↓
7. request_code set automatically
   ↓
8. Record inserted with code
```

---

## 📝 Update Frontend Code

### Option 1: Remove request_code from Insert (Recommended)

**Before:**
```javascript
const { data, error } = await supabase
  .from('vaccine_requests')
  .insert({
    barangay_id: barangayId,
    vaccine_id: vaccineId,
    requested_by: userId,
    quantity_dose: quantity,
    status: 'pending',
    request_code: generateCode() // ❌ Remove this
  })
  .select();
```

**After:**
```javascript
const { data, error } = await supabase
  .from('vaccine_requests')
  .insert({
    barangay_id: barangayId,
    vaccine_id: vaccineId,
    requested_by: userId,
    quantity_dose: quantity,
    status: 'pending'
    // ✅ request_code is automatic!
  })
  .select();
```

### Option 2: Keep Frontend Code (Still Works)

If you want to keep generating codes in frontend, it will still work:
```javascript
// Frontend generates: VRC001
// Database trigger checks: if request_code is NULL, generate new one
// Result: Uses frontend code if provided, generates if NULL
```

---

## 🔍 Verification

### Check Sequence Exists
```sql
SELECT * FROM information_schema.sequences 
WHERE sequence_name = 'vaccine_request_code_seq';
```

### Check Function Exists
```sql
SELECT proname FROM pg_proc 
WHERE proname IN ('generate_request_code', 'set_request_code');
```

### Check Trigger Exists
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'vaccine_requests_set_code_trigger';
```

### Test Auto-Generation
```sql
-- Insert test record
INSERT INTO public.vaccine_requests 
(barangay_id, vaccine_id, requested_by, quantity_dose, status)
VALUES 
('550e8400-e29b-41d4-a716-446655440000', 
 '550e8400-e29b-41d4-a716-446655440001', 
 '550e8400-e29b-41d4-a716-446655440002', 
 10, 'pending')
RETURNING request_code;

-- Expected: VRC001
```

---

## 🎯 Request Code Format

### Pattern: VRC + 3-digit number

| Request # | Code |
|-----------|------|
| 1 | VRC001 |
| 2 | VRC002 |
| 9 | VRC009 |
| 10 | VRC010 |
| 99 | VRC099 |
| 100 | VRC100 |
| 999 | VRC999 |
| 1000 | VRC1000 |

---

## 🛠️ Customization

### Change Prefix (VRC → Something Else)

**In AUTO_INCREMENT_REQUEST_CODE.sql, line 24:**

```sql
-- Change this:
code := 'VRC' || LPAD(next_val::TEXT, 3, '0');

-- To (example - use REQ instead of VRC):
code := 'REQ' || LPAD(next_val::TEXT, 3, '0');

-- Result: REQ001, REQ002, REQ003...
```

### Change Starting Number

**In AUTO_INCREMENT_REQUEST_CODE.sql, line 8:**

```sql
-- Change this:
START WITH 1

-- To (example - start at 100):
START WITH 100

-- Result: VRC100, VRC101, VRC102...
```

### Change Padding (3 digits → 4 digits)

**In AUTO_INCREMENT_REQUEST_CODE.sql, line 24:**

```sql
-- Change this:
code := 'VRC' || LPAD(next_val::TEXT, 3, '0');

-- To (example - 4 digits):
code := 'VRC' || LPAD(next_val::TEXT, 4, '0');

-- Result: VRC0001, VRC0002, VRC0010...
```

---

## ✅ Testing Checklist

- [ ] SQL script runs without errors
- [ ] Sequence created
- [ ] Functions created
- [ ] Trigger created
- [ ] Test insert generates VRC001
- [ ] Second insert generates VRC002
- [ ] Codes are unique
- [ ] Frontend code still works
- [ ] No duplicate codes

---

## 🆘 Troubleshooting

### Issue: "Function does not exist"
**Solution:** Run the SQL script again to create the function

### Issue: "Sequence does not exist"
**Solution:** Run the SQL script again to create the sequence

### Issue: request_code still NULL after insert
**Solution:** 
1. Check trigger is enabled
2. Check function syntax
3. Run verification queries above

### Issue: Duplicate codes
**Solution:** This shouldn't happen with sequence, but if it does:
```sql
-- Reset sequence
ALTER SEQUENCE vaccine_request_code_seq RESTART WITH 1;
```

---

## 📊 Database Changes

### vaccine_requests Table
- ✅ No changes needed
- ✅ request_code column already exists
- ✅ Just add trigger and sequence

### New Objects Created
- ✅ Sequence: `vaccine_request_code_seq`
- ✅ Function: `generate_request_code()`
- ✅ Function: `set_request_code()`
- ✅ Trigger: `vaccine_requests_set_code_trigger`

---

## 🚀 Implementation Steps

1. **Backup Database** (Optional but recommended)
2. **Run SQL Script** - Copy AUTO_INCREMENT_REQUEST_CODE.sql
3. **Paste in Supabase** - SQL Editor → New Query
4. **Execute** - Click Run
5. **Test** - Insert test record
6. **Verify** - Check request_code is auto-generated
7. **Update Frontend** - Remove manual code generation (optional)
8. **Deploy** - Push changes to production

---

## 📚 Related Files

- **AUTO_INCREMENT_REQUEST_CODE.sql** - SQL implementation
- **SCHEMA_CORE_TABLES.md** - vaccine_requests table structure
- **CORE_TABLES_QUICK_REF.md** - Quick reference

---

## 🎓 How Sequences Work

```sql
-- Sequence is like a counter
-- Each time you call nextval(), it increments

SELECT nextval('vaccine_request_code_seq');  -- Returns: 1
SELECT nextval('vaccine_request_code_seq');  -- Returns: 2
SELECT nextval('vaccine_request_code_seq');  -- Returns: 3

-- Formatted with function:
VRC001, VRC002, VRC003, ...
```

---

## ✨ Summary

**What:** Auto-generate VRC001, VRC002, etc.  
**How:** Sequence + Function + Trigger  
**Where:** Supabase PostgreSQL  
**Time:** 5 minutes to set up  
**Benefit:** No manual code generation needed  

---

**Last Updated:** November 20, 2025  
**Status:** Ready to Implement
