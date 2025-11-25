# Photo Upload Feature - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Run SQL Script (2 min)
1. Open Supabase Dashboard → SQL Editor
2. Copy all content from: `VACCINATION_SESSION_PHOTOS_SETUP.sql`
3. Paste and click **Run**

### Step 2: Create Storage Bucket (2 min)
1. Go to Storage → Create bucket
2. Name: `vaccination-session-photos`
3. Public: ❌ (uncheck)
4. Click Create

### Step 3: Add Storage Policies (1 min)
1. Click bucket → Policies
2. Create 3 policies:
   - INSERT: Allow authenticated
   - SELECT: Allow authenticated
   - DELETE: Allow authenticated

**Done!** ✅

---

## 📸 How It Works

### For Health Workers
1. Open vaccination session → Click "Update Progress"
2. Click "Upload Photo" button
3. Select image (JPG, PNG, WebP, max 5MB)
4. Choose photo type (setup, crowd, administration, etc.)
5. Add optional caption
6. Click "Upload Photo"
7. View photos in gallery below

**Restrictions:**
- ✅ Can upload only when session is "In progress" or "Completed"
- ✅ Can delete own photos
- ❌ Cannot upload when session is "Scheduled"

### For Head Nurses
1. Open vaccination session → Click "Update Progress"
2. Click "Show (X)" to view photos
3. View all photos from health workers
4. Can delete any photo (for moderation)

**Restrictions:**
- ❌ Cannot upload photos
- ✅ Can view all photos
- ✅ Can delete any photos

---

## 📁 Files Created/Updated

| File | Status | Purpose |
|------|--------|---------|
| `VACCINATION_SESSION_PHOTOS_SETUP.sql` | ✅ NEW | Database schema + RLS policies |
| `STORAGE_BUCKET_SETUP.md` | ✅ NEW | Storage bucket setup guide |
| `lib/sessionPhotos.js` | ✅ NEW | Photo upload/delete functions |
| `components/vaccination-schedule/PhotoUploadModal.jsx` | ✅ NEW | Upload UI component |
| `components/vaccination-schedule/PhotoGallery.jsx` | ✅ NEW | Photo gallery display |
| `components/vaccination-schedule/UpdateAdministeredModal.jsx` | ✅ UPDATED | Integrated photo features |

---

## 🔐 Security Features

✅ **Only health workers can upload** (not head nurses)  
✅ **Only when session is in progress/completed**  
✅ **Private storage bucket** (not public)  
✅ **RLS policies** enforce access control  
✅ **Signed URLs** expire after 1 hour  
✅ **File validation** (type, size, dimensions)  
✅ **Audit trail** (who uploaded, when)  

---

## 🧪 Quick Test

### Test Upload (as Health Worker)
1. Create vaccination session
2. Set status to "In progress"
3. Click "Update Progress"
4. Click "Upload Photo"
5. Select any image file
6. Click "Upload Photo"
7. ✅ Should see success message

### Test View (as Head Nurse)
1. Open same session
2. Click "Update Progress"
3. Click "Show (1)"
4. ✅ Should see uploaded photo
5. ✅ Should NOT see "Upload Photo" button

### Test Delete (as Health Worker)
1. Hover over photo
2. Click trash icon
3. Confirm deletion
4. ✅ Photo should disappear

---

## 📊 Photo Types

When uploading, choose one:

- **Setup & Preparation** - Site setup, equipment, materials
- **Crowd & Attendance** - Participants, crowd size
- **Vaccination Administration** - Actual vaccination process
- **Incident/Issue** - Problems, accidents, concerns
- **Completion & Cleanup** - Session end, cleanup
- **General Documentation** - Other documentation

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Upload Photo" button missing | Session must be "In progress" or "Completed" |
| Upload fails (403) | Check storage policies are configured |
| Photos not showing | Refresh page, check browser console |
| Can't delete photo | Must be uploader or head nurse |
| File too large | Max 5MB, compress image first |

---

## 📞 Need Help?

1. Check `PHOTO_UPLOAD_IMPLEMENTATION_GUIDE.md` for detailed steps
2. Check `STORAGE_BUCKET_SETUP.md` for storage configuration
3. Review SQL script in `VACCINATION_SESSION_PHOTOS_SETUP.sql`
4. Check browser console for JavaScript errors
5. Check Supabase logs for database errors

---

## ✅ Verification

Run this to verify setup:

```sql
-- Check table
SELECT COUNT(*) FROM vaccination_session_photos;

-- Check policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'vaccination_session_photos';
```

Should show 5 policies:
1. Anyone authenticated can read
2. Health workers can upload to their sessions
3. Health workers can update their photos
4. Health workers can delete their photos
5. Head nurses can delete any photos

---

**Status:** ✅ Ready to use  
**Last Updated:** November 24, 2025
