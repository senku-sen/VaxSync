# Monthly Report - Auto-Save Implementation

## 🎯 Overview

The monthly report now **automatically saves to Supabase** when the report is viewed. No manual save button needed - data is calculated and saved automatically.

---

## ✨ How It Works

### 1. User Opens Monthly Report
```
User clicks "Monthly Report" tab
         ↓
System fetches all vaccines
         ↓
For each vaccine:
  - Calculate Initial (from previous month)
  - Calculate IN (from vaccines added)
  - Calculate OUT (from vaccination sessions)
  - Calculate Ending = Initial + IN - OUT - Wastage
  - Calculate Stock %
         ↓
System AUTOMATICALLY saves all data to Supabase
         ↓
Display shows calculated data (read-only)
```

### 2. Save Process
```
Primary Method: UPSERT
  - If record exists: UPDATE it
  - If record doesn't exist: INSERT it
  - Based on unique constraint: (vaccine_id, month)

If UPSERT fails:
  - Fallback Method: DELETE + INSERT
  - Delete all records for this month
  - Insert all new records
  - Ensures data consistency
```

---

## 📊 Data Flow

```
┌─────────────────────────────────┐
│ User Opens Monthly Report       │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ Fetch Vaccines                  │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ For Each Vaccine:               │
│ - Fetch Sessions (OUT)          │
│ - Fetch Vaccines Added (IN)     │
│ - Get Previous Month (Initial)  │
│ - Calculate All Values          │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ UPSERT to Supabase              │
│ (Update or Insert)              │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ If UPSERT Fails:                │
│ Try DELETE + INSERT             │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ Display Data in Table           │
│ (Read-Only)                     │
└─────────────────────────────────┘
```

---

## 🔄 Save Methods

### Method 1: UPSERT (Primary)
```javascript
// Insert or update based on unique constraint
const { data, error } = await supabase
  .from('vaccine_monthly_report')
  .upsert(reportsToSave, { onConflict: 'vaccine_id,month' })
  .select();
```

**Advantages:**
- Single operation
- Efficient
- Atomic (all or nothing)

**When Used:**
- First attempt to save data

---

### Method 2: DELETE + INSERT (Fallback)
```javascript
// Step 1: Delete existing records for this month
const { error: deleteError } = await supabase
  .from('vaccine_monthly_report')
  .delete()
  .eq('month', month);

// Step 2: Insert new records
const { data, error } = await supabase
  .from('vaccine_monthly_report')
  .insert(reportsToSave)
  .select();
```

**Advantages:**
- Works when UPSERT fails
- Ensures clean data
- Handles edge cases

**When Used:**
- If UPSERT fails
- As fallback mechanism

---

## 📋 What Gets Saved

```javascript
{
  vaccine_id: "uuid",                    // Vaccine ID
  month: "2025-12-01",                   // Month (YYYY-MM-01)
  initial_inventory: 1000,               // Starting qty
  quantity_supplied: 500,                // Added qty
  quantity_used: 250,                    // Administered qty
  quantity_wastage: 50,                  // Wasted qty
  ending_inventory: 1200,                // Final qty (calculated)
  vials_needed: 11,                      // Monthly requirement
  max_allocation: 22,                    // Max allowed
  stock_level_percentage: 5454,          // Stock %
  status: "OVERSTOCK"                    // Status
}
```

---

## 🔍 Console Logging

When saving, you'll see console messages:

```
💾 Saving 10 monthly reports for 2025-12-01...
✅ Successfully saved 10 monthly reports for 2025-12-01

OR (if UPSERT fails):

❌ Error saving monthly reports: {...}
🔄 Trying alternative save method (delete + insert)...
🗑️ Deleting existing records for month: 2025-12-01
✅ Deleted existing records
📝 Inserting new records...
✅ Successfully inserted 10 records
```

---

## ✅ Verification

### Check 1: Open Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for save messages

### Check 2: Check Supabase
1. Open Supabase Dashboard
2. Go to vaccine_monthly_report table
3. Verify records exist for current month

### Check 3: Refresh Page
1. Open Monthly Report
2. Refresh page (F5)
3. Data should still be there (saved in DB)

---

## 🛡️ Error Handling

### If Save Fails

**Automatic Fallback:**
- Primary method (UPSERT) fails
- System automatically tries DELETE + INSERT
- If both fail, error is logged but doesn't break the app

**User Experience:**
- Data still displays (calculated in memory)
- Console shows error details
- User can refresh to retry

---

## 📊 Database Requirements

### Table Structure
```sql
CREATE TABLE vaccine_monthly_report (
  id UUID PRIMARY KEY,
  vaccine_id UUID NOT NULL,
  month DATE NOT NULL,
  initial_inventory INTEGER,
  quantity_supplied INTEGER,
  quantity_used INTEGER,
  quantity_wastage INTEGER,
  ending_inventory INTEGER,
  vials_needed INTEGER,
  max_allocation INTEGER,
  stock_level_percentage INTEGER,
  status VARCHAR(50),
  UNIQUE(vaccine_id, month)  -- Important for UPSERT
);
```

### Required Permissions
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report TO anon;
```

---

## 🔄 When Data Updates

Data is recalculated and saved when:

1. **User Opens Monthly Report**
   - Initial load
   - Switching months

2. **Vaccine Session is Created**
   - Next time report is opened
   - OUT value updates

3. **Vaccine is Added**
   - Next time report is opened
   - IN value updates

4. **Page is Refreshed**
   - Recalculates and saves

---

## 📝 Implementation Details

### Files Modified
- `lib/vaccineMonthlyReport.js`
  - Enabled auto-save (line 357)
  - Added UPSERT method
  - Added DELETE + INSERT fallback
  - Added error handling

### Key Functions
- `fetchMonthlyVaccineReport()` - Calculates and saves
- `saveMonthlyReportsToSupabase()` - Primary save (UPSERT)
- `saveMonthlyReportsAlternative()` - Fallback save (DELETE + INSERT)

---

## 🚀 Testing

### Test 1: Initial Save
1. Open Monthly Report
2. Check console for save messages
3. Verify data in Supabase

### Test 2: Update Save
1. Create a new vaccination session
2. Open Monthly Report again
3. Verify OUT value updated
4. Check console for save messages

### Test 3: Fallback Method
1. Manually break UPSERT (for testing)
2. Open Monthly Report
3. Verify fallback method works
4. Check console for fallback messages

---

## 🎯 Benefits

- ✅ **Automatic**: No manual save needed
- ✅ **Reliable**: UPSERT + fallback method
- ✅ **Efficient**: Single operation (UPSERT)
- ✅ **Consistent**: Data always in sync
- ✅ **Transparent**: Console logs show what's happening
- ✅ **Resilient**: Fallback if primary fails

---

## 🆘 Troubleshooting

### Issue: Data not saving
**Solution:**
1. Check console for error messages
2. Verify database permissions
3. Check Supabase table exists
4. Verify unique constraint on (vaccine_id, month)

### Issue: Duplicate records
**Solution:**
- Unique constraint prevents duplicates
- UPSERT updates existing records
- DELETE + INSERT cleans up

### Issue: Wrong data
**Solution:**
1. Check vaccination sessions are correct
2. Check vaccines are created on correct dates
3. Verify calculations in console logs

---

## 📚 Related Files

- `lib/vaccineMonthlyReport.js` - Implementation
- `components/inventory/MonthlyReportTable.jsx` - Display
- `MONTHLY_REPORT_READ_ONLY_GUIDE.md` - Display guide
- `FIX_406_ERROR.md` - Permission fixes

---

**Status:** ✅ Complete and Ready

**Last Updated:** December 2, 2025
