# Health Worker Notifications - Implementation Guide

## Overview
This document describes the implementation of dynamic vaccine request notifications for health workers that adapt to every vaccine request status and head nurse actions (approve/reject).

## Problem Statement
Previously, the health worker notification page displayed hardcoded report reminders. There was no real-time notification system for vaccine request status updates from the Head Nurse.

## Solution
Implemented a real-time notification system that:
- Fetches all vaccine requests for the logged-in health worker
- Transforms requests into notifications with status-specific messaging
- Displays status-specific icons and colors (pending, approved, rejected, released)
- Updates in real-time when Head Nurse approves or rejects requests
- Falls back to polling every 30 seconds for reliability

## Files Created

### 1. `/lib/notification.js`
Core notification library with the following functions:

**`fetchVaccineRequestNotifications(userId)`**
- Fetches all vaccine requests for a user from Supabase
- Transforms each request into a notification object
- Includes vaccine name, barangay, quantity, status, and timestamps
- Returns: `{ data: Array<Notification>, error: string|null }`

**`getStatusBadgeColor(status)`**
- Returns Tailwind CSS classes for status badge styling
- Supports: pending, approved, rejected, released

**`getStatusIconBgColor(status)`**
- Returns background color class for status icon container
- Matches status badge colors

**`getStatusIconColor(status)`**
- Returns text color class for status icon
- Used for icon styling

**`formatNotificationTimestamp(timestamp)`**
- Formats timestamps in human-readable format
- Examples: "Just now", "5 minutes ago", "2 hours ago", "Yesterday"
- Returns: `string`

**`subscribeToVaccineRequestUpdates(userId, callback)`**
- Sets up real-time Supabase subscription to vaccine_requests table
- Listens for changes to requests created by the user
- Calls callback function when updates occur
- Returns: unsubscribe function

## Files Modified

### 1. `/app/pages/Health_Worker/notifications/page.jsx`

**Changes:**
- Removed hardcoded report notification data
- Added real-time vaccine request notification fetching
- Integrated notification library functions
- Added loading and error states
- Updated notification rendering for vaccine requests

**New State Variables:**
```javascript
const [notifications, setNotifications] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);
const [userId, setUserId] = useState(null);
```

**New Functions:**
- `initializeNotifications()` - Loads user profile and fetches notifications
- `getStatusIcon(status)` - Returns SVG icon based on status

**Updated Rendering:**
- Shows vaccine name, barangay, quantity
- Displays status-specific icons and colors
- Shows request notes if available
- Loading spinner while fetching
- Error state with retry button
- Empty state when no notifications

## Notification Status Types

### Pending (Yellow)
- **Icon**: Clock
- **Color**: Yellow (bg-yellow-100, text-yellow-700)
- **Title**: "Vaccine Request Pending"
- **Description**: "Your request for [vaccine] is awaiting approval"

### Approved (Green)
- **Icon**: Checkmark
- **Color**: Green (bg-green-100, text-green-700)
- **Title**: "Vaccine Request Approved ✓"
- **Description**: "Your request for [vaccine] has been approved by Head Nurse"

### Rejected (Red)
- **Icon**: X
- **Color**: Red (bg-red-100, text-red-700)
- **Title**: "Vaccine Request Rejected"
- **Description**: "Your request for [vaccine] has been rejected"

### Released (Blue)
- **Icon**: Lightning bolt
- **Color**: Blue (bg-blue-100, text-blue-700)
- **Title**: "Vaccine Request Released"
- **Description**: "Your request for [vaccine] has been released to inventory"

## Features Implemented

### ✅ Real-time Updates
- Supabase real-time subscription listens for vaccine_requests table changes
- Automatically refreshes notifications when Head Nurse updates status
- Callback triggers `initializeNotifications()` to fetch latest data

### ✅ Fallback Polling
- Periodic polling every 30 seconds as backup
- Ensures notifications are fetched even if real-time subscription fails
- Provides reliability in unstable network conditions

### ✅ Status Sorting
- Sort by: Newest First, Oldest First, By Status
- Status order: Pending → Approved → Rejected → Released
- Maintains sort preference across page interactions

