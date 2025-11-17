# Vaccination Schedule Setup Guide

## Overview
The Vaccination Schedule page allows Health Workers to schedule vaccination sessions for their assigned barangay. The page features a simplified UI with only an "Add Schedule Session" button and a modal form.

## Features Implemented

### 1. **Simplified UI**
- Single "Schedule Session" button
- Clean, minimal interface
- No search or display table (as requested)
- Responsive design (mobile & desktop)

### 2. **Modal Form Fields**
The modal form includes the following fields:

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Barangay | Text (Read-only) | Yes | User's assigned barangay | Auto-populated from user profile |
| Date | Date picker | Yes | - | User selects vaccination date |
| Time | Time picker | Yes | - | User selects vaccination time |
| Vaccine | Dropdown | Yes | - | Fetched from vaccines table |
| Target | Number | Yes | - | Number of people to vaccinate |

### 3. **Form Validation**
- All fields are required
- Red borders on invalid fields
- Error messages displayed in alert box
- Real-time error clearing when user types

### 4. **Data Submission**
When form is submitted, the following data is saved to `vaccination_sessions` table:

```javascript
{
  barangay_id: userProfile.barangays.id,
  vaccine_id: formData.vaccine_id,
  session_date: formData.date,
  session_time: formData.time,
  target: parseInt(formData.target),
  administered: 0,
  status: "Scheduled",
  created_by: userProfile.id,
  created_at: new Date().toISOString()
}
```

## Database Setup

### Step 1: Create the Table
Run the SQL script in Supabase SQL Editor:

```bash
File: /vaxsync/lib/migrations/vaccination_sessions_schema.sql
```

This creates:
- `vaccination_sessions` table with all required columns
- Foreign key relationships to `barangays`, `vaccines`, and `user_profiles`
- Indexes for performance optimization
- RLS policies for security

### Step 2: Verify Table Structure

```sql
SELECT * FROM public.vaccination_sessions LIMIT 1;
```

Expected columns:
- `id` (UUID, Primary Key)
- `barangay_id` (UUID, Foreign Key)
- `vaccine_id` (UUID, Foreign Key)
- `session_date` (DATE)
- `session_time` (TIME)
- `target` (INTEGER)
- `administered` (INTEGER)
- `status` (VARCHAR)
- `created_by` (UUID, Foreign Key)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## RLS Policies Explained

### Health Worker Policies
- **SELECT**: Can only view sessions they created
- **INSERT**: Can create sessions only for their assigned barangay
- **UPDATE**: Can update only their own sessions
- **DELETE**: Can delete only their own sessions

### Head Nurse Policies
- **SELECT**: Can view all vaccination sessions
- **UPDATE**: Can update any vaccination session
- **DELETE**: Can delete any vaccination session

## File Structure

```
vaxsync/
├── app/pages/Health_Worker/
│   └── vaccination_schedule/
│       └── page.jsx (Main component)
├── lib/migrations/
│   └── vaccination_sessions_schema.sql (Database schema)
└── VACCINATION_SCHEDULE_SETUP.md (This file)
```

## Component Details

### State Variables
- `isModalOpen`: Controls modal visibility
- `userProfile`: Current logged-in user data
- `isLoading`: Loading state during initialization
- `error`: Error messages
- `vaccines`: List of available vaccines
- `formData`: Form input values (date, time, vaccine_id, target)
- `errors`: Validation error messages
- `isSubmitting`: Submission state

### Key Functions

#### `initializeData()`
- Loads user profile
- Fetches available vaccines
- Sets loading state

#### `fetchVaccines()`
- Queries vaccines table from Supabase
- Populates vaccine dropdown

#### `validateForm()`
- Validates all required fields
- Sets error messages
- Returns validation status

#### `handleChange(e)`
- Updates form data on input change
- Clears errors when user types

#### `handleSubmit(e)`
- Validates form
- Inserts data into vaccination_sessions table
- Shows success/error alerts
- Closes modal on success

#### `handleCancel()`
- Resets form data
- Clears errors
- Closes modal

## Usage

### For Health Workers
1. Navigate to "Vaccination Schedule" page
2. Click "Schedule Session" button
3. Fill in the form:
   - Barangay is auto-filled (read-only)
   - Select date and time
   - Choose vaccine from dropdown
   - Enter target number of people
4. Click "Schedule Session" to save
5. Success message appears on completion

### For Head Nurse (Admin)
- Can view all vaccination sessions
- Can update session details (administered count, status)
- Can delete sessions if needed

## Testing Checklist

- [ ] Barangay field is auto-populated and read-only
- [ ] Date picker works correctly
- [ ] Time picker works correctly
- [ ] Vaccine dropdown loads all vaccines
- [ ] Target field accepts numbers only
- [ ] Form validation shows errors for empty fields
- [ ] Errors clear when user starts typing
- [ ] Form submits successfully
- [ ] Success message appears after submission
- [ ] Modal closes after successful submission
- [ ] Data is saved to vaccination_sessions table
- [ ] Health workers can only see their own sessions
- [ ] Head Nurse can see all sessions

## Troubleshooting

### Issue: "Barangay ID is missing"
**Solution**: Ensure user profile has an assigned barangay. Check `user_profiles.assigned_barangay_id` is not NULL.

### Issue: Vaccine dropdown is empty
**Solution**: Verify vaccines exist in the `vaccines` table. Run:
```sql
SELECT id, name FROM public.vaccines;
```

### Issue: Form submission fails
**Solution**: Check browser console for error messages. Verify:
1. Supabase credentials are correct
2. RLS policies are properly configured
3. User has permission to insert into vaccination_sessions

### Issue: Modal won't open
**Solution**: Check that `isModalOpen` state is being set correctly. Verify button onClick handler is working.

## Future Enhancements

- [ ] Add ability to view scheduled sessions
- [ ] Add edit functionality for existing sessions
- [ ] Add delete functionality with confirmation
- [ ] Add session status tracking (Scheduled → In Progress → Completed)
- [ ] Add administered count update
- [ ] Add session history/reports
- [ ] Add calendar view for sessions
- [ ] Add notifications for upcoming sessions

## Related Files

- User Profile: `/lib/vaccineRequest.js`
- Vaccines Table: `vaccines` (Supabase)
- Barangays Table: `barangays` (Supabase)
- User Profiles Table: `user_profiles` (Supabase)
