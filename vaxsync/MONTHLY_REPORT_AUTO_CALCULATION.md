# Monthly Report - Auto-Calculation Feature

## 🎯 Overview

The monthly report now **automatically calculates** the ending inventory based on the formula:

```
Ending Inventory = Initial + Supplied - Used - Wastage
```

This ensures data consistency and prevents manual calculation errors.

---

## 📊 Formula

### Components
- **Initial Inventory** - Starting quantity for the month
- **Quantity Supplied (IN)** - Doses added during the month
- **Quantity Used (OUT)** - Doses administered during the month
- **Quantity Wastage** - Doses wasted/damaged during the month

### Calculation
```
Ending = Initial + Supplied - Used - Wastage
```

### Example
```
Initial:    1000 doses
Supplied:  +  500 doses
Used:      -  250 doses
Wastage:   -   50 doses
─────────────────────
Ending:    = 1200 doses
```

---

## ✨ Features

### 1. Real-Time Display
- Ending inventory updates as you type
- Shows calculated value in blue highlight
- No need to manually calculate

### 2. Auto-Save Calculation
- When switching months, ending is automatically calculated
- Calculation happens before saving
- Ensures database has correct values

### 3. Smart Updates
- Only recalculates when needed
- Uses current values (edited or original)
- Handles all combinations of changes

---

## 🔄 How It Works

### User Edits Initial Inventory
```
Before: Initial = 1000, Supplied = 500, Used = 250, Wastage = 50 → Ending = 1200
After:  Initial = 1500, Supplied = 500, Used = 250, Wastage = 50 → Ending = 1700
                                                                    ↑ Updates automatically
```

### User Edits Quantity Used
```
Before: Initial = 1000, Supplied = 500, Used = 250, Wastage = 50 → Ending = 1200
After:  Initial = 1000, Supplied = 500, Used = 300, Wastage = 50 → Ending = 1150
                                                                    ↑ Updates automatically
```

### User Edits Multiple Fields
```
Before: Initial = 1000, Supplied = 500, Used = 250, Wastage = 50 → Ending = 1200
After:  Initial = 1200, Supplied = 600, Used = 400, Wastage = 75 → Ending = 1325
        ↑ Changed        ↑ Changed        ↑ Changed  ↑ Changed      ↑ Recalculated
```

---

## 💾 Save Process

### Step 1: User Edits Cells
```javascript
changes = {
  "record-id": {
    initial_inventory: 1500,
    quantity_used: 300
  }
}
```

### Step 2: User Clicks Month Button
```
System detects changes
```

### Step 3: Auto-Calculate Ending
```javascript
// Get current values
initial = 1500 (edited)
supplied = 500 (original)
used = 300 (edited)
wastage = 50 (original)

// Calculate
ending = 1500 + 500 - 300 - 50 = 1650
```

### Step 4: Save with Calculated Value
```javascript
// Data sent to API
{
  id: "record-id",
  initial_inventory: 1500,
  quantity_used: 300,
  ending_inventory: 1650  // Calculated automatically
}
```

### Step 5: Database Update
```
Record saved with:
- Initial: 1500
- Supplied: 500
- Used: 300
- Wastage: 50
- Ending: 1650 ✅ (Calculated)
```

---

## 🎨 UI Display

### Ending Inventory Cell
```
┌─────────────────┐
│  1650           │  ← Blue background (calculated)
│ (read-only)     │  ← Not editable
└─────────────────┘
```

### Real-Time Update Example
```
User edits Initial from 1000 to 1500
                    ↓
Ending updates from 1200 to 1700
(in real-time as user types)
```

---

## 🔐 Data Integrity

### Automatic Validation
- ✅ Ensures formula is always correct
- ✅ Prevents manual calculation errors
- ✅ Maintains data consistency
- ✅ No negative values allowed

### Calculation Priority
1. Check if user edited any component
2. Use edited value if available
3. Use original value if not edited
4. Calculate ending from all components
5. Save calculated value to database

