# Vaccine Request to Inventory Automation

## Overview

When a vaccine request is **approved**, it automatically gets added to the **barangay vaccine inventory**. No manual step needed!

---

## How It Works

### Automatic Flow

```
Head Nurse approves vaccine request
    ↓
updateVaccineRequestStatus(requestId, 'approved')
    ↓
System fetches request details:
  - vaccine_id
  - barangay_id
  - quantity_vial
  - quantity_dose
    ↓
System fetches vaccine details:
  - batch_number
  - expiry_date
    ↓
System automatically adds to barangay_vaccine_inventory:
  - barangay_id
  - vaccine_id
  - quantity_vial
  - quantity_dose
  - batch_number
  - expiry_date
  - notes: "Auto-added from approved request #[requestId]"
    ↓
Inventory record created
    ↓
Returns: { success: true, inventoryAdded: true }
```

---

## Files Involved

### 1. `/lib/vaccineRequestToInventory.js` (NEW)
Handles the automation logic.

**Key Functions:**
- `addApprovedRequestToInventory()` - Adds request to inventory
- `approveVaccineRequestAndAddToInventory()` - Approves + adds in one call
- `batchApproveAndAddToInventory()` - Batch approve multiple requests

### 2. `/lib/vaccineRequest.js` (UPDATED)
Updated `updateVaccineRequestStatus()` to trigger automation.

**Changes:**
- Imports `addApprovedRequestToInventory`
- When status = "approved", automatically adds to inventory
- Returns `inventoryAdded` flag in response

### 3. `/lib/barangayVaccineInventory.js`
Provides inventory management functions (unchanged).

---

## Usage Examples

### Example 1: Approve Request (Automatic Inventory Add)

```javascript
import { updateVaccineRequestStatus } from '@/lib/vaccineRequest';

// Head Nurse approves request
const result = await updateVaccineRequestStatus(requestId, 'approved');

if (result.success) {
  console.log('Request approved');
  if (result.inventoryAdded) {
    console.log('✅ Automatically added to inventory');
  } else {
    console.log('⚠️ Request approved but inventory add failed');
  }
} else {
  console.error('Failed to approve:', result.error);
}
```

### Example 2: Manual Approval + Inventory Add

```javascript
import { approveVaccineRequestAndAddToInventory } from '@/lib/vaccineRequestToInventory';

const result = await approveVaccineRequestAndAddToInventory(requestId);

if (result.success) {
  console.log('Request approved and added to inventory');
} else {
  console.error('Failed:', result.error);
}
```

### Example 3: Batch Approve Multiple Requests

```javascript
import { batchApproveAndAddToInventory } from '@/lib/vaccineRequestToInventory';

const requestIds = ['req-1', 'req-2', 'req-3'];
const results = await batchApproveAndAddToInventory(requestIds);

console.log(`Approved: ${results.successCount}`);
console.log(`Failed: ${results.failureCount}`);
if (results.errors.length > 0) {
  console.log('Errors:', results.errors);
}
```

---

## Data Flow

### Request Approval Process

```
vaccine_requests table
├── id: "req-123"
├── vaccine_id: "vac-456"
├── barangay_id: "bar-789"
├── quantity_vial: 10
├── quantity_dose: 100
├── status: "pending"
└── ...

    ↓ (Head Nurse clicks Approve)

updateVaccineRequestStatus(requestId, 'approved')
    ↓
Fetch request details
    ↓
Fetch vaccine details (batch_number, expiry_date)
    ↓
Update vaccine_requests.status = 'approved'
    ↓
Insert into barangay_vaccine_inventory:
├── barangay_id: "bar-789"
├── vaccine_id: "vac-456"
├── quantity_vial: 10
├── quantity_dose: 100
├── batch_number: "BATCH123"
├── expiry_date: "2026-06-30"
├── notes: "Auto-added from approved request #req-123"
└── received_date: now()

    ↓

barangay_vaccine_inventory table
├── id: "inv-999"
├── barangay_id: "bar-789"
├── vaccine_id: "vac-456"
├── quantity_vial: 10
├── quantity_dose: 100
├── batch_number: "BATCH123"
├── expiry_date: "2026-06-30"
└── ...
```

