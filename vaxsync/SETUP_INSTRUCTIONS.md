# Photo Upload Feature - Complete Setup Instructions

## 📋 Prerequisites
- Supabase project already set up
- Access to Supabase Dashboard
- VaxSync application running

---

## 🔧 PART 1: DATABASE SETUP

### Step 1.1: Execute SQL Script

**Location:** `VACCINATION_SESSION_PHOTOS_SETUP.sql`

**Instructions:**
1. Open [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire content from `VACCINATION_SESSION_PHOTOS_SETUP.sql`
6. Paste into the SQL editor
7. Click **Run** button (top right)
8. Wait for success message

**What gets created:**
- ✅ Table: `vaccination_session_photos`
- ✅ Indexes: 4 indexes for fast queries
- ✅ RLS: 5 security policies

### Step 1.2: Verify Database Setup

Run these verification queries:

```sql
-- Query 1: Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'vaccination_session_photos';

-- Expected result: 1 row with "vaccination_session_photos"
```

```sql
-- Query 2: Check indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE tablename = 'vaccination_session_photos'
ORDER BY indexname;

-- Expected result: 4 indexes
```

```sql
-- Query 3: Check RLS policies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename = 'vaccination_session_photos'
ORDER BY policyname;

-- Expected result: 5 policies
```

---

## 📦 PART 2: STORAGE BUCKET SETUP

### Step 2.1: Create Storage Bucket

**Instructions:**
1. Open [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Click **Storage** (left sidebar)
4. Click **Create a new bucket** button
5. Fill in the form:
   - **Bucket name:** `vaccination-session-photos`
   - **Public bucket:** ❌ **UNCHECK** (leave unchecked for private)
6. Click **Create bucket** button
7. Wait for success message

**Result:** Bucket created and ready for use

### Step 2.2: Configure Storage Policies

**Instructions:**
1. Click on the bucket `vaccination-session-photos`
2. Go to **Policies** tab
3. Click **New Policy** button

**Policy 1: Allow INSERT (Upload)**
- Click **New Policy**
- Select **For INSERT**
- **Policy name:** `Allow authenticated users to upload`
- **Target roles:** Select `authenticated`
- Click **Create**

**Policy 2: Allow SELECT (Read)**
- Click **New Policy**
- Select **For SELECT**
- **Policy name:** `Allow authenticated users to read`
- **Target roles:** Select `authenticated`
- Click **Create**

**Policy 3: Allow DELETE (Delete)**
- Click **New Policy**
- Select **For DELETE**
- **Policy name:** `Allow authenticated users to delete`
- **Target roles:** Select `authenticated`
- Click **Create**

**Result:** 3 policies created

### Step 2.3: Verify Storage Setup

1. Click on bucket `vaccination-session-photos`
2. Go to **Policies** tab
3. Verify you see 3 policies:
   - ✅ Allow authenticated users to upload
   - ✅ Allow authenticated users to read
   - ✅ Allow authenticated users to delete

---

## 📁 PART 3: FILE DEPLOYMENT

### Step 3.1: Verify Files Exist

Check that these files are in your project:

```
vaxsync/
├── lib/
│   └── sessionPhotos.js                    ✅ NEW
├── components/
│   └── vaccination-schedule/
│       ├── PhotoUploadModal.jsx            ✅ NEW
│       ├── PhotoGallery.jsx                ✅ NEW
│       └── UpdateAdministeredModal.jsx     ✅ UPDATED
├── VACCINATION_SESSION_PHOTOS_SETUP.sql   ✅ NEW
├── STORAGE_BUCKET_SETUP.md                ✅ NEW
├── PHOTO_UPLOAD_IMPLEMENTATION_GUIDE.md   ✅ NEW
├── PHOTO_UPLOAD_QUICK_START.md            ✅ NEW
└── SETUP_INSTRUCTIONS.md                  ✅ NEW (this file)
```

### Step 3.2: Restart Development Server

If running locally:
```bash
# Stop the server (Ctrl+C)
# Restart
npm run dev
```

---

## 🧪 PART 4: TESTING

### Test 1: Upload Photo (as Health Worker)

**Prerequisites:**
- Logged in as Health Worker
- Have at least one vaccination session

**Steps:**
1. Go to **Vaccination Schedule** page
2. Find a session and click **Update Progress**
3. Look for **"Upload Photo"** button
4. Click **"Upload Photo"**
5. Select an image file (JPG, PNG, or WebP)
6. Choose photo type from dropdown
7. Add optional caption
8. Click **"Upload Photo"** button
9. Wait for success message
10. ✅ Photo should appear in gallery

**Expected Result:**
- Success message: "Photo uploaded successfully!"
- Photo appears in gallery below
- Can see photo thumbnail, caption, and type

### Test 2: View Photos (as Head Nurse)

**Prerequisites:**
- Logged in as Head Nurse
- Health Worker has uploaded at least one photo

**Steps:**
1. Go to **Vaccination Schedule** page
2. Find the session with photos
3. Click **Update Progress**
4. Look for **"Show (1)"** button (shows photo count)
5. Click **"Show (1)"**
6. ✅ Photos should appear in gallery
7. Verify you **CANNOT** see "Upload Photo" button
8. Verify you **CAN** see delete button (trash icon)

**Expected Result:**
- Photos display in gallery
- Can view full size by clicking eye icon
- Cannot upload (no upload button)
- Can delete (trash icon visible)

### Test 3: Delete Photo

**Steps:**
1. Hover over a photo in gallery
2. Click trash icon
3. Confirm deletion
4. ✅ Photo should disappear

**Expected Result:**
- Photo removed from gallery
- Photo count decreases
- No errors in console

### Test 4: Restrictions

**Test: Cannot upload when Scheduled**
1. Create new session (status: Scheduled)
2. Click "Update Progress"
3. ✅ Should NOT see "Upload Photo" button

**Test: Can upload when In Progress**
1. Change session status to "In progress"
2. Click "Update Progress"
3. ✅ Should see "Upload Photo" button

**Test: Can upload when Completed**
1. Change session status to "Completed"
2. Click "Update Progress"
3. ✅ Should see "Upload Photo" button

---

## ✅ VERIFICATION CHECKLIST

### Database
- [ ] SQL script executed without errors
- [ ] Table `vaccination_session_photos` exists
- [ ] 4 indexes created
- [ ] 5 RLS policies created

### Storage
- [ ] Bucket `vaccination-session-photos` created
- [ ] Bucket is PRIVATE (not public)
- [ ] 3 storage policies created

### Files
- [ ] `lib/sessionPhotos.js` exists
- [ ] `PhotoUploadModal.jsx` exists
- [ ] `PhotoGallery.jsx` exists
- [ ] `UpdateAdministeredModal.jsx` updated

### Functionality
- [ ] Health worker can upload photos
- [ ] Head nurse can view photos
- [ ] Head nurse cannot upload photos
- [ ] Photos only upload when "In progress" or "Completed"
- [ ] Can delete photos
- [ ] Photo gallery displays correctly

### Security
- [ ] Only authenticated users can access
- [ ] Health workers can only upload to own sessions
- [ ] Head nurses can delete any photos
- [ ] Storage bucket is private

---

## 🐛 TROUBLESHOOTING

### Issue: SQL execution fails
**Solution:**
- Check for syntax errors
- Ensure you're in the correct database
- Try running queries one at a time
- Check Supabase logs for errors

### Issue: Storage bucket creation fails
**Solution:**
- Bucket name must be lowercase
- Bucket name must be unique
- Check you have storage permissions
- Try different bucket name if conflicts

### Issue: Upload button not showing
**Solution:**
- Verify session status is "In progress" or "Completed"
- Verify you're logged in as Health Worker
- Refresh page
- Check browser console for errors

### Issue: Upload fails with 403
**Solution:**
- Verify storage policies are created
- Verify bucket name is correct
- Verify you're authenticated
- Check Supabase logs

### Issue: Photos not displaying
**Solution:**
- Refresh page
- Check browser console for errors
- Verify photo_url in database is valid
- Check signed URL hasn't expired

### Issue: Can't delete photos
**Solution:**
- Verify you're the uploader (for health workers)
- Verify you're head nurse (for moderation)
- Check RLS policies are enabled
- Refresh page

---

## 📊 Database Schema Reference

### vaccination_session_photos table

```sql
CREATE TABLE vaccination_session_photos (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES vaccination_sessions(id),
  photo_url TEXT,
  caption TEXT,
  photo_type VARCHAR(50),
  uploaded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### RLS Policies

| # | Name | Role | Action | Condition |
|---|------|------|--------|-----------|
| 1 | Anyone authenticated can read | authenticated | SELECT | All |
| 2 | Health workers can upload | authenticated | INSERT | Own session, In progress/Completed |
| 3 | Health workers can update | authenticated | UPDATE | Own photos |
| 4 | Health workers can delete | authenticated | DELETE | Own photos |
| 5 | Head nurses can delete | Head Nurse | DELETE | Any photos |

---

## 🎯 Next Steps

After successful setup:

1. **Monitor usage** - Track photo uploads
2. **Backup photos** - Implement regular backups
3. **Performance** - Monitor storage usage
4. **Compliance** - Ensure meets requirements
5. **User training** - Train health workers on feature

---

## 📞 Support Resources

- **Implementation Guide:** `PHOTO_UPLOAD_IMPLEMENTATION_GUIDE.md`
- **Quick Start:** `PHOTO_UPLOAD_QUICK_START.md`
- **Storage Setup:** `STORAGE_BUCKET_SETUP.md`
- **SQL Script:** `VACCINATION_SESSION_PHOTOS_SETUP.sql`

---

**Setup Date:** November 24, 2025  
**Status:** Ready for deployment  
**Last Updated:** November 24, 2025
