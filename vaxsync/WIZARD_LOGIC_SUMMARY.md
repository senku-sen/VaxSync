# Add Resident Wizard - Logic Summary

## Quick Reference

### administered_date Logic

```
NOT VACCINATED (First Timer):     administered_date = TODAY
NOT VACCINATED (Missed Sessions): administered_date = TODAY
PARTIALLY VACCINATED:             administered_date = TODAY
FULLY VACCINATED:                 administered_date = MAX(all vaccine dates)
```

### session_beneficiaries Creation

```
NOT VACCINATED (Any):
  - 1 record per selected session
  - attended: false, vaccinated: false
  - session_id: selected session ID

PARTIALLY VACCINATED:
  - 1 record per past vaccine (attended: true, vaccinated: true, session_id: null)
  - 1 record per upcoming session if selected (attended: false, vaccinated: false, session_id: selected)

FULLY VACCINATED:
  - 1 record per vaccine
  - attended: true, vaccinated: true
  - session_id: null
```

### Session Filtering

```
NOT VACCINATED - Missed Sessions:
  - Status: "Completed"
  - Barangay: matches resident's barangay
  - Date: in the past

NOT VACCINATED - First Timer:
  - Status: "Scheduled" OR "In progress"
  - Barangay: matches resident's barangay
  - Date: today or in future

PARTIALLY VACCINATED - Upcoming Session (optional):
  - Status: "Scheduled" OR "In progress"
  - Barangay: matches resident's barangay
  - Date: today or in future
```

### Vaccine Selection

```
PARTIALLY VACCINATED:
  - Past vaccines: manual entry with date picker (must be in past)
  - Upcoming session: optional selection

FULLY VACCINATED:
  - All vaccines: manual entry with date picker (must be in past)
  - No session selection
```

### Data Validation

```
Step 1:
  ✓ Name: required, not empty
  ✓ Birthday: required, must be in past
  ✓ Sex: required
  ✓ Barangay: required

Step 2:
  ✓ Vaccine Status: required
  ✓ At least 1 vaccine/session selected
  ✓ Vaccine date: must be in past
  ✓ Vaccine name: not empty
  ✓ No duplicate vaccines on same date

Step 3:
  ✓ Display validation errors if any
  ✓ Allow editing before submission
```

---

## Component Hierarchy

```
AddResidentWizard (Main Container)
├── Step 1: Step1BasicInfo
│   └── Form: Name, Birthday, Sex, Barangay
│
├── Step 2: Step2VaccineStatus
│   ├── Vaccine Status Dropdown
│   └── Conditional Rendering:
│       ├── NOT VACCINATED
│       │   ├── Step2NotVaccinatedPopup
│       │   │   └── "Did resident miss sessions?" → Yes/No
│       │   └── Step2SessionSelector
│       │       ├── Past sessions (if Yes)
│       │       └── Upcoming sessions (if No)
│       │
│       ├── PARTIALLY VACCINATED
│       │   ├── Step2VaccineSelector (Past vaccines)
│       │   └── Step2SessionSelector (Upcoming - optional)
│       │
│       └── FULLY VACCINATED
│           └── Step2VaccineSelector (All vaccines)
│
└── Step 3: Step3ReviewSummary
    ├── Resident Information
    ├── Vaccine History
    ├── Session Beneficiaries Preview
    └── Actions: Edit, Cancel, Submit
```

---

## State Management

```javascript
formData = {
  // Step 1
  name: string,
  birthday: date,
  sex: string,
  barangay: string,
  
  // Step 2
  vaccineStatus: 'not_vaccinated' | 'partially_vaccinated' | 'fully_vaccinated',
  missedSessions: boolean | null,  // Only for NOT VACCINATED
  selectedSession: object | null,   // For NOT VACCINATED
  selectedPastSessions: array,      // For NOT VACCINATED (missed)
  selectedVaccines: array,          // For PARTIALLY/FULLY VACCINATED
  selectedUpcomingSession: object | null,  // For PARTIALLY VACCINATED
}

// selectedVaccines structure:
[
  { vaccineName: string, vaccineDate: date },
  ...
]

// selectedSession structure:
{
  sessionId: string,
  vaccineName: string,
  sessionDate: date,
  barangayName: string
}
```

---

## API Calls Required

### 1. Fetch Past Sessions (NOT VACCINATED - Missed)
```
GET /api/vaccination-sessions?status=Completed&barangay={barangayName}
```

### 2. Fetch Upcoming Sessions (NOT VACCINATED - First Timer, PARTIALLY VACCINATED)
```
GET /api/vaccination-sessions?status=Scheduled,In progress&barangay={barangayName}
```

### 3. Fetch Vaccines List
```
GET /api/vaccines
```

