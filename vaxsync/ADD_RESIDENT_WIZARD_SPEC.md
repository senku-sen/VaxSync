# Add Resident Wizard - Complete Specification

## Overview
Multi-step wizard to add residents with intelligent vaccine history management based on vaccination status.

---

## Step 1: Basic Information
**Form Fields:**
- Full Name (required, text input)
- Birthday (required, date picker)
- Sex (required, dropdown: Male/Female)
- Barangay (required, auto-set to assigned barangay for Health Worker)

**Validation:**
- All fields required
- Birthday must be in the past
- Name must not be empty

**Navigation:**
- Next button → Step 2

---

## Step 2: Vaccine Status Selection
**Form Field:**
- Vaccine Status (required, dropdown):
  - Not Vaccinated
  - Partially Vaccinated
  - Fully Vaccinated

**Logic Based on Selection:**

### 2A: NOT VACCINATED
**Popup Question:** "Did this resident miss a vaccination session?"

#### Option A: YES - Missed Session
**Display:**
- List of past vaccination sessions from `vaccination_sessions` table
- For each session, show: Session Name, Date, Vaccine Type, Barangay
- Filter sessions by:
  - Status = "Completed"
  - Barangay matches resident's barangay
  - Date is in the past
- Allow selecting multiple sessions

**For Each Selected Session:**
- Auto-populate vaccine type from session
- Show vaccine date (session date)
- Allow editing the date (must be in past)
- Allow selecting multiple vaccines if session had multiple vaccines

**Data Structure:**
```
selectedVaccines = [
  { sessionId, vaccineName, vaccineDate, sessionDate },
  { sessionId, vaccineName, vaccineDate, sessionDate },
  ...
]
```

#### Option B: NO - First Timer / No Missed Sessions
**Display:**
- List of current/upcoming vaccination sessions from `vaccination_sessions` table
- For each session, show: Session Name, Date, Vaccine Type, Barangay
- Filter sessions by:
  - Status = "Scheduled" OR "In progress"
  - Barangay matches resident's barangay
  - Date is today or in future

