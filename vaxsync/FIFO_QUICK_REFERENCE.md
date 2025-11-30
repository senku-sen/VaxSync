# FIFO Inventory Deduction - Quick Reference

## What Changed?

The vaccine inventory deduction system now uses **FIFO (First-In-First-Out)** instead of LIFO.

| Aspect | Before (LIFO) | After (FIFO) |
|--------|---------------|--------------|
| **Order** | Newest first ❌ | Oldest first ✅ |
| **Records** | 1 record only ❌ | All records ✅ |
| **Split Inventory** | Fails ❌ | Works ✅ |
| **Batch Tracking** | Limited ❌ | Full tracking ✅ |

## How It Works

### Deduction (When Vaccinating)
```
Administered count increases: 5 → 8 (3 more people)
         ↓
Deduct 3 vials from inventory (oldest first)
         ↓
If TT1 has: [100 vials (old), 100 vials (new)]
Result:     [97 vials (old), 100 vials (new)]
```

### Add-Back (When Correcting)
```
Administered count decreases: 8 → 5 (3 fewer people)
         ↓
Add back 3 vials to inventory (oldest first)
         ↓
If TT1 has: [97 vials (old), 100 vials (new)]
Result:     [100 vials (old), 100 vials (new)]
```

## Functions

### 1. `deductBarangayVaccineInventory(barangayId, vaccineId, quantity)`
Deduct from barangay inventory (oldest first)

```javascript
const result = await deductBarangayVaccineInventory(
  "barangay-id",
  "vaccine-id",
  200  // vials to deduct
);

// Returns:
{
  success: true,
  error: null,
  deductedRecords: [
    { id: "inv-1", batch_number: "BATCH001", deductedQuantity: 100, newQuantity: 0 },
    { id: "inv-2", batch_number: "BATCH002", deductedQuantity: 100, newQuantity: 0 }
  ]
}
```

### 2. `addBackBarangayVaccineInventory(barangayId, vaccineId, quantity)`
Add back to barangay inventory (oldest first)

```javascript
const result = await addBackBarangayVaccineInventory(
  "barangay-id",
  "vaccine-id",
  25  // vials to add back
);

// Returns:
{
  success: true,
  error: null,
  addedRecords: [
    { id: "inv-1", batch_number: "BATCH001", addedQuantity: 25, newQuantity: 75 }
  ]
}
```

### 3. `deductMainVaccineInventory(vaccineId, quantity)`
Deduct from main vaccine tables (vaccines + vaccine_doses)

```javascript
const result = await deductMainVaccineInventory(
  "vaccine-id",
  150  // doses to deduct
);

// Updates:
// - vaccines table: quantity_available - 150
// - vaccine_doses table: deduct from oldest doses first
```

### 4. `addMainVaccineInventory(vaccineId, quantity)`
Add back to main vaccine tables (vaccines + vaccine_doses)

```javascript
const result = await addMainVaccineInventory(
  "vaccine-id",
  150  // doses to add back
);

// Updates:
// - vaccines table: quantity_available + 150
// - vaccine_doses table: add to oldest doses first
```

## Console Logs

### Deduction
```
🔴 FIFO Deducting vaccine from inventory: {
  barangayId: "...",
  vaccineId: "...",
  quantityToDeduct: 200
}

Found 2 inventory record(s) for FIFO deduction:
  { id: "inv-1", quantity_vial: 100, batch: "BATCH001" },
  { id: "inv-2", quantity_vial: 100, batch: "BATCH002" }

  📦 Record inv-1 (Batch: BATCH001): 100 → 0 (deducting 100)
  📦 Record inv-2 (Batch: BATCH002): 100 → 0 (deducting 100)

✅ FIFO Deduction complete. Deducted from 2 record(s)
```

