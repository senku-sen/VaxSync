# Fix: Initial Inventory Should Be Previous Month's Ending

## 🔴 Problem

December's `initial_inventory` was showing **0** instead of **November's ending_inventory**.

**Example:**
```
November:
  Ending Inventory: 500

December:
  Initial Inventory: 0 ❌ (Should be 500)
  Quantity Supplied: 500
  Ending Inventory: 500 (0 + 500 - 0 - 0)
```

---

## ✅ Solution

Implemented **recursive month chaining** to properly link months together:

### How It Works

```
When calculating December:
  1. Try to fetch November's ending from database
  2. If found → Use it as December's initial ✅
  3. If not found → Recursively calculate November
  4. Use November's calculated ending as December's initial ✅
  5. If still not found → Use vaccines created before month
```

---

## 🔄 Three-Level Fallback

### Level 1: Database Query (Fastest)
```javascript
// Try to get from database
const prevMonthReport = await supabase
  .from('vaccine_monthly_report')
  .select('ending_inventory')
  .eq('vaccine_id', vaccine.id)
  .eq('month', previousMonthStr)
  .single();

if (prevMonthReport) {
  initialVials = prevMonthReport.ending_inventory; // ✅ Use it
}
```

**When Used:** If previous month already calculated and saved

---

### Level 2: Recursive Calculation (Smart)
```javascript
// If not in database, calculate previous month recursively
const { data: prevMonthData } = await fetchMonthlyVaccineReport(
  barangayId, 
  previousMonthStr
);

// Find matching vaccine in previous month's data
const prevVaccine = prevMonthData.find(v => v.vaccine_id === vaccine.id);
if (prevVaccine) {
  initialVials = prevVaccine.ending_inventory; // ✅ Use calculated value
}
```

**When Used:** If previous month not in database yet

**How It Works:**
- Calls `fetchMonthlyVaccineReport` for previous month
- That function calculates and saves previous month
- Returns calculated ending inventory
- Uses that as current month's initial

---

### Level 3: Vaccines Before Month (Fallback)
```javascript
// Final fallback: Sum vaccines created before this month
const vaccinesBeforeMonth = await supabase
  .from('vaccines')
  .select('quantity_available, created_at')
  .eq('id', vaccine.id)
  .lt('created_at', startDateStr);

initialVials = vaccinesBeforeMonth.reduce((sum, v) => sum + v.quantity_available, 0);
```

**When Used:** If no previous month data exists at all

---

## 📊 Example: Multi-Month Chain

### Scenario
```
October: Not calculated yet
November: Not calculated yet
December: User opens this month
```

### What Happens

**Step 1: Calculate December**
```
December needs initial inventory
  → Query database for November ending
  → Not found
  → Recursively calculate November
```

**Step 2: Calculate November (Recursive)**
```
November needs initial inventory
  → Query database for October ending
  → Not found
  → Recursively calculate October
```

**Step 3: Calculate October (Recursive)**
```
October needs initial inventory
  → Query database for September ending
  → Not found
  → Use vaccines created before October
  → October initial = 1000
```

**Step 4: Calculate October Ending**
```
October:
  Initial: 1000
  Supplied: 500
  Used: 100
  Ending: 1000 + 500 - 100 = 1400 ✅
  → Saved to database
```

**Step 5: Calculate November (Resume)**
```
November:
  Initial: 1400 (October's ending) ✅
  Supplied: 300
  Used: 50
  Ending: 1400 + 300 - 50 = 1650 ✅
  → Saved to database
```

**Step 6: Calculate December (Resume)**
```
December:
  Initial: 1650 (November's ending) ✅
  Supplied: 200
  Used: 40
  Ending: 1650 + 200 - 40 = 1810 ✅
  → Saved to database
```

---

## 🎯 Result

Now the monthly report correctly chains months:

```
October:
  Initial: 1000
  Ending: 1400

November:
  Initial: 1400 ✅ (October's ending)
  Ending: 1650

December:
  Initial: 1650 ✅ (November's ending)
  Ending: 1810
```

---

## 🔍 Console Output

When calculating December, you'll see:

```
🔍 Processing: Tt1
  ℹ️ Previous month not in DB, calculating recursively...
  ✅ Initial inventory (calculated from previous month): 1650 vials
  Quantity Supplied (IN): 200 vials
  Quantity Used (OUT): 40 vials
  Ending: 1810 vials
```

---

## ✨ Key Features

- ✅ **Automatic Chaining**: Months automatically link together
- ✅ **Recursive Calculation**: Calculates all previous months if needed
- ✅ **Smart Fallback**: Three levels of fallback logic
- ✅ **Transparent Logging**: Console shows what's happening
- ✅ **Efficient**: Uses database when available
- ✅ **Consistent**: Always correct month-to-month flow

---

## 📝 Code Changes

**File:** `lib/vaccineMonthlyReport.js`

**Changes:**
- Added `prevMonthFound` flag to track if previous month found
- Added recursive call to `fetchMonthlyVaccineReport` for previous month
- Added three-level fallback logic
- Added detailed console logging

**Lines Modified:** 187-246

---

## ✅ Verification

### Test 1: First Time (No Previous Data)
1. Open December report
2. Check console for recursive calculation messages
3. Verify initial = 0 (no previous month)
4. Verify ending = supplied (0 + supplied - 0 - 0)

### Test 2: Second Time (After Previous Saved)
1. Open November report first
2. Then open December report
3. Check console for database query message
4. Verify initial = November's ending ✅

### Test 3: Multi-Month Chain
1. Open December (calculates Oct, Nov, Dec)
2. Check console for all recursive calls
3. Verify each month's initial = previous month's ending ✅

---

## 🚀 How to Test

1. **Clear Database** (optional)
   - Delete all records from vaccine_monthly_report

2. **Open Monthly Report**
   - Navigate to December

3. **Check Console**
   - Open F12 → Console
   - Look for messages like:
     ```
     ℹ️ Previous month not in DB, calculating recursively...
     ✅ Initial inventory (calculated from previous month): 1650 vials
     ```

4. **Verify Data**
   - December initial should match November ending
   - November initial should match October ending
   - And so on...

---

## 📊 Before vs After

| Month | Before | After |
|-------|--------|-------|
| October | Initial: 1000 | Initial: 1000 ✅ |
| October | Ending: 1400 | Ending: 1400 ✅ |
| November | Initial: 0 ❌ | Initial: 1400 ✅ |
| November | Ending: 1650 | Ending: 1650 ✅ |
| December | Initial: 0 ❌ | Initial: 1650 ✅ |
| December | Ending: 1810 | Ending: 1810 ✅ |

---

## 🎯 Summary

✅ Initial inventory now correctly uses previous month's ending
✅ Months automatically chain together
✅ Recursive calculation handles missing months
✅ Three-level fallback ensures data consistency
✅ Console logging shows what's happening

---

**Status:** ✅ **Fixed**

**Implementation:** Recursive month chaining with three-level fallback

**Test:** Open monthly report and verify initial inventory matches previous month's ending
