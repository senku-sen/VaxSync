# Integration Guide: Add Participant Tracking to Vaccination Schedule

## Where to See the AddParticipantsModal

The `AddParticipantsModal` appears in **two places**:

### 1. **In SessionParticipantsMonitor Component** (Recommended)
   - Shows when you click the "Add Participants" button
   - Located in the participant monitoring table
   - Used to add residents to an existing session

### 2. **In ScheduleSessionModal** (Optional - After creating session)
   - Could be shown after session creation
   - Allows adding participants immediately after scheduling

---

## Step-by-Step Integration

### Step 1: Add Import to Health Worker Vaccination Schedule Page

File: `app/pages/Health_Worker/vaccination_schedule/page.jsx`

Add this import at the top (around line 12):

```javascript
import SessionParticipantsMonitor from "../../../../components/vaccination-schedule/SessionParticipantsMonitor";
```

---

### Step 2: Add State for Selected Session

In the same file, add this state (around line 55):

```javascript
// State to track which session is selected for participant management
const [selectedSessionForParticipants, setSelectedSessionForParticipants] = useState(null);
```

---

### Step 3: Add Modal for Participants

Add this modal in the JSX (around line 730, after UpdateAdministeredModal):

```jsx
{/* Session Participants Monitor Modal */}
{selectedSessionForParticipants && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      {/* Close Button */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Manage Participants</h2>
        <button
          onClick={() => setSelectedSessionForParticipants(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Monitor Component */}
      <div className="p-6">
        <SessionParticipantsMonitor
          sessionId={selectedSessionForParticipants.id}
          barangayName={selectedSessionForParticipants.barangays?.name}
          vaccineName={selectedSessionForParticipants.vaccines?.name}
        />
      </div>
    </div>
  </div>
)}
```

---

### Step 4: Add Button to Sessions Table/Cards

You need to add a "Manage Participants" button to the session rows.

**Option A: Add to SessionsTable.jsx**

Find the actions column and add:

```jsx
<button
  onClick={() => setSelectedSessionForParticipants(session)}
  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
>
  👥 Participants
</button>
```

**Option B: Add to SessionsCardList.jsx**

Add button to the card actions:

```jsx
<button
  onClick={() => setSelectedSessionForParticipants(session)}
  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
>
  👥 Manage Participants
</button>
```

---

## Complete Flow

```
Health Worker Vaccination Schedule Page
    ↓
    [Sessions Table/Cards]
    ↓
    [Click "Manage Participants" button]
    ↓
    SessionParticipantsMonitor Modal Opens
    ↓
    [Click "Add Participants" button]
    ↓
    AddParticipantsModal Opens
    ↓
    [Select residents from list]
    ↓
    [Click "Add" button]
    ↓
    Residents added to session_beneficiaries table
    ↓
    Monitor table updates with new participants
    ↓
    [Toggle attendance/vaccination checkmarks]
    ↓
    Data saved to database
```

---

## Files You Need to Modify

1. **`app/pages/Health_Worker/vaccination_schedule/page.jsx`**
   - Add import for SessionParticipantsMonitor
   - Add state for selectedSessionForParticipants
   - Add modal JSX

2. **`components/vaccination-schedule/SessionsTable.jsx`** (Optional)
   - Add "Manage Participants" button to actions

3. **`components/vaccination-schedule/SessionsCardList.jsx`** (Optional)
   - Add "Manage Participants" button to actions

---

## What Happens When You Click "Manage Participants"

1. **Modal Opens** showing SessionParticipantsMonitor
2. **Shows Current Participants** in a table
3. **Statistics Display** (total, attended, vaccinated, rates)
4. **"Add Participants" Button** opens AddParticipantsModal
5. **Select Residents** from available list
6. **Toggle Attendance** (blue checkmark)
7. **Toggle Vaccination** (green checkmark)
8. **Remove Participants** if needed
9. **All changes saved** immediately to database

---

## Quick Reference: Component Hierarchy

```
Health Worker Vaccination Schedule Page
├── SessionsContainer
│   ├── SessionsTable
│   │   └── "Manage Participants" button
│   └── SessionsCardList
│       └── "Manage Participants" button
└── SessionParticipantsMonitor Modal
    ├── Participants Table
    ├── Statistics Cards
    └── AddParticipantsModal
        └── Resident Selection List
```

---

## Testing Checklist

- [ ] Run SQL migration to create `session_beneficiaries` table
- [ ] Import SessionParticipantsMonitor in vaccination schedule page
- [ ] Add state for selectedSessionForParticipants
- [ ] Add modal JSX to page
- [ ] Add "Manage Participants" button to SessionsTable
- [ ] Click button to open modal
- [ ] Click "Add Participants" to open resident selection
- [ ] Select residents and add them
- [ ] Toggle attendance checkmark
- [ ] Toggle vaccination checkmark
- [ ] Verify data saves to database
- [ ] Refresh page and verify data persists

---

## Notes

- The AddParticipantsModal is **automatically included** in SessionParticipantsMonitor
- You don't need to import AddParticipantsModal separately
- All data is saved **immediately** to the database
- Statistics update in **real-time** as you toggle checkmarks