### Add-Back
```
🟢 FIFO Adding back vaccine to inventory: {
  barangayId: "...",
  vaccineId: "...",
  quantityToAdd: 25
}

Found 2 inventory record(s) for FIFO add-back:
  { id: "inv-1", quantity_vial: 50, batch: "BATCH001" },
  { id: "inv-2", quantity_vial: 75, batch: "BATCH002" }

  📦 Record inv-1 (Batch: BATCH001): 50 → 75 (adding 25)

✅ FIFO Add-back complete. Added to 1 record(s)
```

## Common Scenarios

### Scenario 1: Split Inventory Deduction
```
Setup:
  TT1 Record 1: 100 vials (2025-01-01)
  TT1 Record 2: 100 vials (2025-01-05)

Deduct 200 vials:
  Record 1: 100 → 0 (deducted 100)
  Record 2: 100 → 0 (deducted 100)
```

### Scenario 2: Partial Deduction
```
Setup:
  TT1 Record 1: 50 vials (2025-01-01)
  TT1 Record 2: 75 vials (2025-01-05)

Deduct 100 vials:
  Record 1: 50 → 0 (deducted 50)
  Record 2: 75 → 25 (deducted 50)
```

### Scenario 3: Insufficient Inventory
```
Setup:
  TT1: 50 vials

Deduct 100 vials:
  Result: 0 vials
  Warning: "Could only deduct 50/100 vials. Shortage: 50"
```

### Scenario 4: Add-Back to Oldest
```
Setup:
  TT1 Record 1: 50 vials (2025-01-01)
  TT1 Record 2: 75 vials (2025-01-05)

Add back 25 vials:
  Record 1: 50 → 75 (added 25)
  Record 2: 75 → 75 (unchanged)
```

## Data Flow in vaccination_schedule/page.jsx

```javascript
// When health worker updates administered count
const administeredDifference = newAdministered - previousAdministered;

if (administeredDifference > 0) {
  // More people vaccinated → Deduct from inventory
  await deductBarangayVaccineInventory(barangayId, vaccineId, administeredDifference);
  await deductMainVaccineInventory(vaccineId, administeredDifference);
} else if (administeredDifference < 0) {
  // Fewer people vaccinated → Add back to inventory
  const quantityToAddBack = Math.abs(administeredDifference);
  await addBackBarangayVaccineInventory(barangayId, vaccineId, quantityToAddBack);
  await addMainVaccineInventory(vaccineId, quantityToAddBack);
}
```

## Debugging Tips

### Check Console Logs
Open browser DevTools → Console tab
Look for logs starting with:
- 🔴 FIFO Deducting...
- 🟢 FIFO Adding back...
- 📦 Record details
- ✅ Completion status
- ⚠️ Warnings

### Verify Inventory
1. Open Supabase Dashboard
2. Check `barangay_vaccine_inventory` table
3. Verify quantities match expected values
4. Check batch numbers and dates

### Test Scenarios
1. Update administered count up → Check deduction
2. Update administered count down → Check add-back
3. Check multiple records → Verify FIFO order
4. Check batch numbers → Verify oldest first

## Files to Review

- `/lib/barangayVaccineInventory.js` - Core functions
- `/FIFO_INVENTORY_DEDUCTION.md` - Complete documentation
- `/FIFO_IMPLEMENTATION_SUMMARY.md` - Before/after comparison
- `/app/pages/Health_Worker/vaccination_schedule/page.jsx` - Usage example

## Key Points

✅ **FIFO = Oldest First**
- Prevents vaccine expiry
- Follows standard practices
- Maintains batch rotation

✅ **Handles Multiple Records**
- TT1 with 100 + 100 vials works
- Deducts from both records correctly
- Tracks all affected records

✅ **Detailed Logging**
- Shows which records were affected
- Displays batch numbers
- Logs all operations

✅ **Error Handling**
- Warns if insufficient inventory
- Handles partial deductions
- Never fails silently

## Support

For questions or issues:
1. Check console logs for details
2. Review `/FIFO_INVENTORY_DEDUCTION.md`
3. Test with scenarios above
4. Check Supabase dashboard
