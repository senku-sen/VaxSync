# Monthly Report Auto-Save Feature

## Overview

The monthly report table now includes automatic saving functionality. When users switch between months using the navigation arrows, any unsaved changes are automatically saved to the database before switching.

---

## ✨ Features

### 1. **Editable Cells**
- All numeric columns are now editable
- Users can click on any cell and type new values
- Changes are tracked in real-time

### 2. **Auto-Save on Month Switch**
- When clicking Previous Month or Next Month buttons
- System automatically saves all changes
- User is notified of save status
- Month only switches after successful save

### 3. **Save Status Indicators**
- **Saving**: Blue spinner with "Saving changes..." message
- **Saved**: Green checkmark with "All changes saved successfully!" message
- **Error**: Red alert with error message

### 4. **Change Tracking**
- Only changed fields are sent to the API
- Original values are preserved if not edited
- Changes are cleared after successful save

---

## 🎯 How It Works

### User Workflow

```
1. User opens Monthly Report
   ↓
2. User edits cells (Initial, IN, OUT, Wastage, Ending, etc.)
   ↓
3. User clicks Previous/Next Month button
   ↓
4. System detects unsaved changes
   ↓
5. System saves all changes automatically
   ↓
6. Save status shows (Saving → Saved)
   ↓
7. Month switches to new month
   ↓
8. New month data loads
```

### Data Flow

```
┌─────────────────────────────────────────┐
│ User edits cell value                   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Change tracked in state                 │
│ changes[recordId] = { field: value }    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ User clicks Previous/Next Month         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ autoSaveChanges() called                │
│ - Checks if changes exist               │
│ - Sends PUT requests to API             │
│ - Shows save status                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ All saves successful?                   │
│ - Yes: Clear changes, switch month      │
│ - No: Show error, stay on current month │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ New month data loads                    │
│ Table refreshes with new data           │
└─────────────────────────────────────────┘
```

---

## 📋 Editable Columns

| Column | Type | Editable | Notes |
|--------|------|----------|-------|
| Vaccine Name | Text | ❌ No | Display only |
| Initial | Number | ✅ Yes | Starting inventory |
| IN | Number | ✅ Yes | Quantity supplied |
| OUT | Number | ✅ Yes | Quantity used/administered |
| Wastage | Number | ✅ Yes | Wasted doses |
| Ending | Number | ✅ Yes | Final inventory |
| Vials Needed | Number | ✅ Yes | Monthly requirement |
| Max Alloc | Number | ✅ Yes | Maximum allocation |
| %Stock | Number | ✅ Yes | Stock percentage |
| Status | Badge | ❌ No | Display only |

---

## 🔄 State Management

### Changes State
```javascript
changes = {
  "record-id-1": {
    initial_inventory: 1000,
    quantity_used: 250
  },
  "record-id-2": {
    quantity_wastage: 50
  }
}
```

### Save Status
- `null` - No save operation
- `'saving'` - Save in progress
- `'saved'` - Save successful
- `'error'` - Save failed

---

## 🛡️ Error Handling

### Scenarios

#### 1. No Changes
- If user clicks Previous/Next without editing
- System skips save and switches month immediately

#### 2. Partial Save Failure
- If some records fail to save
- System shows error message
- User stays on current month
- Changes are preserved

#### 3. Network Error
- If API request fails
- Error message displays
- User can retry by clicking month button again

#### 4. Validation Error
- If invalid data is sent
- API returns error
- Error message shows to user

---

## 💾 API Integration

### Save Request
```javascript
PUT /api/monthly-reports
Content-Type: application/json

{
  "id": "record-uuid",
  "initial_inventory": 1000,
  "quantity_supplied": 500,
  "quantity_used": 250,
  "quantity_wastage": 50,
  "ending_inventory": 1200,
  "vials_needed": 100,
  "max_allocation": 200,
  "stock_level_percentage": 600
}
```

### Save Response
```javascript
{
  "success": true,
  "message": "Monthly report updated successfully",
  "record": {
    "id": "record-uuid",
    "vaccine_id": "vaccine-uuid",
    "month": "2025-12-01",
    "initial_inventory": 1000,
    "quantity_supplied": 500,
    "quantity_used": 250,
    "quantity_wastage": 50,
    "ending_inventory": 1200,
    "vials_needed": 100,
    "max_allocation": 200,
    "stock_level_percentage": 600,
    "status": "GOOD",
    "updated_at": "2025-12-02T12:58:00Z"
  }
}
```