**For Selected Session:**
- Auto-populate vaccine type from session
- Session date will be used (not editable, as it's future)
- **IMPORTANT:** Resident will be automatically added to this session's participants
- Will be marked as `attended: false, vaccinated: false` in session_beneficiaries
- Resident will appear in "Current Session Participants" immediately

**Data Structure:**
```
selectedSession = {
  sessionId,
  vaccineName,
  sessionDate
}
```

**Action on Submit:**
- Create resident record
- Create session_beneficiaries record with `attended: false, vaccinated: false`
- Resident appears in session participants list

---

### 2B: PARTIALLY VACCINATED
**Display - Part 1: Past Vaccines**
- Vaccine selection interface with two options:

#### Option 1: Select from Vaccine List
- Dropdown showing all available vaccines
- For each vaccine, show vaccine name
- Allow selecting multiple vaccines

#### Option 2: Manual Entry
- If vaccine not in list, allow text input
- Add button to add custom vaccine

**For Each Selected Vaccine:**
- Show date picker (must be in past)
- Validate date is before today
- Allow editing vaccine name

**Data Structure (Past Vaccines):**
```
selectedVaccines = [
  { vaccineName, vaccineDate },
  { vaccineName, vaccineDate },
  ...
]
```

**Display - Part 2: Upcoming Session (Optional)**
- List of current/upcoming vaccination sessions from `vaccination_sessions` table
- For each session, show: Session Name, Date, Vaccine Type, Barangay
- Filter sessions by:
  - Status = "Scheduled" OR "In progress"
  - Barangay matches resident's barangay
  - Date is today or in future
- **Optional:** User can select one upcoming session to add resident to

**For Selected Upcoming Session:**
- Resident will be automatically added to this session's participants
- Will be marked as `attended: false, vaccinated: false` in session_beneficiaries
- Resident will appear in "Current Session Participants" immediately

**Action on Submit:**
- Create resident record
- Create session_beneficiaries records for past vaccines (attended: true, vaccinated: true)
- Create session_beneficiaries record for upcoming session (attended: false, vaccinated: false) if selected

---

### 2C: FULLY VACCINATED
**Display:**
- Vaccine selection interface with two options:

#### Option 1: Select from Vaccine List
- Dropdown showing all available vaccines
- For each vaccine, show vaccine name
- Allow selecting multiple vaccines

#### Option 2: Manual Entry
- If vaccine not in list, allow text input
- Add button to add custom vaccine

**For Each Selected Vaccine:**
- Show date picker (must be in past)
- Validate date is before today
- Allow editing vaccine name

**Data Structure:**
```
selectedVaccines = [
  { vaccineName, vaccineDate },
  { vaccineName, vaccineDate },
  ...
]
```

**Important:**
- `administered_date` field will be set to the **latest (most recent) vaccine date** from the list
- This represents when the resident completed their full vaccination schedule

**Action on Submit:**
- Create resident record with `administered_date = max(all vaccine dates)`
- Create session_beneficiaries records for all vaccines (attended: true, vaccinated: true)

---

## Step 3: Review & Summary
**Display:**

### Section 1: Resident Information
- Full Name
- Birthday (formatted as MM/DD/YYYY)
- Sex
- Barangay
- Vaccine Status

### Section 2: Vaccine History
**If NOT VACCINATED (No Missed Sessions):**
- Session Name
- Session Date
- Vaccine Type
- Note: "Will be added to session with 'Not Attended' status"

**If NOT VACCINATED (Missed Sessions) OR PARTIALLY VACCINATED OR FULLY VACCINATED:**
- Table showing:
  - Vaccine Name
  - Vaccination Date
  - Edit button (pencil icon)
  - Delete button (trash icon)

### Section 3: Session Beneficiaries Preview
- Table showing what will be created in `session_beneficiaries`:
  - Vaccine Name
  - Date
  - Session (if applicable)
  - Status (Attended: No, Vaccinated: No/Yes)

**Actions:**
- Edit button → Go back to Step 2
- Cancel button → Close wizard
- Submit button → Create resident and records

---

## Database Operations

### 1. Create Resident Record
**Table:** `residents`
**Fields:**
- name (UPPERCASE)
- birthday
- sex
- barangay
- vaccine_status (not_vaccinated / partially_vaccinated / fully_vaccinated)
- administered_date:
  - **NOT VACCINATED (First Timer):** current date (today)
  - **NOT VACCINATED (Missed Sessions):** current date (today)
  - **PARTIALLY VACCINATED:** current date (today)
  - **FULLY VACCINATED:** latest vaccine date from selected vaccines
- vaccines_given (array of vaccine names)
- missed_schedule_of_vaccine (empty array)
- status (pending)

### 2. Create Session Beneficiaries Records
**Table:** `session_beneficiaries`
**One record per vaccine**

**For NOT VACCINATED (First Timer or Missed Sessions):**
```
{
  session_id: selectedSession.sessionId,
  resident_id: newResidentId,
  attended: false,
  vaccinated: false,
  created_at: now
}
```
Note: Only ONE record created for the selected upcoming session

**For PARTIALLY VACCINATED - Past Vaccines:**
```
{
  session_id: null,  // No session link for manual vaccines
  resident_id: newResidentId,
  attended: true,    // Mark as attended for historical vaccines
  vaccinated: true,  // Mark as vaccinated
  created_at: vaccineDate
}
```
Note: One record per past vaccine

**For PARTIALLY VACCINATED - Upcoming Session (if selected):**
```
{
  session_id: selectedSession.sessionId,
  resident_id: newResidentId,
  attended: false,
  vaccinated: false,
  created_at: now
}
```
Note: Optional, only if user selects an upcoming session

**For FULLY VACCINATED:**
```
{
  session_id: null,  // No session link for manual vaccines
  resident_id: newResidentId,
  attended: true,    // Mark as attended for historical vaccines
  vaccinated: true,  // Mark as vaccinated
  created_at: vaccineDate
}
```
Note: One record per vaccine

---

## Validation Rules

### Step 1:
- ✅ All fields required
- ✅ Birthday must be in past
- ✅ Name not empty

### Step 2:
- ✅ Vaccine Status required
- ✅ At least one vaccine/session selected
- ✅ For manual vaccines: date must be in past
- ✅ For manual vaccines: vaccine name not empty
- ✅ No duplicate vaccines on same date

### Step 3:
- ✅ Display validation errors if any
- ✅ Allow editing before final submission

---

## Error Handling

### Scenarios:
1. **No sessions available** (NOT VACCINATED - First Timer)
   - Show message: "No current sessions available. Please create a session first."
   - Disable submit

2. **No past sessions available** (NOT VACCINATED - Missed Sessions)
   - Show message: "No past sessions available."
   - Disable submit

3. **Invalid date** (Manual vaccines)
   - Show error: "Date must be in the past"
   - Highlight field in red

4. **Duplicate vaccine on same date**
   - Show warning: "This vaccine is already added for this date"
   - Prevent adding

5. **API Error during creation**
   - Show toast error
   - Allow retrying

---

## UI/UX Flow

```
┌─────────────────────────────────────────┐
│         Add Resident Wizard             │
├─────────────────────────────────────────┤
│                                         │
│  Step 1: Basic Information              │
│  ├─ Full Name                           │
│  ├─ Birthday                            │
│  ├─ Sex                                 │
│  └─ Barangay (auto-filled)              │
│                                         │
│  [Cancel] [Next]                        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Add Resident Wizard             │
├─────────────────────────────────────────┤
│                                         │
│  Step 2: Vaccine Status                 │
│  ├─ Vaccine Status Dropdown             │
│  │                                      │
│  └─ [Dynamic Content Based on Status]   │
│     ├─ Popup (if NOT VACCINATED)        │
│     ├─ Session/Vaccine Selection        │
│     └─ Date Picker                      │
│                                         │
│  [Back] [Cancel] [Next]                 │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Add Resident Wizard             │
├─────────────────────────────────────────┤
│                                         │
│  Step 3: Review & Summary               │
│  ├─ Resident Information                │
│  ├─ Vaccine History Table               │
│  ├─ Session Beneficiaries Preview       │
│  │                                      │
│  [Back] [Cancel] [Submit]               │
└─────────────────────────────────────────┘
```

---

## Components to Create/Modify

### New Components:
1. **AddResidentWizard.jsx** - Main wizard container
2. **Step1BasicInfo.jsx** - Step 1 form
3. **Step2VaccineStatus.jsx** - Step 2 form with conditional rendering
4. **Step2NotVaccinatedPopup.jsx** - Popup for missed sessions question
5. **Step2SessionSelector.jsx** - Session selection component
6. **Step2VaccineSelector.jsx** - Vaccine selection component
7. **Step3ReviewSummary.jsx** - Review and summary screen

### Modified Components:
1. **Health_Worker/residents/page.jsx** - Replace "Add Resident" dialog with wizard
2. **Head_Nurse/residents/page.jsx** - Replace "Add Resident" dialog with wizard

### Components to Remove:
1. **Old "Add Resident" Dialog** - Remove from both residents pages
   - Remove the Dialog component with form fields (name, birthday, sex, etc.)
   - Remove the form submission handler `handleCreateResident`
   - Remove the state variables: `isAddDialogOpen`, `formData` (partially)
   - Keep only necessary state for wizard

---

## API Endpoints Used

### GET Endpoints:
- `GET /api/vaccination-sessions?status=Completed&barangay={barangayId}` - Past sessions
- `GET /api/vaccination-sessions?status=Scheduled,In progress&barangay={barangayId}` - Current/upcoming sessions
- `GET /api/vaccines` - List of all vaccines

### POST Endpoints:
- `POST /api/residents` - Create resident
- `POST /api/session-beneficiaries` - Create session beneficiary record (one per vaccine)

---

## Data Flow Summary

```
User Input (Step 1)
    ↓
User Input (Step 2 - Dynamic based on status)
    ↓
Review Screen (Step 3)
    ↓
Submit
    ├─ Create Resident Record
    ├─ Create Session Beneficiaries Records (1 per vaccine)
    └─ Success Toast & Close Wizard
```

---

## Implementation Priority

1. ✅ Create Step1BasicInfo component
2. ✅ Create Step2VaccineStatus component with conditional rendering
3. ✅ Create Step2NotVaccinatedPopup component
4. ✅ Create Step2SessionSelector component
5. ✅ Create Step2VaccineSelector component
6. ✅ Create Step3ReviewSummary component
7. ✅ Create AddResidentWizard main container
8. ✅ Integrate into Health_Worker/residents/page.jsx
9. ✅ Integrate into Head_Nurse/residents/page.jsx
10. ✅ Test all flows

---

## Notes

- All dates must be validated (past dates for historical, future for upcoming sessions)
- Vaccine names should be normalized (lowercase for consistency)
- Session beneficiaries records should be created atomically (all or nothing)
- Error messages should be user-friendly
- Loading states should be shown during API calls
- Toast notifications for success/error feedback
