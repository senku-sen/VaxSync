# Sign In 401 Unauthorized Error - Debug Guide

## Problem
Getting `401 Unauthorized` error when attempting to sign in at `http://localhost:3000/api/auth/signin`

## Root Causes & Solutions

### 1. Missing or Incorrect Environment Variables

**Check your `.env.local` file:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Steps to fix:**
1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy the "Project URL" and "anon public" key
4. Paste them into `.env.local`
5. Restart the dev server: `npm run dev`

### 2. Incorrect Email or Password

**Verify credentials:**
- Check that the email exists in your Supabase `auth.users` table
- Ensure the password is correct
- Passwords are case-sensitive

**Test with a known user:**
1. Go to Supabase Dashboard
2. Navigate to "Authentication" → "Users"
3. Verify the user exists
4. Try signing in with that exact email

### 3. Supabase Auth Not Enabled

**Check Supabase configuration:**
1. Go to Supabase Dashboard
2. Click "Authentication" in the left sidebar
3. Ensure "Email/Password" auth provider is enabled
4. Check that "Confirm email" is set appropriately for your use case

### 4. User Profile Missing

**Verify user profile exists:**
- The signin endpoint requires a matching record in `user_profiles` table
- Check that the user has a profile with:
  - `id` (matches auth user id)
  - `first_name`
  - `last_name`
  - `user_role` (either "Health Worker" or "Head Nurse")
  - `address`

**SQL to check:**
```sql
SELECT * FROM user_profiles WHERE id = 'user_id_here';
```

## Debugging Steps

### Step 1: Check Server Logs
When you try to sign in, check your terminal where `npm run dev` is running:

```
Sign in attempt for email: test@example.com
```

If you see "Supabase environment variables not configured", go to Step 2.

### Step 2: Verify Environment Variables
```bash
# In your project root, check if .env.local exists
cat .env.local

# Should output:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Step 3: Check Supabase Connection
Add this test file temporarily:

**`app/api/test/supabase/route.js`:**
```javascript
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return NextResponse.json({ 
        status: "error", 
        message: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      status: "ok", 
      message: "Supabase connected successfully",
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ URL set" : "✗ URL missing",
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Key set" : "✗ Key missing"
    });
  } catch (err) {
    return NextResponse.json({ 
      status: "error", 
      message: err.message 
    }, { status: 500 });
  }
}
```

Then visit: `http://localhost:3000/api/test/supabase`

### Step 4: Check Browser Console
1. Open Firefox Developer Tools (F12)
2. Go to "Console" tab
3. Look for error messages when signing in
4. Check the "Network" tab to see the actual response from the API

### Step 5: Verify User Exists in Supabase

**In Supabase Dashboard:**
1. Go to "Authentication" → "Users"
2. Look for the email you're trying to sign in with
3. If not found, create a test user:
   - Click "Add user"
   - Enter email and password
   - Click "Create user"

4. Then go to "SQL Editor" and run:
```sql
INSERT INTO user_profiles (
  id, 
  first_name, 
  last_name, 
  user_role, 
  address, 
  email
) VALUES (
  'user_id_from_auth_users',
  'Test',
  'User',
  'Health Worker',
  'Test Address',
  'test@example.com'
);
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid credentials" | Wrong email/password | Verify credentials in Supabase |
| "Server configuration error" | Missing env vars | Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local |
| "Failed to fetch user profile" | No user_profiles record | Create user profile in database |
| "Authentication failed" | Auth succeeded but no user data | Check Supabase auth settings |

## Testing Sign In

### Test User Setup
1. Create a test user in Supabase:
   - Email: `test@example.com`
   - Password: `TestPassword123!`

2. Create profile in `user_profiles`:
```sql
INSERT INTO user_profiles (
  id, 
  first_name, 
  last_name, 
  user_role, 
  address, 
  email
) VALUES (
  'auth_user_id',
  'Test',
  'Worker',
  'Health Worker',
  'Test Address',
  'test@example.com'
);
```

3. Try signing in with `test@example.com` / `TestPassword123!`

## After Fixing

1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart dev server: `npm run dev`
3. Try signing in again
4. Check console logs for success message

## Still Having Issues?

Check these files:
- `/app/api/auth/signin/route.js` - API endpoint
- `/lib/supabase.js` - Supabase client initialization
- `/app/pages/signin/page.js` - Sign in form

All have been updated with better error logging to help identify the issue.
