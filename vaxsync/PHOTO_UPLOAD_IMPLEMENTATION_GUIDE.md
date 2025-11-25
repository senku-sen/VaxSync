# Photo Upload Feature - Complete Implementation Guide

## 📋 Overview
This guide provides step-by-step instructions to implement the photo upload feature for vaccination session documentation.

**Key Features:**
- ✅ Health workers can upload photos when session is "In progress" or "Completed"
- ✅ Head nurses can view all photos for monitoring
- ✅ Only health workers can upload; head nurses cannot upload
- ✅ Health workers can delete their own photos
- ✅ Head nurses can delete any photos (for moderation)
- ✅ Photos stored securely in Supabase Storage
- ✅ Database tracking with RLS policies

---

## 🔧 Step 1: Database Setup

### Execute SQL Script
1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire content from: `VACCINATION_SESSION_PHOTOS_SETUP.sql`
5. Paste into the SQL editor
6. Click **Run**

**What this does:**
- Creates `vaccination_session_photos` table
- Creates indexes for fast queries
- Enables Row Level Security (RLS)
- Sets up 5 RLS policies for access control

### Verify Setup
Run these queries to confirm:
```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'vaccination_session_photos';

-- Check indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE tablename = 'vaccination_session_photos';

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename = 'vaccination_session_photos';
```

---

## 📦 Step 2: Storage Bucket Setup

### Create Bucket via Dashboard
1. Go to **Supabase Dashboard** → **Storage**
2. Click **Create a new bucket**
3. **Bucket name:** `vaccination-session-photos`
4. **Public bucket:** ❌ **UNCHECK** (keep private)
5. Click **Create bucket**

### Configure Storage Policies
1. Click on the bucket `vaccination-session-photos`
2. Go to **Policies** tab
3. Click **New Policy** → **For INSERT**
   - **Policy name:** `Allow authenticated users to upload`
   - **Target roles:** `authenticated`
   - Click **Create**

4. Click **New Policy** → **For SELECT**
   - **Policy name:** `Allow authenticated users to read`
   - **Target roles:** `authenticated`
   - Click **Create**

5. Click **New Policy** → **For DELETE**
   - **Policy name:** `Allow users to delete their own`
   - **Target roles:** `authenticated`
   - Click **Create**

---

## 📁 Step 3: File Structure

Verify these new files are in place:

```
components/vaccination-schedule/
├── PhotoUploadModal.jsx          ✅ NEW
├── PhotoGallery.jsx              ✅ NEW
├── UpdateAdministeredModal.jsx   ✅ UPDATED
└── ... (other components)

lib/
├── sessionPhotos.js              ✅ NEW
└── ... (other utilities)

VACCINATION_SESSION_PHOTOS_SETUP.sql    ✅ NEW (SQL script)
STORAGE_BUCKET_SETUP.md                 ✅ NEW (Setup guide)
PHOTO_UPLOAD_IMPLEMENTATION_GUIDE.md    ✅ NEW (This file)
```

---

## 🚀 Step 4: Test the Feature

### Test as Health Worker

1. **Start a vaccination session:**
   - Go to **Vaccination Schedule** page
   - Create a new session
   - Set status to **"In progress"**

2. **Upload a photo:**
   - Click **Update Progress** button
   - In the modal, click **Upload Photo**
   - Select an image file (JPG, PNG, WebP)
   - Choose photo type (e.g., "Setup & Preparation")
   - Add optional caption
   - Click **Upload Photo**
   - Verify success message

3. **View photos:**
   - Click **Show (1)** to view uploaded photos
   - Verify photo appears in gallery
   - Click eye icon to view full size
   - Verify photo details (type, caption, uploader, date)

4. **Delete photo:**
   - In gallery, hover over photo
   - Click trash icon
   - Confirm deletion
   - Verify photo is removed

### Test as Head Nurse

1. **View session:**
   - Go to **Vaccination Schedule** page
   - Click **Update Progress** on any session

2. **View photos:**
   - Click **Show (X)** to view photos
   - Verify you can see all uploaded photos
   - Verify you CANNOT see "Upload Photo" button
   - Verify you CAN see delete button (for moderation)

3. **Verify restrictions:**
   - Confirm you cannot upload photos
   - Confirm you can only view and delete

---

## 🔐 Security Features

### RLS Policies Implemented

| Policy | Role | Action | Condition |
|--------|------|--------|-----------|
| Read photos | All authenticated | SELECT | Can read all photos |
| Upload photos | Health Worker | INSERT | Only to own sessions, when "In progress" or "Completed" |
| Update photos | Health Worker | UPDATE | Only own photos |
| Delete photos | Health Worker | DELETE | Only own photos |
| Delete photos | Head Nurse | DELETE | Any photos (moderation) |

