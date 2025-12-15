# Database Table Renaming Instructions

## Overview
All database table names have been updated from snake_case to CamelCase throughout the codebase. You now need to rename the actual tables in your Supabase database.

## Steps to Complete the Migration

### 1. Run the SQL Migration Script
Open your Supabase SQL Editor and run the migration script:

**File:** `scripts/rename-tables-to-camelcase.sql`

This script will rename all 17 tables:
- `barangay_health_workers` → `BarangayHealthWorkers`
- `barangay_vaccine_inventory` → `BarangayVaccineInventory`
- `barangays` → `Barangays`
- `notification_status` → `NotificationStatus`
- `notifications` → `Notifications`
- `push_subscriptions` → `PushSubscriptions`
- `residents` → `Residents`
- `session_beneficiaries` → `SessionBeneficiaries`
- `user_profiles` → `UserProfiles`
- `vaccination_records` → `VaccinationRecords`
- `vaccination_session_photos` → `VaccinationSessionPhotos`
- `vaccination_sessions` → `VaccinationSessions`
- `vaccine_doses` → `VaccineDoses`
- `vaccine_monthly_report` → `VaccineMonthlyReport`
- `vaccine_monthly_report_with_details` → `VaccineMonthlyReportWithDetails`
- `vaccine_requests` → `VaccineRequests`
- `vaccines` → `Vaccines`

### 2. Update Foreign Key References
After renaming tables, you may need to update foreign key constraints. Supabase should handle this automatically, but verify:
- Foreign keys still reference the correct tables
- RLS policies still work correctly
- Views and functions that reference table names

### 3. Update RLS Policies (if needed)
Check your Row Level Security policies in Supabase. They may reference table names directly and might need updates.

### 4. Test Your Application
After running the migration:
1. Test all major features
2. Verify data is still accessible
3. Check that all queries work correctly
4. Test authentication and authorization

## What Has Been Updated in the Codebase

✅ All `.from()` table references in:
- `lib/` files (14 files)
- `app/api/` routes (18 files)
- `app/pages/` components (10 files)
- `components/` files (5 files)
- `hooks/` files (2 files)

✅ All nested select statements with table relations
✅ All foreign key references in queries

## Important Notes

⚠️ **Backup First**: Always backup your database before running migrations

⚠️ **Downtime**: Consider running this during low-traffic periods

⚠️ **Testing**: Test thoroughly in a development environment first

⚠️ **Rollback Plan**: Keep the old table names handy in case you need to rollback

## Verification

After migration, verify by checking:
1. Application loads without errors
2. All API endpoints work
3. Database queries return expected results
4. No console errors related to table names

