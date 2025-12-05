# Monthly Report - Read-Only Auto-Calculated Data

## 🎯 Overview

The monthly report is now **completely read-only and auto-calculated** from actual system data. All values update automatically when vaccine sessions or vaccines change.

---

## ✨ Key Features

### 1. **All Data Read-Only**
- ✅ No manual editing allowed
- ✅ All values calculated from system data
- ✅ Display only (no input fields)

### 2. **Auto-Calculated from Real Data**
- ✅ **Initial Inventory**: From previous month's ending
- ✅ **IN (Supplied)**: From vaccines added during month
- ✅ **OUT (Used)**: From vaccination sessions administered
- ✅ **Wastage**: From system records (default 0)
- ✅ **Ending**: Calculated formula = Initial + IN - OUT - Wastage
- ✅ **Stock %**: Calculated = (Ending / Max Allocation) × 100

### 3. **Adapts to Changes**
- ✅ When vaccine sessions are created/updated → OUT updates
- ✅ When vaccines are added → IN updates
- ✅ When previous month ends → Initial updates
- ✅ All calculations recalculate automatically

---

## 📊 Data Sources

### Initial Inventory
```
Source: Previous month's ending_inventory
If no previous month: Sum of vaccines created before this month
```

### Quantity Supplied (IN)
```
Source: Vaccines table
Filter: Vaccines created during this month
Calculation: Sum of quantity_available for vaccines created in month
```

### Quantity Used (OUT)
```
Source: Vaccination_sessions table
Filter: Sessions in this month
Calculation: Sum of administered doses from all sessions
```

### Quantity Wastage
```
Source: System records (currently default 0)
Can be updated via API if needed
```

### Ending Inventory
```
Formula: Initial + IN - OUT - Wastage
Example: 1000 + 500 - 250 - 50 = 1200
```

### Stock Level Percentage
```
Formula: (Ending / Max Allocation) × 100
Example: (1200 / 217) × 100 = 553%
```

---

## 🔄 How It Works

### When User Views Report
```
1. User opens Monthly Report
2. System fetches all vaccines
3. For each vaccine:
   - Get previous month's ending (initial)
   - Count vaccines added this month (IN)
   - Count doses administered this month (OUT)
   - Calculate ending = initial + IN - OUT - wastage
   - Calculate stock % = (ending / max) × 100
4. Display all calculated values (read-only)
```

### When Vaccine Session Changes
```
1. User creates/updates vaccination session
2. Session is saved to database
3. When user views monthly report:
   - System recalculates OUT from updated sessions
   - Ending inventory recalculates
   - Stock % recalculates
   - Display shows new values
```

### When Vaccine is Added
```
1. User adds new vaccine to inventory
2. Vaccine is saved to database
3. When user views monthly report:
   - System recalculates IN from new vaccines
   - Ending inventory recalculates
   - Stock % recalculates
   - Display shows new values
```

---

## 📋 Table Display

### All Columns Read-Only
| Column | Source | Editable |
|--------|--------|----------|
| Vaccine Name | vaccines table | ❌ No |
| Initial | previous month ending | ❌ No |
| IN | vaccines added this month | ❌ No |
| OUT | vaccination sessions | ❌ No |
| Wastage | system records | ❌ No |
| **Ending** | **Calculated** | ❌ **No** |
| Vials Needed | NIP reference table | ❌ No |
| Max Alloc | NIP reference table | ❌ No |
| %Stock | Calculated | ❌ No |
| Status | Calculated from % | ❌ No |

---

## 🎨 Visual Indicators

### Ending Inventory Cell
```
┌─────────────────┐
│  1200           │  ← Blue background
│ (calculated)    │  ← Read-only
└─────────────────┘
```

---

## 🔄 Data Flow

```
Vaccines Table
├─ Vaccines created before month → Initial Inventory
└─ Vaccines created during month → IN (Supplied)
                    ↓
Vaccination Sessions Table
├─ Sessions in month → OUT (Used)
└─ Doses administered → OUT calculation
                    ↓
Monthly Report Calculation
├─ Ending = Initial + IN - OUT - Wastage
├─ Stock % = (Ending / Max) × 100
└─ Status = Based on Stock %
                    ↓
Display (Read-Only)
├─ All values shown
├─ No editing allowed
└─ Updates when source data changes
```

---

## 📊 Example Scenario

### Month: December 2025

**Initial Inventory** (from November ending)
```
Previous month (November) ending: 1120
→ December initial: 1120
```

**IN (Vaccines Added)**
```
Vaccines created in December:
- TT1: 140 doses
→ December IN: 140
```

**OUT (Doses Administered)**
```
Vaccination sessions in December:
- Session 1: 50 doses
- Session 2: 30 doses
→ December OUT: 80
```

**Wastage**
```
System records: 0
→ December Wastage: 0
```

**Ending Inventory**
```
Formula: 1120 + 140 - 80 - 0 = 1180
→ December Ending: 1180
```

**Stock Percentage**
```
Formula: (1180 / 217) × 100 = 544%
→ December Stock %: 544%
```

**Status**
```
544% > 75% → OVERSTOCK
→ December Status: 🟣 OVERSTOCK
```

---

## 🔍 How to Verify

### Check Initial Inventory
1. Open November report
2. Note the Ending value
3. Open December report
4. Initial should equal November's Ending

### Check IN (Supplied)
1. Go to Inventory → Add Vaccine
2. Add vaccine in December
3. Open Monthly Report
4. IN column should increase

### Check OUT (Used)
1. Go to Vaccination Schedule
2. Create/update session in December
3. Open Monthly Report
4. OUT column should increase

### Check Ending Updates
1. Make changes above
2. Ending should recalculate automatically
3. Stock % should update
4. Status should update

---

## 💾 No Manual Saving Needed

- ✅ No save button
- ✅ No manual edits
- ✅ No data entry errors
- ✅ All data from system sources
- ✅ Always accurate and up-to-date

---

## 🎯 Benefits

- ✅ **Accuracy**: Data from actual system records
- ✅ **Real-Time**: Updates when source data changes
- ✅ **No Errors**: No manual calculation mistakes
- ✅ **Consistency**: Single source of truth
- ✅ **Audit Trail**: All changes tracked in source tables
- ✅ **Simple**: No complex workflows

---

## 📝 Files Modified

- `components/inventory/MonthlyReportTable.jsx`
  - Removed all editable inputs
  - Made all cells read-only
  - Removed auto-save functionality
  - Simplified to display-only mode

---

## 🚀 Usage

### For Users
1. Open Monthly Report
2. View all calculated data
3. Data updates automatically when:
   - Vaccines are added
   - Vaccination sessions are created/updated
   - Previous month ends

### For Developers
- No manual save needed
- All data calculated from source tables
- Check `fetchMonthlyVaccineReport()` in `lib/vaccineMonthlyReport.js`
- Data flows from: vaccines table → vaccination_sessions table → calculations

---

## ✅ Checklist

- [x] All cells read-only
- [x] No manual editing
- [x] Data from system sources
- [x] Auto-calculated values
- [x] Updates on data changes
- [x] No save functionality needed
- [x] Display-only interface

---

**Status:** ✅ Complete and Ready

**Last Updated:** December 2, 2025