### 4. Create Resident
```
POST /api/residents
Body: {
  name, birthday, sex, barangay,
  vaccine_status, administered_date,
  vaccines_given, missed_schedule_of_vaccine, status
}
Returns: { success: true, resident: { id, ... } }
```

### 5. Create Session Beneficiaries (Multiple calls - one per vaccine/session)
```
POST /api/session-beneficiaries
Body: { session_id, resident_id, attended, vaccinated }
Returns: { success: true, beneficiary: { id, ... } }
```

---

## Key Implementation Details

### 1. administered_date Calculation
```javascript
function getAdministeredDate(vaccineStatus, selectedVaccines) {
  if (vaccineStatus === 'fully_vaccinated') {
    // Get the latest (most recent) vaccine date
    const dates = selectedVaccines.map(v => new Date(v.vaccineDate));
    const latestDate = new Date(Math.max(...dates));
    return latestDate.toISOString().split('T')[0];
  }
  // For other statuses: today
  return new Date().toISOString().split('T')[0];
}
```

### 2. Session Beneficiaries Creation
```javascript
async function createSessionBeneficiaries(residentId, formData) {
  const records = [];
  
  if (formData.vaccineStatus === 'not_vaccinated') {
    records.push({
      session_id: formData.selectedSession.sessionId,
      resident_id: residentId,
      attended: false,
      vaccinated: false
    });
  } else if (formData.vaccineStatus === 'partially_vaccinated') {
    // Past vaccines
    formData.selectedVaccines.forEach(vaccine => {
      records.push({
        session_id: null,
        resident_id: residentId,
        attended: true,
        vaccinated: true
      });
    });
    // Upcoming session (if selected)
    if (formData.selectedUpcomingSession) {
      records.push({
        session_id: formData.selectedUpcomingSession.sessionId,
        resident_id: residentId,
        attended: false,
        vaccinated: false
      });
    }
  } else if (formData.vaccineStatus === 'fully_vaccinated') {
    formData.selectedVaccines.forEach(vaccine => {
      records.push({
        session_id: null,
        resident_id: residentId,
        attended: true,
        vaccinated: true
      });
    });
  }
  
  // Create all records
  for (const record of records) {
    await fetch('/api/session-beneficiaries', {
      method: 'POST',
      body: JSON.stringify(record)
    });
  }
}
```

### 3. Vaccine Name Normalization
```javascript
// Store as lowercase in database
const normalizedVaccines = selectedVaccines.map(v => ({
  ...v,
  vaccineName: v.vaccineName.toLowerCase()
}));
```

### 4. Date Validation
```javascript
function isDateInPast(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function isDateInFuture(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}
```

---

## Integration Points

### Remove from Residents Pages:
1. Old "Add Resident" Dialog component
2. `handleCreateResident` function
3. Related form state variables
4. Form submission logic

### Add to Residents Pages:
1. Import AddResidentWizard component
2. State: `isAddWizardOpen`
3. Button to open wizard
4. Render wizard component
5. Success callback to refresh data

---

## Error Scenarios

```
1. No sessions available
   → Show message: "No sessions available"
   → Disable submit

2. Invalid date (future date for past vaccines)
   → Show error: "Date must be in the past"
   → Highlight field

3. Duplicate vaccine on same date
   → Show warning: "Vaccine already added for this date"
   → Prevent adding

4. API error during creation
   → Show toast error
   → Allow retry

5. Missing required fields
   → Show inline errors
   → Highlight fields
   → Prevent moving to next step
```

---

## Success Flow

```
User fills Step 1 → Validates → Next
User fills Step 2 → Validates → Next
User reviews Step 3 → Submits
  ├─ Create resident record
  ├─ Create session_beneficiaries records
  ├─ Show success toast
  ├─ Close wizard
  └─ Refresh residents list
```

---

## Files to Create

1. ✅ `components/add-resident-wizard/AddResidentWizard.jsx`
2. ✅ `components/add-resident-wizard/Step1BasicInfo.jsx`
3. ✅ `components/add-resident-wizard/Step2VaccineStatus.jsx`
4. ✅ `components/add-resident-wizard/Step2NotVaccinatedPopup.jsx`
5. ✅ `components/add-resident-wizard/Step2SessionSelector.jsx`
6. ✅ `components/add-resident-wizard/Step2VaccineSelector.jsx`
7. ✅ `components/add-resident-wizard/Step3ReviewSummary.jsx`

## Files to Modify

1. ✅ `app/pages/Health_Worker/residents/page.jsx`
2. ✅ `app/pages/Head_Nurse/residents/page.jsx`

## Files to Remove Code From

1. Old "Add Resident" Dialog from residents pages
