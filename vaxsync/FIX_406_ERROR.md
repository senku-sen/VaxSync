# Fix 406 Error - Database Permissions Issue

## 🔴 Problem

You're seeing `406` errors when the system tries to query the `vaccine_monthly_report` table:

```
Failed to load resource: the server responded with a status of 406 ()
```

This means the **Row Level Security (RLS) policies are blocking the queries**.

---

## ✅ Solution

Run these SQL commands in **Supabase Dashboard → SQL Editor**:

### Step 1: Disable RLS on vaccine_monthly_report

```sql
ALTER TABLE vaccine_monthly_report DISABLE ROW LEVEL SECURITY;
```

### Step 2: Grant Full Permissions to Authenticated Users

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report_with_details TO authenticated;
```

### Step 3: Grant Permissions to Anonymous Users (Optional)

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report_with_details TO anon;
```

### Step 4: Ensure Schema Access

```sql
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
```

### Step 5: Grant Sequence Permissions

```sql
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
```

---

## 📋 Complete Script (Copy & Paste)

```sql
-- Disable RLS
ALTER TABLE vaccine_monthly_report DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report_with_details TO authenticated;

-- Grant permissions to anon users (optional)
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report_with_details TO anon;

-- Ensure schema access
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
```

---

## 🔍 How to Run

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard

2. **Select VaxSync Project**
   - Click on your VaxSync project

3. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar

4. **Create New Query**
   - Click "New Query"

5. **Paste the SQL**
   - Copy the complete script above
   - Paste into the editor

6. **Run Query**
   - Click "Run" button (or Ctrl+Enter)
   - Wait for success message

7. **Verify**
   - You should see "Success" message
   - No errors should appear

---

## ✅ Verify It Works

After running the SQL, test by:

1. **Refresh your app**
   - Press F5 or Ctrl+R

2. **Open Monthly Report**
   - Navigate to Monthly Report page

3. **Check Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - You should NOT see 406 errors anymore

4. **Verify Data Loads**
   - Monthly report should display data
   - No error messages

---

## 🔐 Security Note

**For Development Only:**
- RLS is disabled for easier testing
- All authenticated users can read/write all records

**For Production:**
- Enable RLS with proper policies
- Restrict access by barangay/role
- Add audit logging

---

## 📊 What These Commands Do

| Command | Purpose |
|---------|---------|
| `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` | Removes RLS restrictions |
| `GRANT SELECT, INSERT, UPDATE, DELETE` | Allows read/write operations |
| `GRANT USAGE ON SCHEMA public` | Allows schema access |
| `GRANT USAGE, SELECT ON ALL SEQUENCES` | Allows auto-increment operations |

---

## 🆘 If Still Getting 406 Errors

### Check 1: Verify RLS is Disabled
```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'vaccine_monthly_report';

-- Should show: rowsecurity = false
```

### Check 2: Verify Permissions
```sql
-- Check permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'vaccine_monthly_report';
```

### Check 3: Check for Policies
```sql
-- List all policies
SELECT * FROM pg_policies 
WHERE tablename = 'vaccine_monthly_report';

-- If any exist, drop them:
DROP POLICY IF EXISTS "Enable all access" ON vaccine_monthly_report;
```

---

## 📝 After Fix

Once permissions are set:
- ✅ Monthly report will calculate correctly
- ✅ Data will display in table
- ✅ No 406 errors in console
- ✅ System can save data to database

---

**Status:** Ready to Fix

**Time to Fix:** 2-3 minutes

**Difficulty:** Easy