### ✅ Tab Filtering
- **All**: Shows all notifications
- **Unread**: Shows only unread notifications
- **Archived**: Shows archived notifications
- Tab counts update dynamically

### ✅ User Actions
- **Mark as read/unread**: Toggle read status
- **Archive**: Move notification to archived tab
- **Delete**: Remove notification permanently
- **Retry**: Reload notifications if error occurs

### ✅ Professional UI
- Status-specific icons and colors
- Loading spinner with message
- Error state with retry button
- Empty state with helpful message
- Responsive design (mobile & desktop)
- Timestamp formatting (e.g., "5 minutes ago")
- Unread indicator (green dot)
- Smooth transitions and hover effects

## Data Flow

```
Health Worker opens notifications page
    ↓
useEffect triggers initializeNotifications()
    ↓
loadUserProfile() retrieves current user ID
    ↓
fetchVaccineRequestNotifications(userId) queries vaccine_requests table
    ↓
Transform requests into notification objects:
  - Status-specific title and description
  - Vaccine name, barangay, quantity
  - Timestamp and read status
    ↓
Display notifications with status-specific styling
    ↓
subscribeToVaccineRequestUpdates() sets up real-time listener
    ↓
When Head Nurse approves/rejects:
  - Supabase triggers update event
  - Callback refreshes notifications
  - UI updates automatically
    ↓
Fallback: Poll every 30 seconds
```

## Database Query

The notification system queries the `vaccine_requests` table:

```sql
SELECT
  id,
  vaccine_id,
  barangay_id,
  status,
  quantity_dose,
  quantity_vial,
  notes,
  created_at,
  requested_at,
  vaccines(name),
  barangays(name)
FROM vaccine_requests
WHERE requested_by = $1
ORDER BY created_at DESC
```

## RLS Policies Required

Ensure these RLS policies exist on the `vaccine_requests` table:

```sql
-- Health Worker: Read only their own requests
CREATE POLICY "Health Worker can read own vaccine requests"
ON public.vaccine_requests
FOR SELECT
USING (requested_by = auth.uid());
```

## Testing Checklist

- [ ] Create vaccine request as health worker
- [ ] Verify notification appears with "Pending" status
- [ ] Approve request as Head Nurse
- [ ] Verify "Approved" notification appears in real-time
- [ ] Reject request as Head Nurse
- [ ] Verify "Rejected" notification appears
- [ ] Test sorting by: Newest First, Oldest First, By Status
- [ ] Test filtering: All, Unread, Archived
- [ ] Test mark as read/unread
- [ ] Test archive functionality
- [ ] Test delete functionality
- [ ] Test error retry button
- [ ] Verify responsive design on mobile
- [ ] Test timestamp formatting (e.g., "5 minutes ago")
- [ ] Verify status-specific icons and colors
- [ ] Test with multiple requests
- [ ] Verify real-time updates (no page refresh needed)

## Troubleshooting

### Notifications Not Appearing
1. Check that user has vaccine requests in database
2. Verify RLS policies allow health worker to read own requests
3. Check browser console for errors
4. Try clicking "Retry" button to manually refresh

### Real-time Updates Not Working
1. Check Supabase real-time is enabled
2. Verify Supabase subscription is active (check console logs)
3. Fallback polling should still work (30-second interval)
4. Check network connection

### Status Icons Not Showing
1. Verify SVG paths are correct in `getStatusIcon()` function
2. Check Tailwind CSS classes are applied
3. Ensure status value matches one of: pending, approved, rejected, released

## Performance Considerations

- Notifications are fetched on page load and cached in state
- Real-time subscription only updates when data changes
- Polling interval is 30 seconds (configurable)
- No infinite loops or memory leaks
- Proper cleanup of subscriptions on component unmount

## Future Enhancements

- [ ] Add notification sound/browser notification
- [ ] Add email notifications for approved/rejected
- [ ] Add notification preferences (which statuses to notify)
- [ ] Add notification history export
- [ ] Add bulk actions (archive all, delete all)
- [ ] Add search/filter by vaccine name
- [ ] Add notification grouping by vaccine
- [ ] Add notification count badge in sidebar

## Dependencies

- React 18+
- Supabase JavaScript client
- Tailwind CSS
- lucide-react (for icons)

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support (responsive design)
