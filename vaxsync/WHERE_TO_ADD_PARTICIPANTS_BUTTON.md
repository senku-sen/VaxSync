# Where to Add the "Manage Participants" Button

## Visual Layout of Vaccination Schedule Page

```
┌─────────────────────────────────────────────────────────────┐
│  HEALTH WORKER VACCINATION SCHEDULE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [+ Schedule Session] [Calendar View] [Filters]            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Vaccination Sessions                                 │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Barangay │ Date & Time │ Vaccine │ Target │ Status │ │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Brgy A   │ 2025-12-04  │ Pentaval│ 50    │ Scheduled│  │
│  │          │ 10:00 AM    │         │       │          │  │
│  │ Actions: [Update] [Edit] [Delete]                   │  │
│  │          ↓ NEW BUTTON HERE ↓                        │  │
│  │          [👥 Participants]                          │  │
│  │                                                      │  │
│  │ Brgy B   │ 2025-12-05  │ TT1     │ 30    │ In Progress
│  │          │ 02:00 PM    │         │       │          │  │
│  │ Actions: [Update] [Edit] [Delete]                   │  │
│  │          [👥 Participants]                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Modify SessionsTable.jsx

**File:** `components/vaccination-schedule/SessionsTable.jsx`

**Add import at top (line 8):**
```javascript
import { SquarePen, Trash2, Activity, Users } from "lucide-react";
```

**Add prop to component (line 10-16):**
```javascript
export default function SessionsTable({
  sessions = [],
  onEdit = () => {},
  onDelete = () => {},
  onUpdateProgress = () => {},
  onManageParticipants = () => {},  // ← ADD THIS
  isHeadNurse = false
})
```

**Add button in Actions column (after line 68, inside the flex div):**
```jsx
<button 
  onClick={() => onManageParticipants(session)}
  className="text-blue-600 hover:text-blue-800 transition-colors p-1"
  title="Manage participants"
>
  <Users size={18} />
</button>
```

**Result:**
```jsx
<td className="px-6 py-4">
  <div className="flex gap-2">
    <button 
      onClick={() => onUpdateProgress(session)}
      className="text-green-600 hover:text-green-800 transition-colors p-1"
      title={isHeadNurse ? "View progress" : "Update progress"}
    >
      <Activity size={18} />
    </button>
    {!isHeadNurse && (
      <>
        <button 
          onClick={() => onManageParticipants(session)}  // ← NEW
          className="text-blue-600 hover:text-blue-800 transition-colors p-1"
          title="Manage participants"
        >
          <Users size={18} />
        </button>
        <button 
          onClick={() => onEdit(session)}
          className="text-gray-600 hover:text-blue-600 transition-colors p-1"
          title="Edit session"
        >
          <SquarePen size={18} />
        </button>
        <button 
          onClick={() => onDelete(session.id)}
          className="text-red-600 hover:text-red-800 transition-colors p-1"
          title="Delete session"
        >
          <Trash2 size={18} />
        </button>
      </>
    )}
  </div>
</td>
```

---

## Step 2: Modify Health Worker Vaccination Schedule Page

**File:** `app/pages/Health_Worker/vaccination_schedule/page.jsx`

**Add import (line 12):**
```javascript
import SessionParticipantsMonitor from "../../../../components/vaccination-schedule/SessionParticipantsMonitor";
```

**Add state (after line 55):**
```javascript
// State to track which session is selected for participant management
const [selectedSessionForParticipants, setSelectedSessionForParticipants] = useState(null);
```

**Add handler function (after other handlers, around line 400):**
```javascript
const handleManageParticipants = (session) => {
  setSelectedSessionForParticipants(session);
};
```

**Pass prop to SessionsContainer (line 653):**
```jsx
<SessionsContainer
  sessions={filteredSessions}
  onEdit={handleEditSession}
  onDelete={handleDeleteSession}
  onUpdateProgress={handleUpdateProgress}
  onManageParticipants={handleManageParticipants}  // ← ADD THIS
/>
```

**Add modal JSX (after UpdateAdministeredModal, around line 730):**
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
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
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

**Add X import at top (line 21):**
```javascript
import { Plus, Calendar, Filter, X } from "lucide-react";
```

---

## Step 3: Update SessionsContainer

**File:** `components/vaccination-schedule/SessionsContainer.jsx`

**Add prop (line 11-16):**
```javascript
export default function SessionsContainer({
  sessions = [],
  onEdit = () => {},
  onDelete = () => {},
  onUpdateProgress = () => {},
  onManageParticipants = () => {},  // ← ADD THIS
  isHeadNurse = false
})
```

**Pass prop to SessionsTable (line 27-33):**
```jsx
<SessionsTable
  sessions={sessions}
  onEdit={isHeadNurse ? undefined : onEdit}
  onDelete={isHeadNurse ? undefined : onDelete}
  onUpdateProgress={onUpdateProgress}
  onManageParticipants={onManageParticipants}  // ← ADD THIS
  isHeadNurse={isHeadNurse}
/>
```

---

## What Happens When User Clicks "👥 Participants" Button

```
1. User clicks 👥 button in Actions column
   ↓
2. handleManageParticipants(session) is called
   ↓
3. selectedSessionForParticipants state is set
   ↓
4. Modal appears with SessionParticipantsMonitor
   ↓
5. Shows current participants in table
   ↓
6. User can:
   - Click "Add Participants" to open resident selection
   - Toggle attendance checkmark (blue)
   - Toggle vaccination checkmark (green)
   - Remove participants
   - View statistics
   ↓
7. All changes saved immediately to database
   ↓
8. User closes modal by clicking X or outside
```

---

## Testing After Integration

1. ✅ Run SQL migration to create `session_beneficiaries` table
2. ✅ Create a new vaccination session
3. ✅ Look for 👥 button in Actions column
4. ✅ Click 👥 button
5. ✅ Modal should open showing SessionParticipantsMonitor
6. ✅ Click "Add Participants"
7. ✅ AddParticipantsModal should open
8. ✅ Select residents and click "Add"
9. ✅ Participants should appear in monitor table
10. ✅ Toggle checkmarks and verify they save
11. ✅ Close modal and reopen to verify data persists

---

## Summary of Changes

| File | Changes | Lines |
|------|---------|-------|
| SessionsTable.jsx | Add Users icon import, onManageParticipants prop, button | 8, 15, 68 |
| SessionsContainer.jsx | Add onManageParticipants prop, pass to SessionsTable | 16, 32 |
| Health Worker page | Add import, state, handler, pass prop, add modal JSX | 12, 56, ~400, 653, 730 |

