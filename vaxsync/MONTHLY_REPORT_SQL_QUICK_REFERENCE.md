# Monthly Report - SQL Quick Reference

## 🚀 Quick Setup (Copy & Paste)

Run these commands in **Supabase Dashboard → SQL Editor**:

```sql
-- Step 1: Disable RLS
ALTER TABLE vaccine_monthly_report DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant full permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report_with_details TO authenticated;

-- Step 3: Grant permissions to anon users (optional)
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccine_monthly_report_with_details TO anon;

-- Step 4: Ensure schema access
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Step 5: Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
```

## ✅ Verification Commands

### Check if RLS is disabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'vaccine_monthly_report';
```
**Expected Result:** `rowsecurity = false`

### Check current permissions
```sql
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name='vaccine_monthly_report'
ORDER BY grantee, privilege_type;
```

### Check table structure
```sql
SELECT * FROM vaccine_monthly_report LIMIT 1;
```

### Count records
```sql
SELECT COUNT(*) as total_records FROM vaccine_monthly_report;
```

---

## 🔄 API Endpoints

### Create Records for a Month
```bash
POST /api/monthly-reports
Body: { "month": "2025-12-01" }
```

### Fetch Records for a Month
```bash
GET /api/monthly-reports?month=2025-12-01
```

### Update a Record
```bash
PUT /api/monthly-reports
Body: {
  "id": "record-uuid",
  "quantity_used": 250,
  "ending_inventory": 1200,
  "status": "GOOD"
}
```

---

## 🔐 RLS Status

| Status | Meaning | Access |
|--------|---------|--------|
| ✅ DISABLED | RLS is off | All authenticated users can access all records |
| ❌ ENABLED | RLS is on | Need policies to define access |

**Current:** ✅ DISABLED (for development)

---

## 📋 Table Columns

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| vaccine_id | UUID | Reference to vaccine |
| month | DATE | Report month (YYYY-MM-01) |
| initial_inventory | INTEGER | Starting quantity |
| quantity_supplied | INTEGER | Doses added |
| quantity_used | INTEGER | Doses administered |
| quantity_wastage | INTEGER | Doses wasted |
| ending_inventory | INTEGER | Final quantity |
| vials_needed | INTEGER | Monthly requirement |
| max_allocation | INTEGER | Maximum allowed |
| stock_level_percentage | INTEGER | % of max allocation |
| status | VARCHAR | GOOD/OVERSTOCK/UNDERSTOCK/STOCKOUT |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

---

## ⚠️ Important Notes

1. **RLS is DISABLED** - All authenticated users can read/write all records
2. **Format:** Month must be `YYYY-MM-01` (first day of month)
3. **Unique Constraint:** One record per vaccine per month
4. **Auto-timestamps:** created_at and updated_at are automatic
5. **Validation:** All numeric fields must be >= 0

---

## 🆘 Troubleshooting

| Error | Solution |
|-------|----------|
| Permission denied | Run SQL commands again |
| Record not found | Check record ID and month format |
| Unique constraint violation | Record already exists for this vaccine/month |
| Invalid month format | Use YYYY-MM-01 format |

---

## 📝 Example Usage

### Create monthly records for December 2025
```bash
curl -X POST http://localhost:3000/api/monthly-reports \
  -H "Content-Type: application/json" \
  -d '{"month": "2025-12-01"}'
```

### Get all records for December 2025
```bash
curl -X GET "http://localhost:3000/api/monthly-reports?month=2025-12-01"
```

### Update a specific record
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

---

## 📚 Related Files

- `SQL_MIGRATIONS/vaccine_monthly_report_schema.sql` - Table schema
- `SQL_MIGRATIONS/MONTHLY_REPORT_SAVE_SETUP.sql` - Setup commands
- `app/api/monthly-reports/route.js` - API endpoints
- `components/inventory/MonthlyReportTable.jsx` - Frontend component
- `lib/vaccineMonthlyReport.js` - Helper functions
- `MONTHLY_REPORT_SAVE_GUIDE.md` - Full implementation guide
