# FIFO Inventory Deduction System

## Overview
The vaccine inventory deduction system now uses **FIFO (First-In-First-Out)** methodology to ensure that vaccines are administered in the order they were received. This is critical for vaccine management where expiry dates and batch numbers matter.

## Key Features

### ✅ FIFO Method (Oldest First)
- When deducting inventory, the system processes the **oldest inventory records first**
- When adding back inventory, the system adds to the **oldest records first**
- This ensures vaccines don't expire while newer stock is used

### ✅ Multiple Records Support
- Handles cases where the same vaccine has multiple inventory records
- Example: TT1 vaccine with two separate records (100 + 100 vials)
- When deducting 200 vials, it deducts 100 from first record, then 100 from second record

### ✅ Three-Level Inventory Management
1. **Barangay Inventory** (`barangay_vaccine_inventory`) - Per barangay stock
2. **Main Vaccine Inventory** (`vaccines`) - Total stock
3. **Vaccine Doses** (`vaccine_doses`) - Individual dose tracking

## Functions Updated

### 1. `deductBarangayVaccineInventory(barangayId, vaccineId, quantityToDeduct)`
**Purpose:** Deduct vaccines from barangay inventory when administered

**FIFO Logic:**
```
1. Fetch ALL inventory records for vaccine in barangay (oldest first)
2. For each record in order:
   - Calculate how much to deduct from this record
   - Deduct the amount
   - Move to next record if more to deduct
3. Update all affected records in database
```

**Example:**
```
Barangay has TT1 inventory:
- Record 1: 100 vials (created 2025-01-01)
- Record 2: 100 vials (created 2025-01-05)

Deduct 200 vials:
- Record 1: 100 → 0 (deducted 100)
- Record 2: 100 → 0 (deducted 100)
```

**Returns:**
```javascript
{
  success: true,
  error: null,
  deductedRecords: [
    {
      id: "record-1-id",
      batch_number: "BATCH001",
      previousQuantity: 100,
      deductedQuantity: 100,
      newQuantity: 0
    },
    {
      id: "record-2-id",
      batch_number: "BATCH002",
      previousQuantity: 100,
      deductedQuantity: 100,
      newQuantity: 0
    }
  ]
}
```

### 2. `addBackBarangayVaccineInventory(barangayId, vaccineId, quantityToAdd)`
**Purpose:** Add vaccines back to barangay inventory when administered count decreases

**FIFO Logic:**
```
1. Fetch ALL inventory records for vaccine in barangay (oldest first)
2. For each record in order:
   - Add the full remaining quantity to this record
   - Stop (add all to first record)
3. Update the affected record in database
```

**Example:**
```
Barangay has TT1 inventory:
- Record 1: 50 vials (created 2025-01-01)
- Record 2: 75 vials (created 2025-01-05)

Add back 25 vials:
- Record 1: 50 → 75 (added 25)
- Record 2: 75 → 75 (unchanged)
```

### 3. `deductMainVaccineInventory(vaccineId, quantityToDeduct)`
**Purpose:** Deduct from main vaccine tables (vaccines + vaccine_doses)

**Updates Two Tables:**
1. **vaccines table** - Total quantity_available
2. **vaccine_doses table** - Individual dose quantities (FIFO)

**FIFO Logic for Doses:**
```
1. Fetch ALL dose records for vaccine (oldest first)
2. For each dose in order:
   - Deduct from this dose
   - Move to next dose if more to deduct
3. Update all affected dose records
```

### 4. `addMainVaccineInventory(vaccineId, quantityToAdd)`
**Purpose:** Add back to main vaccine tables when administered count decreases

**Updates Two Tables:**
1. **vaccines table** - Total quantity_available
2. **vaccine_doses table** - Individual dose quantities (FIFO)

## Data Flow

### When Administered Count Increases (Vaccination Given)

```
Health Worker updates session:
  administered: 5 → 8 (3 more people vaccinated)
         ↓
Calculate difference: 8 - 5 = 3 vials to deduct
         ↓
deductBarangayVaccineInventory(barangayId, vaccineId, 3)
  ├─ Fetch all inventory records (oldest first)
  ├─ Deduct 3 from oldest record
  └─ Update database
         ↓
deductMainVaccineInventory(vaccineId, 3)
  ├─ Update vaccines table: quantity_available - 3
  ├─ Fetch all vaccine_doses (oldest first)
  ├─ Deduct 3 from oldest dose
  └─ Update database
         ↓
✅ Inventory updated successfully
```

### When Administered Count Decreases (Correction)

