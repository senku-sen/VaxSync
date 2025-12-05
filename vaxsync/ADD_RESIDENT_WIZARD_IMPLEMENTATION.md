# Add Resident Wizard - Implementation Guide

## Overview
This guide provides the step-by-step implementation of the multi-step Add Resident Wizard with intelligent vaccine history management.

---

## File Structure

```
components/
├── add-resident-wizard/
│   ├── AddResidentWizard.jsx          (Main container)
│   ├── Step1BasicInfo.jsx              (Step 1 form)
│   ├── Step2VaccineStatus.jsx          (Step 2 main component)
│   ├── Step2NotVaccinatedPopup.jsx     (Missed sessions popup)
│   ├── Step2SessionSelector.jsx        (Session selection)
│   ├── Step2VaccineSelector.jsx        (Vaccine selection)
│   └── Step3ReviewSummary.jsx          (Review screen)
```

---

## Implementation Steps

### 1. Create AddResidentWizard.jsx (Main Container)

**Purpose:** Manage wizard state, navigation, and API calls

**Key Features:**
- Track current step (1, 2, 3)
- Store form data across steps
- Handle navigation (Next, Back, Cancel)
- Submit data to API
- Show loading/error states

**State Variables:**
```javascript
const [currentStep, setCurrentStep] = useState(1);
const [formData, setFormData] = useState({
  // Step 1
  name: '',
  birthday: '',
  sex: '',
  barangay: '',
  
  // Step 2
  vaccineStatus: '',
  missedSessions: null,  // true/false for NOT VACCINATED
  selectedSession: null,  // For NOT VACCINATED (first timer)
  selectedPastSessions: [],  // For NOT VACCINATED (missed)
  selectedVaccines: [],  // For PARTIALLY/FULLY VACCINATED
  selectedUpcomingSession: null,  // For PARTIALLY VACCINATED
});
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
```

**Methods:**
- `handleNext()` - Validate current step and move to next
- `handleBack()` - Go to previous step
- `handleCancel()` - Close wizard
- `handleSubmit()` - Create resident and session beneficiaries
- `updateFormData(field, value)` - Update form data

---

### 2. Create Step1BasicInfo.jsx

**Purpose:** Collect resident's basic information

**Props:**
```javascript
{
  formData,
  onFormDataChange,
  onNext,
  onCancel,
  selectedBarangay,  // Pre-filled for Health Worker
  isLoading
}
```

**Form Fields:**
- Full Name (text input, required)
- Birthday (date picker, required, must be in past)
- Sex (dropdown: Male/Female, required)
- Barangay (dropdown, required, auto-filled for Health Worker)

**Validation:**
- All fields required
- Birthday must be in past
- Show error messages for invalid fields

**UI:**
- Card layout with form fields
- Cancel and Next buttons
- Progress indicator (Step 1 of 3)

---

### 3. Create Step2VaccineStatus.jsx

**Purpose:** Manage vaccine status selection and conditional rendering

**Props:**
```javascript
{
  formData,
  onFormDataChange,
  onNext,
  onBack,
  onCancel,
  selectedBarangay,
  isLoading
}
```

**Logic:**
- Render vaccine status dropdown
- Based on selection, render conditional component:
  - NOT VACCINATED → Step2NotVaccinatedPopup
  - PARTIALLY VACCINATED → Step2VaccineSelector + Step2SessionSelector
  - FULLY VACCINATED → Step2VaccineSelector

**UI:**
- Card layout
- Vaccine Status dropdown
- Conditional component below
- Back, Cancel, Next buttons
- Progress indicator (Step 2 of 3)

---

### 4. Create Step2NotVaccinatedPopup.jsx

**Purpose:** Ask if resident missed sessions

**Props:**
```javascript
{
  formData,
  onFormDataChange,
  selectedBarangay,
  isLoading
}
```

**UI:**
- Modal/Alert asking: "Did this resident miss a vaccination session?"
- Two buttons: "Yes, Missed Sessions" and "No, First Timer"

**Logic:**
- If YES → Show Step2SessionSelector with past sessions
- If NO → Show Step2SessionSelector with upcoming sessions

---

### 5. Create Step2SessionSelector.jsx

**Purpose:** Display and select vaccination sessions

**Props:**
```javascript
{
  sessionType,  // 'past' or 'upcoming'
  selectedBarangay,
  formData,
  onFormDataChange,
  isLoading
}
```

**Features:**
- Fetch sessions based on type
- Display sessions in list/table format
- Show: Session Name, Date, Vaccine Type, Barangay
- Allow selecting one session
- Show loading state while fetching
- Show error if no sessions available

**API Call:**
```javascript
// For past sessions (NOT VACCINATED - Missed)
GET /api/vaccination-sessions?status=Completed&barangay={barangayId}

// For upcoming sessions (NOT VACCINATED - First Timer)
GET /api/vaccination-sessions?status=Scheduled,In progress&barangay={barangayId}
```

