# Add Resident Form - Complete Summary

## Form Fields Overview

### **Required Fields** (marked with *)
1. **Full Name** - Text input
2. **Birthday** - Date picker
3. **Sex** - Dropdown (Male/Female)
4. **Vaccination Date** - Date picker (administered_date)
5. **Barangay** - Dropdown (auto-set to Health Worker's assigned barangay)

### **Optional Fields** (no asterisk)
1. **Vaccine Status** - Dropdown (default: "Not Vaccinated")
   - Options: Not Vaccinated, Partially Vaccinated, Fully Vaccinated
   
2. **Vaccines Given** - Checkboxes (Optional)
   - Select vaccines that have been administered to this resident
   - Options: PENTA1, PENTA2, PCV1, PCV2, PCV3, MCV1, MCV2, OPV1, OPV2, IPV1, IPV2, MMR1, MMR2, TT1, TT2, Other
   - Can leave empty - no vaccines required
   
3. **Missed Schedule of Vaccine (Defaulters)** - Checkboxes (Optional)
   - Select vaccines that the resident missed during their scheduled vaccination dates
   - Same vaccine options as above
   - Can leave empty - no defaulters required

---

## Barangay Field Details

### Location in Form
- Position: After Vaccine Status field
- Type: Dropdown (Select)
- Status: **LOCKED** for Health Workers

### Behavior
- **For Health Workers**: 
  - Auto-populated with their assigned barangay
  - Field is DISABLED (cannot change)
  - Shows message: "Barangay is locked to your assignment: [BARANGAY_NAME]"
  
- **For Head Nurses** (if applicable):
  - Can select from all available barangays
  - Field is ENABLED

### Available Barangays
- Mancruz
- Alawihao
- Bibirao
- Calasgasan
- Camambugan
- Dogongan
- Magang
- Pamorangan
- Barangay II

---

## Vaccine Fields - Optional Clarification

### Vaccines Given (Optional)
- **Purpose**: Track which vaccines have been given to the resident
- **Required**: NO - Can leave unchecked
- **Multiple Selection**: YES - Can select multiple vaccines
- **Custom Option**: YES - "Other" option available with text input
- **Data Type**: Array of strings
- **Default**: Empty array []

### Missed Schedule of Vaccine (Optional)
- **Purpose**: Track which vaccines the resident missed during scheduled dates
- **Required**: NO - Can leave unchecked
- **Multiple Selection**: YES - Can select multiple vaccines
- **Custom Option**: YES - "Other" option available with text input
- **Data Type**: Array of strings
- **Default**: Empty array []

---

## Form Validation

### What Must Be Filled
```javascript
if (!formData.name || !formData.birthday || !formData.sex || 
    !formData.administered_date || !formData.barangay) {
  toast.error("Please fill in all required fields including Barangay");
  return;
}
```

### What Can Be Left Empty
- Vaccine Status (defaults to "not_vaccinated")
- Vaccines Given (defaults to [])
- Missed Schedule of Vaccine (defaults to [])

---

## Data Sent to API

### Payload Structure
```javascript
{
  name: "JOHN DOE",                    // Required - Uppercase
  birthday: "2020-01-15",              // Required - Date format
  sex: "Male",                         // Required - Normalized
  administered_date: "2025-12-05",     // Required - Date format
  vaccine_status: "not_vaccinated",    // Optional - Defaults if missing
  barangay: "Alawihao",                // Required - Health Worker's assigned
  vaccines_given: ["penta1"],          // Optional - Can be empty
  missed_schedule_of_vaccine: ["tt1"], // Optional - Can be empty
  barangay_id: "<uuid>",               // Auto-added - From user profile
  submitted_by: "<user_id>"            // Auto-added - From user profile
}
```

---

## Form Locations

### Add Resident Dialog
- **File**: `app/pages/Health_Worker/residents/page.jsx`
- **Lines**: 550-820 (approximate)
- **Trigger**: "Add Resident" button

### Edit Resident Dialog
- **File**: `app/pages/Health_Worker/residents/page.jsx`
- **Lines**: 880-1080 (approximate)
- **Trigger**: Edit icon in residents table

---

## Recent Updates

✅ **Added "(Optional)" labels** to vaccine fields for clarity
✅ **Added helper text** explaining what each vaccine field is for
✅ **Barangay field is visible** and clearly marked as locked for Health Workers
✅ **Vaccines are truly optional** - validation does not require them

---

## Summary

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| Full Name | ✅ Yes | Text | Converted to uppercase |
| Birthday | ✅ Yes | Date | Format: YYYY-MM-DD |
| Sex | ✅ Yes | Dropdown | Male/Female |
| Vaccination Date | ✅ Yes | Date | Format: YYYY-MM-DD |
| Barangay | ✅ Yes | Dropdown | Locked for Health Workers |
| Vaccine Status | ❌ No | Dropdown | Defaults to "not_vaccinated" |
| Vaccines Given | ❌ No | Checkboxes | Can be empty |
| Missed Schedule | ❌ No | Checkboxes | Can be empty |

✅ **All requirements met. Form is ready to use.**
