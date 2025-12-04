# Resident Vaccination Tracking Feature

## Overview
Connect residents to vaccination sessions and monitor their vaccination status in real-time.

## How It Works

### 1. Schedule a Session
- Create a vaccination session (date, time, vaccine, barangay)
- Session is created in `vaccination_sessions` table

### 2. Add Participants
- Click "Add Participants" button on the session
- Select residents from the barangay
- Residents are linked to the session in `session_beneficiaries` table

### 3. Monitor Vaccination
- Track attendance (who showed up)
- Track vaccination status (who got vaccinated)
- View real-time statistics

## Database Structure

### New Table: `session_beneficiaries`
```sql
- id (UUID) - Primary key
- session_id (UUID) - Links to vaccination_sessions
- resident_id (UUID) - Links to residents
- attended (BOOLEAN) - Did resident attend?
- vaccinated (BOOLEAN) - Did resident get vaccinated?
- notes (TEXT) - Additional notes
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Files Created

### 1. Database Migration
- `SQL_MIGRATIONS/session_beneficiaries_schema.sql`
  - Creates `session_beneficiaries` table
  - Sets up RLS policies
  - Creates indexes for performance

### 2. Backend Functions
- `lib/sessionBeneficiaries.js`
  - `addBeneficiariesToSession()` - Add residents to session
  - `fetchSessionBeneficiaries()` - Get participants with resident details
  - `updateBeneficiaryStatus()` - Update attendance/vaccination status
  - `removeBeneficiaryFromSession()` - Remove a participant
  - `getSessionStatistics()` - Get attendance/vaccination rates
  - `getAvailableResidentsForSession()` - Get residents not yet added

### 3. Frontend Components
- `components/vaccination-schedule/AddParticipantsModal.jsx`
  - Modal to select and add residents
  - Search functionality
  - Select all/deselect all
  - Shows selected count

- `components/vaccination-schedule/SessionParticipantsMonitor.jsx`
  - Display all participants
  - Toggle attendance status
  - Toggle vaccination status
  - Remove participants
  - Show statistics (total, attended, vaccinated, rates)

## Setup Steps

### Step 1: Run Database Migration
Execute the SQL in `SQL_MIGRATIONS/session_beneficiaries_schema.sql` in your Supabase console.

### Step 2: Update Vaccination Schedule Page
Add the monitoring component to your vaccination schedule page:

```jsx
import SessionParticipantsMonitor from "@/components/vaccination-schedule/SessionParticipantsMonitor";

// In your session detail view:
<SessionParticipantsMonitor
  sessionId={session.id}
  barangayName={session.barangays?.name}
  vaccineName={session.vaccines?.name}
/>
```

### Step 3: Test the Feature
1. Create a vaccination session
2. Click "Add Participants"
3. Select residents from the list
4. Click "Add" to add them
5. Toggle attendance and vaccination checkmarks
6. View statistics update in real-time

## Features

### ✅ Add Participants
- Search residents by name or contact
- Select multiple residents
- Select all / deselect all
- Prevents duplicate entries

### ✅ Monitor Vaccination
- Track attendance (blue checkmark)
- Track vaccination status (green checkmark)
- View real-time statistics
- Remove participants if needed

### ✅ Statistics
- Total participants
- Attended count
- Vaccinated count
- Attendance rate (%)
- Vaccination rate (%)

### ✅ Filtering
- Only shows approved residents
- Only shows residents not yet added to session
- Search by name or contact
- Filters by barangay

## Usage Flow

```
1. Health Worker creates session
   ↓
2. Clicks "Add Participants"
   ↓
3. Selects residents from modal
   ↓
4. Residents appear in monitor table
   ↓
5. During session, marks attendance
   ↓
6. After vaccination, marks vaccinated
   ↓
7. Statistics update automatically
   ↓
8. Data saved to database
```

## API Functions

### Add Beneficiaries
```javascript
const result = await addBeneficiariesToSession(sessionId, [residentId1, residentId2]);
```

### Fetch Beneficiaries
```javascript
const result = await fetchSessionBeneficiaries(sessionId);
// Returns: { residents: [...], attended, vaccinated, notes }
```

### Update Status
```javascript
const result = await updateBeneficiaryStatus(beneficiaryId, {
  attended: true,
  vaccinated: true,
  notes: "Vaccinated successfully"
});
```

### Get Statistics
```javascript
const result = await getSessionStatistics(sessionId);
// Returns: { total, attended, vaccinated, attendanceRate, vaccinationRate }
```

### Get Available Residents
```javascript
const result = await getAvailableResidentsForSession(sessionId, barangayName);
// Returns: residents not yet added to this session
```

## Next Steps

1. **Run the SQL migration** to create the table
2. **Import the components** into your vaccination schedule page
3. **Test with sample data** to ensure it works
4. **Add to your UI** where you want to track participants

## Notes

- Residents must be "approved" status to be added
- Each resident can only be added once per session
- Attendance and vaccination status can be toggled anytime
- All changes are saved immediately to the database
- Statistics update in real-time
