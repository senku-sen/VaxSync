# Monthly Report Save - Complete Workflow

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONTHLY REPORT WORKFLOW                      │
└─────────────────────────────────────────────────────────────────┘

1. DATABASE SETUP
   ┌──────────────────────────────────────────┐
   │ Supabase Dashboard → SQL Editor          │
   │ Run: MONTHLY_REPORT_SAVE_SETUP.sql       │
   │ Result: RLS Disabled, Permissions Granted│
   └──────────────────────────────────────────┘
                        ↓

2. CREATE RECORDS (POST)
   ┌──────────────────────────────────────────┐
   │ POST /api/monthly-reports                │
   │ Body: { "month": "2025-12-01" }          │
   │ Creates: 10 vaccines × 12 barangays      │
   │ Result: 120 records created              │
   └──────────────────────────────────────────┘
                        ↓

3. FETCH RECORDS (GET)
   ┌──────────────────────────────────────────┐
   │ GET /api/monthly-reports?month=2025-12-01│
   │ Returns: All 120 records for December    │
   │ Display: MonthlyReportTable component    │
   └──────────────────────────────────────────┘
                        ↓

4. UPDATE RECORDS (PUT)
   ┌──────────────────────────────────────────┐
   │ PUT /api/monthly-reports                 │
   │ Body: { "id": "uuid", ...fields }        │
   │ Updates: Specific record fields          │
   │ Result: Record saved with new timestamp  │
   └──────────────────────────────────────────┘
                        ↓

5. DATABASE STORAGE
   ┌──────────────────────────────────────────┐
   │ vaccine_monthly_report table             │
   │ Stores: All monthly report data          │
   │ Unique: One record per vaccine per month │
   │ Timestamps: Auto-managed                 │
   └──────────────────────────────────────────┘
```

---

## 📊 Step-by-Step Implementation

### Step 1: Database Configuration (5 minutes)

**What:** Enable saving to database
**How:** Run SQL commands
**Where:** Supabase Dashboard → SQL Editor

```
1. Open https://supabase.com/dashboard
2. Select VaxSync project
3. Click "SQL Editor"
4. Copy from SQL_COMMANDS_TO_RUN.txt
5. Paste and click "Run"
6. Wait for success message
```

**Result:** ✅ Database ready for read/write operations

---

### Step 2: API Testing (5 minutes)

**What:** Verify endpoints work
**How:** Use curl commands
**Where:** Terminal/Command Prompt

#### Test 2.1: Create Records
```bash
curl -X POST http://localhost:3000/api/monthly-reports \
  -H "Content-Type: application/json" \
  -d '{"month": "2025-12-01"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Created 120 monthly report records for 2025-12-01",
  "count": 120,
  "vaccines": 10,
  "barangays": 12
}
```

#### Test 2.2: Fetch Records
```bash
curl -X GET "http://localhost:3000/api/monthly-reports?month=2025-12-01"
```

**Expected Response:**
```json
{
  "success": true,
  "month": "2025-12-01",
  "count": 120,
  "records": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "vaccine_id": "...",
      "month": "2025-12-01",
      "initial_inventory": 0,
      "quantity_supplied": 0,
      "quantity_used": 0,
      "quantity_wastage": 0,
      "ending_inventory": 0,
      "vials_needed": 0,
      "max_allocation": 0,
      "stock_level_percentage": 0,
      "status": "GOOD"
    }
  ]
}
```

#### Test 2.3: Update Record
```bash
curl -X PUT http://localhost:3000/api/monthly-reports \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "quantity_used": 250,
    "ending_inventory": 1200,
    "status": "GOOD"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Monthly report updated successfully",
  "record": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "vaccine_id": "...",
    "month": "2025-12-01",
    "initial_inventory": 0,
    "quantity_supplied": 0,
    "quantity_used": 250,
    "quantity_wastage": 0,
    "ending_inventory": 1200,
    "vials_needed": 0,
    "max_allocation": 0,
    "stock_level_percentage": 0,
    "status": "GOOD",
    "updated_at": "2025-12-02T12:53:00Z"
  }
}
```

**Result:** ✅ All endpoints working correctly

---

### Step 3: Frontend Integration (Optional, 30 minutes)

**What:** Add edit/save functionality to UI
**How:** Update MonthlyReportTable component
**Where:** `components/inventory/MonthlyReportTable.jsx`

#### 3.1: Add Edit State
```jsx
const [editingId, setEditingId] = useState(null);
const [editData, setEditData] = useState({});
```

#### 3.2: Add Save Handler
```jsx
const handleSave = async (recordId) => {
  try {
    const response = await fetch('/api/monthly-reports', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: recordId,
        ...editData[recordId]
      })
    });
    
    const result = await response.json();
    if (result.success) {
      await fetchReports();
      setEditingId(null);
      alert('Record saved successfully!');
    } else {
      alert('Error: ' + result.error);
    }
  } catch (err) {
    console.error('Error saving:', err);
    alert('Failed to save record');
  }
};
```

#### 3.3: Add Edit Mode to Table
```jsx
{editingId === report.id ? (
  <input
    type="number"
    value={editData[report.id]?.quantity_used || report.quantity_used}
    onChange={(e) => setEditData({
      ...editData,
      [report.id]: { ...editData[report.id], quantity_used: parseInt(e.target.value) }
    })}
    className="w-full px-2 py-1 border rounded"
  />
) : (
  <span>{report.quantity_used}</span>
)}
```

#### 3.4: Add Save Button
```jsx
{editingId === report.id ? (
  <button
    onClick={() => handleSave(report.id)}
    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
  >
    Save
  </button>
) : (
  <button
    onClick={() => setEditingId(report.id)}
    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
  >
    Edit
  </button>
)}
```

**Result:** ✅ Users can edit and save records from UI

---

## 🗂️ File Organization

### SQL Files
```
SQL_MIGRATIONS/
├── vaccine_monthly_report_schema.sql
│   └── Creates the table structure
└── MONTHLY_REPORT_SAVE_SETUP.sql
    └── Configures permissions and RLS