```
Health Worker corrects session:
  administered: 8 → 5 (3 fewer people)
         ↓
Calculate difference: 5 - 8 = -3 (add back)
         ↓
addBackBarangayVaccineInventory(barangayId, vaccineId, 3)
  ├─ Fetch all inventory records (oldest first)
  ├─ Add 3 to oldest record
  └─ Update database
         ↓
addMainVaccineInventory(vaccineId, 3)
  ├─ Update vaccines table: quantity_available + 3
  ├─ Fetch all vaccine_doses (oldest first)
  ├─ Add 3 to oldest dose
  └─ Update database
         ↓
✅ Inventory corrected successfully
```

## Console Logging

The system provides detailed console logs for debugging:

### Deduction Example
```
🔴 FIFO Deducting vaccine from inventory: {
  barangayId: "barangay-123",
  vaccineId: "vaccine-456",
  quantityToDeduct: 200
}

Found 2 inventory record(s) for FIFO deduction: [
  { id: "inv-1", quantity_vial: 100, batch: "BATCH001" },
  { id: "inv-2", quantity_vial: 100, batch: "BATCH002" }
]

  📦 Record inv-1 (Batch: BATCH001): 100 → 0 (deducting 100)
  📦 Record inv-2 (Batch: BATCH002): 100 → 0 (deducting 100)

✅ FIFO Deduction complete. Deducted from 2 record(s): [...]
```

### Add-Back Example
```
🟢 FIFO Adding back vaccine to inventory: {
  barangayId: "barangay-123",
  vaccineId: "vaccine-456",
  quantityToAdd: 25
}

Found 2 inventory record(s) for FIFO add-back: [
  { id: "inv-1", quantity_vial: 50, batch: "BATCH001" },
  { id: "inv-2", quantity_vial: 75, batch: "BATCH002" }
]

  📦 Record inv-1 (Batch: BATCH001): 50 → 75 (adding 25)

✅ FIFO Add-back complete. Added to 1 record(s): [...]
```

## Benefits

### ✅ Vaccine Safety
- Ensures older vaccines are used first
- Prevents expiry of vaccines
- Maintains proper batch rotation

### ✅ Accurate Tracking
- Handles multiple inventory records correctly
- Tracks which records were affected
- Provides audit trail with batch numbers

### ✅ Compliance
- Follows standard inventory management practices
- Meets healthcare regulations
- Maintains proper documentation

### ✅ Error Handling
- Warns if insufficient inventory
- Handles partial deductions gracefully
- Logs all operations for debugging

## Testing Scenarios

### Scenario 1: Single Record Deduction
```
Inventory: TT1 (100 vials)
Deduct: 30 vials
Result: TT1 (70 vials)
```

### Scenario 2: Multiple Records Deduction
```
Inventory:
- TT1 Record 1: 100 vials
- TT1 Record 2: 100 vials

Deduct: 150 vials
Result:
- TT1 Record 1: 0 vials (deducted 100)
- TT1 Record 2: 50 vials (deducted 50)
```

### Scenario 3: Insufficient Inventory
```
Inventory: TT1 (50 vials)
Deduct: 100 vials
Result: TT1 (0 vials) + Warning logged
```

### Scenario 4: Add-Back to Multiple Records
```
Inventory:
- TT1 Record 1: 50 vials
- TT1 Record 2: 75 vials

Add back: 25 vials
Result:
- TT1 Record 1: 75 vials (added 25)
- TT1 Record 2: 75 vials (unchanged)
```

## Implementation Details

### Sorting Strategy
- **Primary Sort:** `created_at ASC` (oldest first)
- **Secondary Sort:** `id ASC` (for consistency when timestamps are identical)

### Update Strategy
- Collects all updates in array
- Applies updates sequentially
- Rolls back on first error
- Returns detailed deduction records

### Error Handling
- Catches database errors
- Logs warnings without failing
- Returns success/error status
- Provides detailed error messages

## Files Modified

- `/lib/barangayVaccineInventory.js`
  - `deductBarangayVaccineInventory()` - FIFO deduction
  - `addBackBarangayVaccineInventory()` - FIFO add-back
  - `deductMainVaccineInventory()` - FIFO deduction for doses
  - `addMainVaccineInventory()` - FIFO add-back for doses

## Related Functions

- `updateSessionAdministered()` in `/lib/vaccinationSession.js` - Calls deduction functions
- `handleUpdateProgressSubmit()` in vaccination_schedule page - Triggers updates

## Future Enhancements

- [ ] Add batch expiry date consideration
- [ ] Add low stock warnings
- [ ] Add inventory history/audit log
- [ ] Add batch-specific deduction preferences
- [ ] Add inventory forecasting