---

## 🎨 UI Components

### Save Status Display
```jsx
{saveStatus === 'saving' && (
  <div className="bg-blue-50 border-blue-200">
    <Spinner /> Saving changes...
  </div>
)}

{saveStatus === 'saved' && (
  <div className="bg-green-50 border-green-200">
    <Check /> All changes saved successfully!
  </div>
)}

{saveStatus === 'error' && (
  <div className="bg-red-50 border-red-200">
    <AlertCircle /> Error saving: {message}
  </div>
)}
```

### Editable Input
```jsx
<input
  type="number"
  value={recordChanges.quantity_used || report.quantity_used}
  onChange={(e) => {
    setChanges({
      ...changes,
      [report.id]: { ...recordChanges, quantity_used: parseInt(e.target.value) }
    });
  }}
  className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-[#4A7C59]"
/>
```

---

## 🧪 Testing

### Test 1: Edit Single Cell
1. Open Monthly Report
2. Click on a cell (e.g., Quantity Used)
3. Change the value
4. Click Previous/Next Month
5. **Expected**: Save message appears, month switches

### Test 2: Edit Multiple Cells
1. Edit multiple cells in different rows
2. Click Previous/Next Month
3. **Expected**: All changes saved, success message shows

### Test 3: Network Error
1. Edit a cell
2. Disconnect internet
3. Click Previous/Next Month
4. **Expected**: Error message shows, month doesn't switch

### Test 4: No Changes
1. Don't edit any cells
2. Click Previous/Next Month
3. **Expected**: Month switches immediately without save message

### Test 5: Verify Database
1. Edit cells and switch month
2. Check Supabase database
3. **Expected**: Records updated with new values

---

## 📊 Performance

### Optimization
- Only changed records are sent to API
- Parallel saves using Promise.all()
- Changes cleared after successful save
- No unnecessary re-renders

### Scalability
- Works with any number of vaccines
- Handles multiple barangays
- Efficient state management
- Minimal API calls

---

## 🔐 Data Integrity

### Validation
- All values must be integers
- No negative values allowed
- Unique constraint on (vaccine_id, month)
- Timestamps auto-managed

### Rollback
- If save fails, changes are preserved
- User can retry or edit again
- No data loss

---

## 📝 Implementation Details

### Files Modified
- `components/inventory/MonthlyReportTable.jsx`

### New State Variables
- `changes` - Tracks unsaved changes
- `saveStatus` - Save operation status
- `saveMessage` - Save status message

### New Functions
- `autoSaveChanges()` - Saves all changes to API
- Updated `handlePreviousMonth()` - Calls autoSave before switching
- Updated `handleNextMonth()` - Calls autoSave before switching

### New Imports
- `Check` icon from lucide-react
- `AlertCircle` icon from lucide-react

---

## 🚀 Usage

### For Users
1. Edit any numeric cell
2. Click Previous/Next Month button
3. Wait for save confirmation
4. Month switches automatically

### For Developers
- No additional setup required
- Works with existing API endpoints
- Compatible with all browsers
- Mobile responsive

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Changes not saving | Check internet connection, check API endpoint |
| Save error message | Check error details, verify data is valid |
| Month not switching | Check if save failed, retry clicking button |
| Cells not editable | Refresh page, check browser console |
| Data not persisting | Verify database permissions are set |

---

## 📚 Related Files

- `app/api/monthly-reports/route.js` - PUT endpoint
- `SQL_MIGRATIONS/MONTHLY_REPORT_SAVE_SETUP.sql` - Database setup
- `MONTHLY_REPORT_SAVE_GUIDE.md` - General save guide
- `MONTHLY_REPORT_SQL_QUICK_REFERENCE.md` - SQL reference

---

## ✅ Checklist

- [x] Editable cells implemented
- [x] Change tracking implemented
- [x] Auto-save on month switch implemented
- [x] Save status indicators implemented
- [x] Error handling implemented
- [x] API integration implemented
- [x] UI components updated
- [x] Documentation created

---

**Status:** ✅ Complete and Ready

**Last Updated:** December 2, 2025