```

### API Files
```
app/api/
└── monthly-reports/
    └── route.js
        ├── POST - Create records
        ├── GET - Fetch records
        └── PUT - Update records (NEW)
```

### Component Files
```
components/inventory/
└── MonthlyReportTable.jsx
    └── Displays and manages records
```

### Documentation Files
```
Root/
├── SQL_COMMANDS_TO_RUN.txt
│   └── Copy & paste SQL commands
├── MONTHLY_REPORT_SAVE_GUIDE.md
│   └── Detailed implementation guide
├── MONTHLY_REPORT_SQL_QUICK_REFERENCE.md
│   └── Quick reference with examples
├── IMPLEMENTATION_SUMMARY.md
│   └── Overview and summary
├── MONTHLY_REPORT_IMPLEMENTATION_CHECKLIST.md
│   └── Complete checklist
└── MONTHLY_REPORT_WORKFLOW.md
    └── This file - Visual workflow
```

---

## 📋 Database Schema

### vaccine_monthly_report Table

```
┌─────────────────────────────────────────────────────┐
│              vaccine_monthly_report                 │
├─────────────────────────────────────────────────────┤
│ id (UUID) - Primary Key                             │
│ vaccine_id (UUID) - Foreign Key → vaccines          │
│ month (DATE) - Report month (YYYY-MM-01)            │
│                                                     │
│ INVENTORY DATA:                                     │
│ ├─ initial_inventory (INTEGER) - Starting qty      │
│ ├─ quantity_supplied (INTEGER) - Added qty         │
│ ├─ quantity_used (INTEGER) - Administered qty      │
│ ├─ quantity_wastage (INTEGER) - Wasted qty         │
│ └─ ending_inventory (INTEGER) - Final qty          │
│                                                     │
│ CALCULATIONS:                                       │
│ ├─ vials_needed (INTEGER) - Monthly requirement    │
│ ├─ max_allocation (INTEGER) - Maximum allowed      │
│ ├─ stock_level_percentage (INTEGER) - % of max     │
│ └─ status (VARCHAR) - GOOD/OVERSTOCK/etc           │
│                                                     │
│ METADATA:                                           │
│ ├─ created_at (TIMESTAMP) - Auto-generated         │
│ └─ updated_at (TIMESTAMP) - Auto-updated           │
│                                                     │
│ CONSTRAINTS:                                        │
│ └─ UNIQUE(vaccine_id, month)                       │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Security Model

### Current (Development)
```
┌─────────────────────────────────────────┐
│ RLS: DISABLED                           │
│ Access: All authenticated users         │
│ Permissions: SELECT, INSERT, UPDATE, DELETE
│ Use Case: Development & Testing         │
└─────────────────────────────────────────┘
```

### Future (Production)
```
┌─────────────────────────────────────────┐
│ RLS: ENABLED with policies              │
│ Access: By barangay/role                │
│ Permissions: Role-based                 │
│ Features: Audit logging, approval flow  │
└─────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

### Database Level
- [ ] RLS is disabled
- [ ] Permissions granted to authenticated users
- [ ] Permissions granted to anon users
- [ ] Schema access enabled
- [ ] Sequence permissions set

### API Level
- [ ] POST endpoint creates records
- [ ] GET endpoint fetches records
- [ ] PUT endpoint updates records
- [ ] Error handling works
- [ ] Validation works

### Frontend Level (Optional)
- [ ] Records display in table
- [ ] Edit mode works
- [ ] Save button saves data
- [ ] Success message shows
- [ ] Error message shows

---

## 🚀 Quick Start (TL;DR)

1. **Run SQL Commands** (5 min)
   ```
   Supabase → SQL Editor → Copy SQL_COMMANDS_TO_RUN.txt → Run
   ```

2. **Test API** (5 min)
   ```
   curl -X POST http://localhost:3000/api/monthly-reports \
     -H "Content-Type: application/json" \
     -d '{"month": "2025-12-01"}'
   ```

3. **Done!** ✅
   - Database is ready
   - API is working
   - Records can be saved

---

## 📞 Need Help?

| Question | Answer |
|----------|--------|
| Where do I run SQL? | Supabase Dashboard → SQL Editor |
| What SQL do I run? | Copy from SQL_COMMANDS_TO_RUN.txt |
| How do I test? | Use curl commands in terminal |
| Where's the guide? | Read MONTHLY_REPORT_SAVE_GUIDE.md |
| How do I add edit UI? | See Step 3 in this file |

---

## 📊 Status Overview

```
┌─────────────────────────────────────────┐
│ IMPLEMENTATION STATUS                   │
├─────────────────────────────────────────┤
│ ✅ SQL Setup Commands                   │
│ ✅ POST Endpoint (Create)               │
│ ✅ GET Endpoint (Fetch)                 │
│ ✅ PUT Endpoint (Update/Save) - NEW     │
│ ✅ Error Handling                       │
│ ✅ Validation                           │
│ ✅ Documentation                        │
│ ⏳ Frontend Edit UI (Optional)           │
└─────────────────────────────────────────┘

READY FOR: Immediate use
NEXT STEP: Run SQL commands in Supabase
```

---

**Last Updated:** December 2, 2025
**Status:** ✅ Complete and Ready
