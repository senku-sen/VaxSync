# Request Code Auto-Increment - Quick Setup

**Generate:** VRC001, VRC002, VRC003, ...  
**Time:** 5 minutes

---

## 🚀 3-Step Setup

### Step 1: Copy SQL
```
File: AUTO_INCREMENT_REQUEST_CODE.sql
```

### Step 2: Paste in Supabase
1. Supabase Dashboard
2. SQL Editor → New Query
3. Paste entire file
4. Click "Run"

### Step 3: Test
```sql
INSERT INTO public.vaccine_requests 
(barangay_id, vaccine_id, requested_by, quantity_dose, status)
VALUES ('uuid', 'uuid', 'uuid', 10, 'pending')
RETURNING request_code;

-- Result: VRC001 ✅
```

---

## 📝 Update Frontend

### Remove Manual Code Generation

**Before:**
```javascript
request_code: generateCode() // ❌ Remove
```

**After:**
```javascript
// Don't set request_code - it's automatic! ✅
```

---

## ✅ What Gets Created

| Object | Type | Purpose |
|--------|------|---------|
| vaccine_request_code_seq | Sequence | Counter: 1, 2, 3... |
| generate_request_code() | Function | Format: VRC001, VRC002... |
| set_request_code() | Function | Auto-set on INSERT |
| vaccine_requests_set_code_trigger | Trigger | Runs before INSERT |

---

## 🎯 Result

**Every new vaccine request automatically gets:**
- VRC001 (1st)
- VRC002 (2nd)
- VRC003 (3rd)
- VRC010 (10th)
- VRC100 (100th)

---

## 🔧 Customize

### Change Prefix (VRC → REQ)
Line 24 in SQL:
```sql
code := 'REQ' || LPAD(next_val::TEXT, 3, '0');
-- Result: REQ001, REQ002...
```

### Change Starting Number
Line 8 in SQL:
```sql
START WITH 100
-- Result: VRC100, VRC101...
```

### Change Digits (3 → 4)
Line 24 in SQL:
```sql
code := 'VRC' || LPAD(next_val::TEXT, 4, '0');
-- Result: VRC0001, VRC0002...
```

---

## 🧪 Test Query

```sql
-- Insert test
INSERT INTO public.vaccine_requests 
(barangay_id, vaccine_id, requested_by, quantity_dose, status)
VALUES 
('550e8400-e29b-41d4-a716-446655440000', 
 '550e8400-e29b-41d4-a716-446655440001', 
 '550e8400-e29b-41d4-a716-446655440002', 
 10, 'pending')
RETURNING id, request_code;

-- Expected: request_code = 'VRC001'
```

---

## ✨ Done!

Your request codes are now automatic! 🎉

---

**Related:** REQUEST_CODE_AUTO_INCREMENT_GUIDE.md (detailed guide)
