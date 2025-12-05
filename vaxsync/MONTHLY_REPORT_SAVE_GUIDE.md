# Monthly Report Save Implementation Guide

## Overview
This guide explains how to implement saving monthly reports in VaxSync. The system includes SQL setup commands and API endpoints for managing vaccine monthly reports.

---

## Step 1: Run SQL Commands in Supabase

### Location
File: `SQL_MIGRATIONS/MONTHLY_REPORT_SAVE_SETUP.sql`

### How to Run
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy all commands from `MONTHLY_REPORT_SAVE_SETUP.sql`
3. Paste into the SQL Editor
4. Click **Run** button

### What These Commands Do

```sql
-- Disable RLS (Row Level Security)
ALTER TABLE vaccine_monthly_report DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report_with_details TO authenticated;

-- Grant permissions to anon users (optional)
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report_with_details TO anon;

-- Ensure schema access
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
```

### Key Points
- ✅ RLS is **DISABLED** for easier access during development
- ✅ All authenticated users can read/write all records
- ✅ Can be enabled later with proper policies if needed

---

## Step 2: API Endpoints

### Available Endpoints

#### 1. POST - Create Monthly Report Records
**Endpoint:** `POST /api/monthly-reports`

**Purpose:** Create initial monthly report records for all vaccines and barangays

**Request Body:**
```json
{
  "month": "2025-12-01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Created 120 monthly report records for 2025-12-01",
  "count": 120,
  "vaccines": 10,
  "barangays": 12
}
```

---

#### 2. GET - Fetch Monthly Report Records
**Endpoint:** `GET /api/monthly-reports?month=2025-12-01`

**Purpose:** Get existing monthly report records for a specific month

**Query Parameters:**
- `month` (required): Format `YYYY-MM-01`

**Response:**
```json
{
  "success": true,
  "month": "2025-12-01",
  "count": 120,
  "records": [
    {
      "id": "uuid-1",
      "vaccine_id": "uuid-vaccine",
      "month": "2025-12-01",
      "initial_inventory": 1000,
      "quantity_supplied": 500,
      "quantity_used": 200,
      "quantity_wastage": 50,
      "ending_inventory": 1250,
      "vials_needed": 100,
      "max_allocation": 200,
      "stock_level_percentage": 625,
      "status": "GOOD",
      "created_at": "2025-12-01T10:00:00Z",
      "updated_at": "2025-12-01T10:00:00Z"
    }
  ]
}
```

---

#### 3. PUT - Update/Save Monthly Report Record
**Endpoint:** `PUT /api/monthly-reports`

**Purpose:** Update a specific monthly report record

**Request Body:**
```json
{
  "id": "uuid-record-id",
  "initial_inventory": 1000,
  "quantity_supplied": 500,
  "quantity_used": 200,
  "quantity_wastage": 50,
  "ending_inventory": 1250,
  "vials_needed": 100,
  "max_allocation": 200,
  "stock_level_percentage": 625,
  "status": "GOOD"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Monthly report updated successfully",
  "record": {
    "id": "uuid-record-id",
    "vaccine_id": "uuid-vaccine",
    "month": "2025-12-01",
    "initial_inventory": 1000,
    "quantity_supplied": 500,
    "quantity_used": 200,
    "quantity_wastage": 50,
    "ending_inventory": 1250,
    "vials_needed": 100,
    "max_allocation": 200,
    "stock_level_percentage": 625,
    "status": "GOOD",
    "created_at": "2025-12-01T10:00:00Z",
    "updated_at": "2025-12-01T10:30:00Z"
  }
}
```

---

## Step 3: Frontend Implementation

### Update MonthlyReportTable Component

Add a "Save" button and edit functionality:

```jsx
// Add state for editing
const [editingId, setEditingId] = useState(null);
const [editData, setEditData] = useState({});

// Handle save
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
      // Refresh data
      await fetchReports();
      setEditingId(null);
    }
  } catch (err) {
    console.error('Error saving report:', err);
  }
};
```

---

## Step 4: Database Schema

### Table Structure

```sql
CREATE TABLE vaccine_monthly_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_id UUID NOT NULL REFERENCES vaccines(id),
  month DATE NOT NULL,
  
  -- Inventory Data
  initial_inventory INTEGER NOT NULL DEFAULT 0,
  quantity_supplied INTEGER NOT NULL DEFAULT 0,
  quantity_used INTEGER NOT NULL DEFAULT 0,
  quantity_wastage INTEGER NOT NULL DEFAULT 0,
  ending_inventory INTEGER NOT NULL DEFAULT 0,
  
  -- Calculations
  vials_needed INTEGER NOT NULL DEFAULT 0,
  max_allocation INTEGER NOT NULL DEFAULT 0,
  stock_level_percentage INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'GOOD',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(vaccine_id, month)
);
```

### Indexes
- `idx_vaccine_monthly_report_vaccine_id` - For vaccine lookups
- `idx_vaccine_monthly_report_month` - For month lookups
- `idx_vaccine_monthly_report_status` - For status filtering

---

## Step 5: Status Values

### Valid Status Values
- `GOOD` - Normal stock level (default)
- `OVERSTOCK` - Stock > 75%
- `UNDERSTOCK` - Stock between 25-75%
- `STOCKOUT` - Stock < 25%

---

## Testing

### Test Creating Records
```bash
curl -X POST http://localhost:3000/api/monthly-reports \
  -H "Content-Type: application/json" \
  -d '{"month": "2025-12-01"}'
```

### Test Fetching Records
```bash
curl -X GET "http://localhost:3000/api/monthly-reports?month=2025-12-01"
```

### Test Updating Record
```bash
curl -X PUT http://localhost:3000/api/monthly-reports \
  -H "Content-Type: application/json" \
  -d '{
    "id": "record-uuid",
    "quantity_used": 250,
    "ending_inventory": 1200,
    "status": "GOOD"
  }'
```

---

## Troubleshooting

### Issue: "Permission denied" error
**Solution:** Run the SQL commands from `MONTHLY_REPORT_SAVE_SETUP.sql` again

### Issue: "Record not found"
**Solution:** Make sure the record ID exists and the month format is correct (YYYY-MM-01)

### Issue: "Unique constraint violation"
**Solution:** A record already exists for this vaccine and month combination

---

## Security Notes

### Current Setup (Development)
- ✅ RLS is **DISABLED**
- ✅ All authenticated users can access all records
- ✅ Good for development and testing

### Production Setup (Future)
- Enable RLS with proper policies
- Restrict access by barangay/role
- Add audit logging

---

## Next Steps

1. ✅ Run SQL commands in Supabase
2. ✅ Test API endpoints with curl or Postman
3. ✅ Add edit functionality to MonthlyReportTable component
4. ✅ Add save button and form validation
5. ✅ Test end-to-end workflow

---

## Files Modified/Created

- ✅ `SQL_MIGRATIONS/MONTHLY_REPORT_SAVE_SETUP.sql` - SQL setup commands
- ✅ `app/api/monthly-reports/route.js` - Added PUT endpoint
- ✅ `MONTHLY_REPORT_SAVE_GUIDE.md` - This guide

---

## Support

For issues or questions, check:
1. Browser console for error messages
2. Supabase logs for database errors
3. Network tab in DevTools for API responses
