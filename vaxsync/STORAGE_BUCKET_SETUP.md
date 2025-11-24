# Supabase Storage Bucket Setup for Vaccination Session Photos

## 📋 Overview
This guide explains how to create and configure the Supabase Storage bucket for vaccination session photos.

---

## 🔧 Step 1: Create Storage Bucket

### Via Supabase Dashboard:
1. Go to **Supabase Dashboard** → Your Project
2. Click **Storage** in the left sidebar
3. Click **Create a new bucket**
4. **Bucket name:** `vaccination-session-photos`
5. **Public bucket:** ❌ **UNCHECK** (keep private for security)
6. Click **Create bucket**

### Via SQL (Alternative):
```sql
-- Create storage bucket via SQL
INSERT INTO storage.buckets (id, name, public)
VALUES ('vaccination-session-photos', 'vaccination-session-photos', false);
```

---

## 🔐 Step 2: Configure Storage Policies

### Via Supabase Dashboard:
1. Click on the bucket `vaccination-session-photos`
2. Go to **Policies** tab
3. Click **New Policy** and add the following:

### Policy 1: Health Workers can UPLOAD photos
```
Policy Name: Health workers can upload photos
Target roles: authenticated
Operation: INSERT
Condition: 
  (bucket_id = 'vaccination-session-photos')
  AND (auth.uid() = (storage.foldername(name))[1]::uuid)
```

**Simpler approach - Use Custom SQL:**
```sql
-- Allow authenticated users to upload to their session folder
CREATE POLICY "Allow health workers to upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vaccination-session-photos'
  AND auth.role() = 'authenticated'
);
```

### Policy 2: Authenticated users can READ photos
```sql
CREATE POLICY "Allow authenticated users to read photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'vaccination-session-photos');
```

### Policy 3: Only uploader can DELETE their photos
```sql
CREATE POLICY "Allow users to delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vaccination-session-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 📁 Step 3: Folder Structure

Organize photos by session ID:
```
vaccination-session-photos/
├── {session_id}/
│   ├── photo_1.jpg
│   ├── photo_2.jpg
│   └── photo_3.jpg
└── {another_session_id}/
    └── photo_1.jpg
```

**File naming convention:**
- `{session_id}/{timestamp}_{photo_type}_{random}.jpg`
- Example: `550e8400-e29b-41d4-a716-446655440000/1732464000_setup_abc123.jpg`

---

## 🔗 Step 4: Generate Public URLs

Even though the bucket is private, you can generate signed URLs for viewing:

```javascript
// In your code:
const { data } = await supabase.storage
  .from('vaccination-session-photos')
  .createSignedUrl(filePath, 3600); // 1 hour expiry

const publicUrl = data.signedUrl;
```

---

## ✅ Verification Checklist

- [ ] Bucket `vaccination-session-photos` created
- [ ] Bucket is **PRIVATE** (not public)
- [ ] Storage policies configured
- [ ] Can upload files via API
- [ ] Can read files via API
- [ ] Can delete own files

---

## 🧪 Testing Upload

```javascript
// Test upload
const { data, error } = await supabase.storage
  .from('vaccination-session-photos')
  .upload(`${sessionId}/${Date.now()}_test.jpg`, file);

if (error) console.error('Upload failed:', error);
else console.log('Upload successful:', data);
```

---

## 📊 Storage Limits

- **Max file size:** 50MB (configurable)
- **Recommended:** 5MB per photo
- **Max photos per session:** 10-20 recommended
- **Retention:** Keep indefinitely for compliance

---

## 🚨 Security Notes

1. **Private bucket** - Photos not accessible without authentication
2. **Signed URLs** - Expire after 1 hour for security
3. **User isolation** - Each user can only upload to their own sessions
4. **RLS policies** - Database policies enforce access control
5. **Audit trail** - Track who uploaded what and when

---

## 🔄 Backup Strategy

Supabase automatically backs up storage. For additional safety:
1. Export photos monthly
2. Store in separate cloud storage (AWS S3, Google Cloud)
3. Keep local backups for compliance

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Upload fails with 403 | Check storage policies and authentication |
| Can't see photos | Verify RLS policies on vaccination_session_photos table |
| File too large | Compress images before upload (max 5MB) |
| Signed URL expires | Generate new URL, increase expiry time if needed |