**UI:**
- Session list with radio buttons for selection
- Session details (name, date, vaccine, barangay)
- Selected session highlighted
- Loading spinner
- Error message if no sessions

---

### 6. Create Step2VaccineSelector.jsx

**Purpose:** Select and manage vaccines with dates

**Props:**
```javascript
{
  vaccineStatus,  // 'partially_vaccinated' or 'fully_vaccinated'
  formData,
  onFormDataChange,
  isLoading
}
```

**Features:**
- Display vaccine selection interface
- Option 1: Select from vaccine list (dropdown)
- Option 2: Manual entry (text input)
- For each vaccine: date picker (must be in past)
- Add/Remove vaccine buttons
- Show selected vaccines in table

**API Call:**
```javascript
GET /api/vaccines  // Fetch available vaccines
```

**Validation:**
- Vaccine name not empty
- Date must be in past
- No duplicate vaccines on same date

**UI:**
- Vaccine dropdown + date picker + Add button
- Manual entry input + Add button
- Table showing selected vaccines with Edit/Delete buttons
- Loading spinner
- Error messages for validation

---

### 7. Create Step3ReviewSummary.jsx

**Purpose:** Review all data before submission

**Props:**
```javascript
{
  formData,
  onBack,
  onCancel,
  onSubmit,
  isLoading
}
```

**Display Sections:**

#### Section 1: Resident Information
- Full Name
- Birthday (formatted MM/DD/YYYY)
- Sex
- Barangay
- Vaccine Status

#### Section 2: Vaccine History
**For NOT VACCINATED (First Timer):**
- Session Name
- Session Date
- Vaccine Type
- Note: "Will be added to session with 'Not Attended' status"

**For NOT VACCINATED (Missed) / PARTIALLY VACCINATED / FULLY VACCINATED:**
- Table: Vaccine Name | Vaccination Date | Edit | Delete

#### Section 3: Session Beneficiaries Preview
- Table showing what will be created:
  - Vaccine Name
  - Date
  - Session (if applicable)
  - Status (Attended: No/Yes, Vaccinated: No/Yes)

**Actions:**
- Edit button → Go back to Step 2
- Cancel button → Close wizard
- Submit button → Create resident and records

**UI:**
- Card layout with sections
- Summary tables
- Edit/Cancel/Submit buttons
- Loading spinner during submission
- Success/Error messages

---

## API Integration

### Required Endpoints

#### 1. GET /api/vaccination-sessions
**Query Parameters:**
- `status` - "Completed" or "Scheduled,In progress"
- `barangay` - Barangay name or ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "session-id",
      "name": "Session Name",
      "vaccine_id": "vaccine-id",
      "vaccine_name": "Vaccine Name",
      "date": "2025-12-15",
      "status": "Completed",
      "barangay": "Barangay Name"
    }
  ]
}
```

#### 2. GET /api/vaccines
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "vaccine-id",
      "name": "Vaccine Name"
    }
  ]
}
```

#### 3. POST /api/residents
**Body:**
```json
{
  "name": "RESIDENT NAME",
  "birthday": "2020-01-15",
  "sex": "Male",
  "barangay": "Barangay Name",
  "vaccine_status": "not_vaccinated",
  "administered_date": "2025-12-06",
  "vaccines_given": ["Vaccine1", "Vaccine2"],
  "missed_schedule_of_vaccine": [],
  "status": "pending"
}
```

**Response:**
```json
{
  "success": true,
  "resident": {
    "id": "resident-id",
    "name": "RESIDENT NAME",
    ...
  }
}
```

#### 4. POST /api/session-beneficiaries
**Body:**
```json
{
  "session_id": "session-id" or null,
  "resident_id": "resident-id",
  "attended": false,
  "vaccinated": false
}
```

**Response:**
```json
{
  "success": true,
  "beneficiary": {
    "id": "beneficiary-id",
    ...
  }
}
```

---

## Data Flow

```
Step 1: Collect Basic Info
    ↓
Step 2: Select Vaccine Status
    ├─ NOT VACCINATED
    │   ├─ Missed Sessions? YES
    │   │   └─ Select past sessions
    │   └─ Missed Sessions? NO
    │       └─ Select upcoming session
    ├─ PARTIALLY VACCINATED
    │   ├─ Select/enter past vaccines with dates
    │   └─ Optionally select upcoming session
    └─ FULLY VACCINATED
        └─ Select/enter all vaccines with dates
    ↓
Step 3: Review & Summary
    ├─ Display all collected data
    ├─ Show session beneficiaries preview
    └─ Allow editing or submission
    ↓
Submit
    ├─ Create resident record
    ├─ Create session_beneficiaries records (1 per vaccine)
    └─ Success notification & close wizard
```

---

## Submission Logic

### Step 1: Create Resident Record

