# Quick Reference: Vaccine Request → Inventory Flow

## The Complete Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ HEALTH WORKER: SUBMITS VACCINE REQUEST                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        1. Opens "New Request" modal
        2. Selects vaccine from dropdown
        3. System validates vaccine:
           ✅ Vaccine exists (vaccine.id)
           ✅ Has approved requests
           ✅ Not expired
        4. Shows max quantity_vial
        5. Enters quantity_dose and quantity_vial
        6. System validates quantities
        7. Submits request
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE: vaccine_requests table                                 │
│ ├── id: "req-123"                                               │
│ ├── vaccine_id: "vac-456"                                       │
│ ├── barangay_id: "bar-789"                                      │
│ ├── quantity_vial: 10                                           │
│ ├── quantity_dose: 100                                          │
│ ├── status: "pending" ← INITIAL STATUS                          │
│ └── ...                                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ HEAD NURSE: APPROVES REQUEST                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        1. Views vaccine requests list
        2. Clicks "Approve" button
        3. System calls updateVaccineRequestStatus()
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ AUTOMATIC PROCESS (NO MANUAL STEP!)                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        1. Fetch request details:
           - vaccine_id: "vac-456"
           - barangay_id: "bar-789"
           - quantity_vial: 10
           - quantity_dose: 100
                              ↓
        2. Fetch vaccine details:
           - batch_number: "BATCH123"
           - expiry_date: "2026-06-30"
                              ↓
        3. Update vaccine_requests status:
           status: "pending" → "approved"
                              ↓
        4. Create inventory record:
           INSERT INTO barangay_vaccine_inventory
           - barangay_id: "bar-789"
           - vaccine_id: "vac-456"
           - quantity_vial: 10
           - quantity_dose: 100
           - batch_number: "BATCH123"
           - expiry_date: "2026-06-30"
           - notes: "Auto-added from approved request #req-123"
           - received_date: NOW()
                              ↓
        5. Return result:
           { success: true, inventoryAdded: true }
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE: barangay_vaccine_inventory table                       │
│ ├── id: "inv-999"                                               │
│ ├── barangay_id: "bar-789"                                      │
│ ├── vaccine_id: "vac-456"                                       │
│ ├── quantity_vial: 10                                           │
│ ├── quantity_dose: 100                                          │
│ ├── batch_number: "BATCH123"                                    │
│ ├── expiry_date: "2026-06-30"                                   │
│ ├── notes: "Auto-added from approved request #req-123"          │
│ ├── received_date: "2025-11-19T19:59:00Z"                       │
│ └── ...                                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ HEALTH WORKER: USES VACCINE FROM INVENTORY                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        1. Views barangay inventory
        2. Sees: "10 vials of Vaccine X available"
        3. Creates vaccination session
        4. Administers vaccines
        5. Updates session: "2 vials used"
                              ↓
        System deducts from inventory:
        quantity_vial: 10 → 8
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE: barangay_vaccine_inventory table (UPDATED)            │
│ ├── id: "inv-999"                                               │
│ ├── quantity_vial: 8 ← UPDATED                                  │
│ ├── quantity_dose: 80 ← UPDATED                                 │
│ ├── updated_at: "2025-11-19T20:30:00Z" ← UPDATED               │
│ └── ...                                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Points

### ✅ Automatic
- No manual step to add to inventory
- Happens when request is approved
- Transparent to user

### ✅ Traceable
- Notes show which request created inventory
- Timestamps track all changes
- Audit trail for compliance

### ✅ Complete
- Batch numbers tracked
- Expiry dates tracked
- Quantities tracked (vials + doses)

### ✅ Smart
- Validates vaccine before submission
- Shows max quantities
- Prevents invalid requests
- Low stock alerts

---

## Code Examples

### Approve Request (Automatic Inventory Add)
```javascript
const result = await updateVaccineRequestStatus(requestId, 'approved');
// Returns: { success: true, inventoryAdded: true }
// ✅ Request approved AND inventory created automatically
```

### Check Inventory
```javascript
const { data } = await fetchBarangayVaccineInventory(barangayId);
// Shows all vaccines in barangay with quantities
```

### Use Vaccine
```javascript
const { success } = await deductBarangayVaccineInventory(
  barangayId,
  vaccineId,
  1  // 1 vial used
);
// Inventory automatically updated
```

---

## Status Progression

```
Request Created
    ↓
Status: pending
    ↓
Head Nurse Approves
    ↓
Status: approved → Inventory Created ✅
    ↓
Health Worker Uses Vaccine
    ↓
Inventory Deducted ✅
    ↓
Low Stock Alert (if < 5 vials)
    ↓
Request New Vaccine
    ↓
Cycle Repeats
```

---

## Files to Know

| File | Purpose |
|------|---------|
| `vaccineRequestValidation.js` | Validate vaccine before submission |
| `barangayVaccineInventory.js` | Manage inventory (add, deduct, check) |
| `vaccineRequestToInventory.js` | Automate request → inventory |
| `VaccineRequestModal.jsx` | UI for submitting requests |
| `vaccineRequest.js` | Core request logic (triggers automation) |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `vaccine_requests` | Track requests (pending → approved) |
| `barangay_vaccine_inventory` | Track stock per barangay |
| `vaccines` | Master vaccine data (batch, expiry) |
| `barangays` | Barangay information |

---

## Testing Checklist

- [ ] Submit vaccine request
- [ ] Verify request shows as "pending"
- [ ] Approve request as Head Nurse
- [ ] Check console: "Successfully added to inventory"
- [ ] Query inventory table: see new record
- [ ] Verify batch_number and expiry_date
- [ ] Check notes: shows request reference
- [ ] Use vaccine in session
- [ ] Verify inventory deducted
- [ ] Check low stock alert

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Inventory not created | Check console logs, verify RLS policies |
| Batch number missing | Update vaccine master record |
| Expiry date wrong | Update vaccine master record |
| Inventory not deducting | Check RLS policies, verify vaccine_id |
| Low stock not alerting | Check threshold value (default: 5) |

---

## Summary

**Before:** Manual process (request → approve → manually add to inventory)
**After:** Automatic process (request → approve → inventory created automatically)

✅ Faster
✅ Less error-prone
✅ Better tracking
✅ Audit trail