---

## Key Features

✅ **Automatic** - No manual step needed
✅ **Atomic** - Request and inventory are linked
✅ **Traceable** - Notes show which request created inventory
✅ **Batch Support** - Approve multiple requests at once
✅ **Error Handling** - Graceful failures, doesn't block approval
✅ **Audit Trail** - Timestamps and notes for tracking

---

## Error Handling

### Scenario 1: Request Not Found
```javascript
const result = await updateVaccineRequestStatus(invalidId, 'approved');
// Returns: { success: false, error: 'Could not fetch request details', inventoryAdded: false }
```

### Scenario 2: Inventory Add Fails
```javascript
// Request is approved, but inventory add fails
const result = await updateVaccineRequestStatus(requestId, 'approved');
// Returns: { success: true, error: null, inventoryAdded: false }
// ⚠️ Request approved but inventory not added
```

### Scenario 3: Success
```javascript
const result = await updateVaccineRequestStatus(requestId, 'approved');
// Returns: { success: true, error: null, inventoryAdded: true }
// ✅ Request approved and inventory added
```

---

## Database Requirements

### Required Tables
- `vaccine_requests` - Must have: vaccine_id, barangay_id, quantity_vial, quantity_dose
- `vaccines` - Must have: batch_number, expiry_date
- `barangay_vaccine_inventory` - Must exist (see BARANGAY_VACCINE_INVENTORY_SCHEMA.md)

### Required RLS Policies
- Head Nurse can UPDATE vaccine_requests
- Head Nurse can INSERT barangay_vaccine_inventory
- See RLS_POLICIES.md for complete setup

---

## Implementation Checklist

- [ ] Create `barangay_vaccine_inventory` table
- [ ] Enable RLS on table
- [ ] Create RLS policies
- [ ] Import `vaccineRequestToInventory.js` functions
- [ ] Test vaccine request approval
- [ ] Verify inventory is created
- [ ] Check batch numbers and expiry dates
- [ ] Test batch approval
- [ ] Test error scenarios
- [ ] Monitor console logs

---

## Monitoring & Debugging

### Check Console Logs

When approving a request, you'll see:
```
Updating request status: req-123 to approved
Fetching request details...
Status is approved, adding to inventory...
Adding approved vaccine request to inventory: {...}
Successfully added to inventory: inv-999
```

### Verify Inventory Created

```javascript
import { fetchBarangayVaccineInventory } from '@/lib/barangayVaccineInventory';

const { data } = await fetchBarangayVaccineInventory(barangayId);
console.log('Inventory items:', data);
// Should show the newly added item
```

### Check Request Notes

```javascript
// In barangay_vaccine_inventory table
// notes field shows: "Auto-added from approved request #req-123"
```

---

## Limitations & Notes

1. **Inventory Add Failure** - If inventory add fails, request is still approved
   - Solution: Check console logs and manually add if needed

2. **Batch Number & Expiry** - Taken from vaccine master record
   - Solution: Update vaccine master if batch/expiry changes

3. **Quantity Validation** - No validation on quantity limits
   - Solution: Add validation in UI if needed

4. **Duplicate Prevention** - No check for duplicate inventory entries
   - Solution: Manually check before approving if needed

---

## Future Enhancements

- [ ] Prevent duplicate inventory entries
- [ ] Add quantity validation
- [ ] Notify Health Worker when inventory added
- [ ] Add "Reject" status handling
- [ ] Add "Release" status handling
- [ ] Create inventory audit log
- [ ] Add inventory reconciliation reports

---

## Related Documentation

- `BARANGAY_VACCINE_INVENTORY_SCHEMA.md` - Database schema
- `VACCINE_REQUEST_VALIDATION_GUIDE.md` - Request validation
- `vaccineRequestValidation.js` - Validation functions
- `barangayVaccineInventory.js` - Inventory functions