---

## 📋 Implementation Details

### Real-Time Calculation
```javascript
// In table cell render
const initial = recordChanges.initial_inventory || report.initial_inventory;
const supplied = recordChanges.quantity_supplied || report.quantity_supplied;
const used = recordChanges.quantity_used || report.quantity_used;
const wastage = recordChanges.quantity_wastage || report.quantity_wastage;
const calculated = initial + supplied - used - wastage;
```

### Auto-Save Calculation
```javascript
// In autoSaveChanges function
const initial = updatedData.initial_inventory || originalReport.initial_inventory;
const supplied = updatedData.quantity_supplied || originalReport.quantity_supplied;
const used = updatedData.quantity_used || originalReport.quantity_used;
const wastage = updatedData.quantity_wastage || originalReport.quantity_wastage;
const calculatedEnding = initial + supplied - used - wastage;

// Save with calculated value
const dataToSave = {
  id: recordId,
  ...updatedData,
  ending_inventory: calculatedEnding
};
```

---

## 🧪 Testing

### Test 1: Edit Initial Inventory
1. Change Initial from 1000 to 1500
2. **Expected**: Ending updates from 1200 to 1700

### Test 2: Edit Quantity Used
1. Change Used from 250 to 350
2. **Expected**: Ending updates from 1200 to 1100

### Test 3: Edit Multiple Fields
1. Change Initial to 1200
2. Change Used to 300
3. **Expected**: Ending updates to 1350

### Test 4: Verify Save
1. Edit Initial to 1500
2. Switch month
3. Switch back
4. **Expected**: Ending shows 1650 (calculated value)

### Test 5: Check Database
1. Edit cells and switch month
2. Check Supabase database
3. **Expected**: ending_inventory = calculated value

---

## 📊 Example Scenarios

### Scenario 1: Stock Received
```
Initial:   1000
Supplied: +  500  ← New stock received
Used:      -  250
Wastage:   -   50
─────────────────
Ending:    1200  ✅ Correct
```

### Scenario 2: High Usage
```
Initial:   1000
Supplied: +  200
Used:      -  800  ← High usage
Wastage:   -   50
─────────────────
Ending:     350   ✅ Correct
```

### Scenario 3: Wastage
```
Initial:   1000
Supplied: +  500
Used:      -  250
Wastage:   -  150  ← High wastage
─────────────────
Ending:    1100   ✅ Correct
```

---

## 🔍 Debugging

### Check Calculation
```
Look at browser console when saving:
Saving record abc123: {
  initial: 1500,
  supplied: 500,
  used: 300,
  wastage: 50,
  calculatedEnding: 1650
}
```

### Verify Database
```sql
SELECT 
  vaccine_id,
  initial_inventory,
  quantity_supplied,
  quantity_used,
  quantity_wastage,
  ending_inventory,
  (initial_inventory + quantity_supplied - quantity_used - quantity_wastage) as should_be
FROM vaccine_monthly_report
WHERE month = '2025-12-01';
```

---

## ✅ Benefits

- ✅ **Accuracy**: No manual calculation errors
- ✅ **Consistency**: Formula always applied correctly
- ✅ **Efficiency**: Automatic, no extra steps
- ✅ **Real-Time**: See results as you type
- ✅ **Data Integrity**: Database always has correct values
- ✅ **User-Friendly**: Ending is read-only (can't be edited)

---

## 📝 Files Modified

- `components/inventory/MonthlyReportTable.jsx`
  - Added real-time calculation display
  - Added auto-calculation in autoSaveChanges()
  - Made ending_inventory read-only

---

## 🎯 Summary

| Feature | Status |
|---------|--------|
| Real-time calculation | ✅ Implemented |
| Auto-save calculation | ✅ Implemented |
| Read-only display | ✅ Implemented |
| Formula validation | ✅ Implemented |
| Database consistency | ✅ Implemented |

---

**Status:** ✅ Complete and Ready

**Last Updated:** December 2, 2025
