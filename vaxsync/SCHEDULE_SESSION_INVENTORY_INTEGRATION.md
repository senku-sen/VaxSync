# Schedule Session - Inventory Integration

## Changes Made

Updated `ScheduleSessionModal.jsx` to integrate with barangay vaccine inventory.

---

## Features

### 1. Vaccine Dropdown - Only Shows Vaccines with Inventory

**Before:**
- Showed ALL vaccines from master list
- No indication of availability
- Could schedule vaccines not in stock

**After:**
- ✅ Only shows vaccines that have inventory in barangay
- ✅ Shows available quantity next to vaccine name
- ✅ Shows "No vaccines in inventory" if none available

**Example:**
```
Select vaccine
├── Vaccine A (10 vials available)
├── Vaccine B (5 vials available)
└── Vaccine C (not shown - no inventory)
```

### 2. Target Field - Shows Max Quantity

**Before:**
- Placeholder: "Enter target number"
- No indication of max
- Could enter more than available

**After:**
- ✅ Placeholder shows: "Max: 10 vials"
- ✅ Disabled until vaccine selected
- ✅ Max attribute prevents over-entry
- ✅ Shows "Select vaccine first" when no vaccine selected

**Example:**
```
Before vaccine selected:
Placeholder: "Select vaccine first"
Status: Disabled (grayed out)

After vaccine selected:
Placeholder: "Max: 10 vials"
Status: Enabled
Max value: 10
```

---

## How It Works

### Data Flow

```
Component Loads
    ↓
barangayId provided
    ↓
Fetch inventory for barangay
    ↓
Filter vaccines to only those with inventory
    ↓
Add availableQuantity to each vaccine
    ↓
Display in dropdown with quantity
    ↓
User selects vaccine
    ↓
Validate vaccine
    ↓
Show max in Target placeholder
    ↓
User enters target (up to max)
    ↓
Submit
```

### Code Structure

**1. Load Vaccines with Inventory**
```javascript
useEffect(() => {
  // Fetch barangay inventory
  // Filter vaccines that have inventory
  // Map quantity to each vaccine
  // Set vaccinesWithInventory state
}, [barangayId, vaccines]);
```

**2. Validate Selected Vaccine**
```javascript
useEffect(() => {
  // Check vaccine exists
  // Check vaccine not expired
  // Check vaccine has inventory
  // Set availableQuantity
}, [formData.vaccine_id, barangayId]);
```

**3. Display Vaccine Options**
```javascript
{vaccinesWithInventory.map((vaccine) => (
  <option value={vaccine.id}>
    {vaccine.name} ({vaccine.availableQuantity} vials available)
  </option>
))}
```

**4. Display Target Placeholder**
```javascript
placeholder={
  vaccineInventory.isValid 
    ? `Max: ${vaccineInventory.availableQuantity} vials` 
    : 'Select vaccine first'
}
```

---

## User Experience

### Scenario 1: No Inventory

```
Modal opens
    ↓
Vaccine dropdown shows: "No vaccines in inventory"
    ↓
Target field: Disabled, placeholder "Select vaccine first"
    ↓
Can't schedule (no vaccines available)
```

### Scenario 2: Vaccines Available

```
Modal opens
    ↓
Vaccine dropdown shows:
  - Vaccine A (10 vials available)
  - Vaccine B (5 vials available)
    ↓
User selects Vaccine A
    ↓
Target field: Enabled, placeholder "Max: 10 vials"
    ↓
User enters 8
    ↓
Schedule session
    ↓
Inventory deducted: 10 → 2
```

### Scenario 3: User Tries to Over-Schedule

```
Vaccine A has 10 vials
    ↓
User tries to enter 15
    ↓
HTML max attribute prevents it
    ↓
Can only enter up to 10
```

---

## Technical Details

### New State Variables

```javascript
// Vaccines with inventory in barangay
const [vaccinesWithInventory, setVaccinesWithInventory] = useState([]);
```

### New Imports

```javascript
import { fetchBarangayVaccineInventory } from "@/lib/barangayVaccineInventory";
```

### New useEffect

Loads vaccines with inventory when barangay changes:
```javascript
useEffect(() => {
  // Fetch inventory
  // Filter vaccines
  // Set vaccinesWithInventory
}, [barangayId, vaccines]);
```

### Updated Vaccine Dropdown

- Uses `vaccinesWithInventory` instead of `vaccines`
- Shows available quantity in option text
- Shows "No vaccines in inventory" when empty

### Updated Target Field

- Placeholder shows max quantity
- Disabled until vaccine selected
- Max attribute prevents over-entry
- Grayed out styling when disabled

---

## Benefits

✅ **Prevents Over-Scheduling** - Can't schedule more than available
✅ **Clear Availability** - Users see what's in stock
✅ **Better UX** - Placeholder shows max quantity
✅ **Inventory Protection** - Only vaccines with stock shown
✅ **Automatic Filtering** - No manual selection needed
✅ **Real-Time Updates** - Reflects current inventory

---

## Testing Scenarios

### Test 1: No Inventory
- Barangay has no vaccine inventory
- Expected: Dropdown shows "No vaccines in inventory"
- Expected: Target field disabled

### Test 2: Multiple Vaccines
- Barangay has 3 vaccines with different quantities
- Expected: All 3 shown with quantities
- Expected: Can select any one

### Test 3: Select Vaccine
- User selects vaccine with 10 vials
- Expected: Target placeholder shows "Max: 10 vials"
- Expected: Target field enabled

### Test 4: Over-Schedule Prevention
- User tries to enter 15 when max is 10
- Expected: HTML prevents entry above 10
- Expected: Can only enter up to 10

### Test 5: Schedule Session
- User schedules with 8 vials
- Expected: Session created
- Expected: Inventory deducted (10 → 2)

---

## Related Files

- `/lib/barangayVaccineInventory.js` - Inventory functions
- `/lib/vaccineRequestValidation.js` - Validation functions
- `/BARANGAY_VACCINE_INVENTORY_SCHEMA.md` - Database schema
- `/VACCINE_REQUEST_VS_SCHEDULE_VALIDATION.md` - Validation guide

---

## Future Enhancements

- [ ] Show inventory status per vaccine (low stock warning)
- [ ] Add "Request More" button if low stock
- [ ] Show batch number and expiry date
- [ ] Add vaccine history/usage stats
- [ ] Add inventory alerts