```javascript
const residentData = {
  name: formData.name.toUpperCase(),
  birthday: formData.birthday,
  sex: formData.sex,
  barangay: formData.barangay,
  vaccine_status: formData.vaccineStatus,
  administered_date: getAdministeredDate(),  // Logic below
  vaccines_given: formData.selectedVaccines.map(v => v.vaccineName),
  missed_schedule_of_vaccine: [],
  status: 'pending'
};

// administered_date logic:
function getAdministeredDate() {
  if (formData.vaccineStatus === 'fully_vaccinated') {
    // Latest vaccine date
    return formData.selectedVaccines.reduce((latest, v) => 
      new Date(v.vaccineDate) > new Date(latest) ? v.vaccineDate : latest
    );
  }
  // For other statuses: today
  return new Date().toISOString().split('T')[0];
}
```

### Step 2: Create Session Beneficiaries Records

```javascript
const beneficiaryRecords = [];

// For NOT VACCINATED (First Timer or Missed)
if (formData.vaccineStatus === 'not_vaccinated') {
  beneficiaryRecords.push({
    session_id: formData.selectedSession.sessionId,
    resident_id: newResidentId,
    attended: false,
    vaccinated: false
  });
}

// For PARTIALLY VACCINATED - Past vaccines
if (formData.vaccineStatus === 'partially_vaccinated') {
  formData.selectedVaccines.forEach(vaccine => {
    beneficiaryRecords.push({
      session_id: null,
      resident_id: newResidentId,
      attended: true,
      vaccinated: true
    });
  });
  
  // If upcoming session selected
  if (formData.selectedUpcomingSession) {
    beneficiaryRecords.push({
      session_id: formData.selectedUpcomingSession.sessionId,
      resident_id: newResidentId,
      attended: false,
      vaccinated: false
    });
  }
}

// For FULLY VACCINATED
if (formData.vaccineStatus === 'fully_vaccinated') {
  formData.selectedVaccines.forEach(vaccine => {
    beneficiaryRecords.push({
      session_id: null,
      resident_id: newResidentId,
      attended: true,
      vaccinated: true
    });
  });
}

// Create all records
for (const record of beneficiaryRecords) {
  await createSessionBeneficiary(record);
}
```

---

## Integration with Residents Pages

### Health_Worker/residents/page.jsx

**Remove:**
- Old "Add Resident" Dialog component
- `handleCreateResident` function
- Related state variables

**Add:**
- Import AddResidentWizard component
- State for wizard visibility: `const [isAddWizardOpen, setIsAddWizardOpen] = useState(false);`
- Replace "Add Resident" button to open wizard
- Render wizard component

**Code:**
```javascript
import AddResidentWizard from "../../../../components/add-resident-wizard/AddResidentWizard";

// In component:
const [isAddWizardOpen, setIsAddWizardOpen] = useState(false);

// Replace old button:
<Button 
  onClick={() => setIsAddWizardOpen(true)}
>
  <Plus className="mr-2 h-4 w-4" />
  Add Resident
</Button>

// Add wizard component:
{isAddWizardOpen && (
  <AddResidentWizard
    isOpen={isAddWizardOpen}
    onClose={() => setIsAddWizardOpen(false)}
    selectedBarangay={selectedBarangay}
    onSuccess={() => {
      fetchResidents(activeTab);
      fetchCounts();
      setIsAddWizardOpen(false);
    }}
  />
)}
```

### Head_Nurse/residents/page.jsx

**Same as Health Worker page**

---

## Error Handling

### Validation Errors
- Show inline error messages below fields
- Highlight invalid fields in red
- Prevent moving to next step

### API Errors
- Show toast error notification
- Log error to console
- Allow retrying submission

### Network Errors
- Show user-friendly error message
- Suggest checking internet connection
- Allow retrying

---

## Testing Checklist

- [ ] Step 1: Validate all fields required
- [ ] Step 1: Validate birthday must be in past
- [ ] Step 2: NOT VACCINATED - First Timer flow
- [ ] Step 2: NOT VACCINATED - Missed Sessions flow
- [ ] Step 2: PARTIALLY VACCINATED flow
- [ ] Step 2: FULLY VACCINATED flow
- [ ] Step 3: Review all data correctly displayed
- [ ] Step 3: Edit button goes back to Step 2
- [ ] Submit: Resident created correctly
- [ ] Submit: Session beneficiaries created correctly
- [ ] Submit: Resident appears in session participants
- [ ] Submit: administered_date set correctly for FULLY VACCINATED
- [ ] Navigation: Back button works correctly
- [ ] Navigation: Cancel button closes wizard
- [ ] Error handling: Show errors for invalid data
- [ ] Loading states: Show spinner during API calls

---

## Notes

- All vaccine names should be normalized to lowercase in database
- Dates should be validated on both client and server
- Session beneficiaries should be created atomically (all or nothing)
- Consider adding a confirmation dialog before final submission
- Add success toast notification after resident creation
- Refresh residents list after successful creation