### Storage Security

- **Private bucket** - Not publicly accessible
- **Signed URLs** - Expire after 1 hour
- **User isolation** - Each user can only upload to their sessions
- **File validation** - Only JPG, PNG, WebP allowed
- **Size limit** - Max 5MB per photo

---

## 🐛 Troubleshooting

### Issue: "Upload Photo" button not showing
**Solution:**
- Verify session status is "In progress" or "Completed"
- Verify you're logged in as Health Worker
- Check browser console for errors

### Issue: Upload fails with 403 error
**Solution:**
- Verify storage policies are configured
- Check that bucket is named `vaccination-session-photos`
- Verify you're authenticated

### Issue: Photos not loading
**Solution:**
- Check signed URL expiry (1 hour)
- Verify photo_url in database is correct
- Check browser console for CORS errors

### Issue: Can't delete photos
**Solution:**
- Verify you're the uploader (for health workers)
- Verify you're head nurse (for moderation)
- Check RLS policies are enabled

---

## 📊 Database Schema

### vaccination_session_photos table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | FK to vaccination_sessions |
| photo_url | TEXT | Signed URL to photo in storage |
| caption | TEXT | Optional description |
| photo_type | VARCHAR(50) | Type: setup, crowd, completion, documentation |
| uploaded_by | UUID | FK to user_profiles (who uploaded) |
| created_at | TIMESTAMP | Upload timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Photo Types

- **setup** - Vaccination site setup and preparation
- **crowd** - Crowd and attendance documentation
- **completion** - Session completion and cleanup
- **documentation** - General documentation

---

## 🔄 API Functions

### Upload Photo
```javascript
import { uploadSessionPhoto } from "@/lib/sessionPhotos";

const result = await uploadSessionPhoto(
  sessionId,      // string
  file,           // File object
  caption,        // string (optional)
  photoType,      // string
  userId          // string
);

// Returns: { success: boolean, data: Object, error: string }
```

### Fetch Photos
```javascript
import { fetchSessionPhotos } from "@/lib/sessionPhotos";

const result = await fetchSessionPhotos(sessionId);

// Returns: { success: boolean, data: Array, error: string }
```

### Delete Photo
```javascript
import { deleteSessionPhoto } from "@/lib/sessionPhotos";

const result = await deleteSessionPhoto(photoId, fileName);

// Returns: { success: boolean, error: string }
```

### Update Photo
```javascript
import { updateSessionPhoto } from "@/lib/sessionPhotos";

const result = await updateSessionPhoto(photoId, {
  caption: "New caption",
  photo_type: "setup"
});

// Returns: { success: boolean, data: Object, error: string }
```

---

## 📱 Component Props

### PhotoUploadModal
```jsx
<PhotoUploadModal
  isOpen={boolean}                    // Modal visibility
  onClose={() => {}}                  // Close handler
  sessionId={string}                  // Session ID
  userId={string}                     // Current user ID
  onPhotoUploaded={(photo) => {}}     // Success callback
/>
```

### PhotoGallery
```jsx
<PhotoGallery
  photos={Array}                      // Array of photo objects
  isLoading={boolean}                 // Loading state
  canDelete={boolean}                 // Can delete permission
  onPhotoDeleted={(id) => {}}         // Delete callback
  userRole={string}                   // User role (Health Worker/Head Nurse)
/>
```

---

## ✅ Verification Checklist

- [ ] SQL script executed successfully
- [ ] Table `vaccination_session_photos` created
- [ ] Storage bucket `vaccination-session-photos` created
- [ ] Storage policies configured
- [ ] New files in place:
  - [ ] `PhotoUploadModal.jsx`
  - [ ] `PhotoGallery.jsx`
  - [ ] `sessionPhotos.js`
- [ ] `UpdateAdministeredModal.jsx` updated with photo features
- [ ] Test upload as health worker ✓
- [ ] Test view as head nurse ✓
- [ ] Test delete as health worker ✓
- [ ] Test delete as head nurse ✓
- [ ] Verify restrictions working correctly

---

## 📞 Support

If you encounter issues:

1. **Check browser console** for JavaScript errors
2. **Check Supabase logs** for database/storage errors
3. **Verify RLS policies** are enabled and correct
4. **Test with different file types** (JPG, PNG, WebP)
5. **Clear browser cache** and try again

---

## 🎯 Next Steps

After implementation:

1. **Monitor usage** - Track photo uploads and storage usage
2. **Backup photos** - Implement regular backups to external storage
3. **Audit trail** - Review who uploaded what and when
4. **Compliance** - Ensure photos meet regulatory requirements
5. **Performance** - Monitor database and storage performance

---

**Implementation Date:** November 24, 2025  
**Status:** Ready for deployment  
**Last Updated:** November 24, 2025
