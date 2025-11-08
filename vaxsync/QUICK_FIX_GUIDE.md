# 🚨 Quick Fix Guide - Email Template Issues

## Problem 1: Email Not Showing Custom Template

**You're seeing the default Supabase email because:**
- The code you pasted needs to go in the **"Confirm sign up"** template (not "Magic link")
- The logo URL `{{YOUR_APP_URL}}` is a placeholder and needs to be replaced

## Problem 2: Logo Not Showing in Email

**Why:** Email clients can't access `localhost:3000` or placeholder URLs like `{{YOUR_APP_URL}}`

**Fix:** You need to use a publicly accessible URL for your logo

---

## ✅ Solution - Follow These Steps:

### Step 1: Get a Public URL for Your Logo

**Option A - If you have a production URL:**
```
https://yourdomain.com/VSyncLogo.png
```

**Option B - Upload to Image Hosting (Quick Fix):**
1. Go to https://imgur.com or https://imgbb.com
2. Upload your `VSyncLogo.png` file
3. Copy the direct image URL (should look like: `https://i.imgur.com/xxxxx.png`)
4. Use this URL in your email template

### Step 2: Update Supabase Email Template

1. **Go to:** Supabase Dashboard → Authentication → Emails
2. **Click:** "Confirm sign up" (NOT "Magic link" or "Magic Link")
3. **Click:** The `<> Source` tab
4. **Copy the HTML from:** `CONFIRM_SIGNUP_EMAIL_TEMPLATE.html`
5. **IMPORTANT:** Before pasting, replace the logo URL on line 17:
   - Find: `src="http://localhost:3000/VSyncLogo.png"`
   - Replace with: Your public logo URL from Step 1
6. **Paste** the updated HTML
7. **Update Subject** to: `Confirm Your Signup - VaxSync`
8. **Click Save**

### Step 3: Test

1. Sign up a **NEW** test user (old emails won't update)
2. Check the email - you should see your custom template with logo!

---

## 📁 Files Created:

1. **`CONFIRM_SIGNUP_EMAIL_TEMPLATE.html`** - Use this for "Confirm sign up" emails
2. **`MAGIC_LINK_EMAIL_TEMPLATE.html`** - Use this for OTP/Magic link emails (code only, no link)
3. **`EMAIL_SETUP_INSTRUCTIONS.md`** - Detailed setup guide

---

## 🔍 Logo Not Showing on Web Pages?

The logo should work on your web pages (signup, signin, etc.) because they use `/VSyncLogo.png` which works for local files.

If it's not showing:
- ✅ Check the file exists in `public/VSyncLogo.png`
- ✅ Make sure the filename matches exactly (case-sensitive)
- ✅ Try hard refresh (Ctrl+F5)

---

## ⚠️ Important Notes:

- **For Emails:** Logo MUST be publicly accessible (not localhost)
- **For Web Pages:** Logo can be local (`/VSyncLogo.png`)
- **Template Location:** Use "Confirm sign up" template in Supabase (not "Magic link")
- **Testing:** Always test with a NEW user signup

---

## 🎯 Quick Checklist:

- [ ] Upload logo to get public URL (or use production URL)
- [ ] Update `CONFIRM_SIGNUP_EMAIL_TEMPLATE.html` with public logo URL
- [ ] Go to Supabase → Authentication → Emails → "Confirm sign up"
- [ ] Paste updated HTML template
- [ ] Update subject line
- [ ] Save template
- [ ] Test with new user signup
- [ ] Verify logo shows in email ✅

---

**Need more help?** Check `EMAIL_SETUP_INSTRUCTIONS.md` for detailed troubleshooting.

