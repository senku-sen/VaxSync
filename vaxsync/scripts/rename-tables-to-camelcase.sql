-- ============================================
-- Database Table Renaming Script
-- Renames all tables from snake_case to CamelCase
-- ============================================
-- IMPORTANT: Backup your database before running this script!
-- ============================================

-- Rename tables (using double quotes to preserve case in PostgreSQL)
ALTER TABLE IF EXISTS barangay_health_workers RENAME TO "BarangayHealthWorkers";
ALTER TABLE IF EXISTS barangay_vaccine_inventory RENAME TO "BarangayVaccineInventory";
ALTER TABLE IF EXISTS barangays RENAME TO "Barangays";
ALTER TABLE IF EXISTS notification_status RENAME TO "NotificationStatus";
ALTER TABLE IF EXISTS notifications RENAME TO "Notifications";
ALTER TABLE IF EXISTS push_subscriptions RENAME TO "PushSubscriptions";
ALTER TABLE IF EXISTS residents RENAME TO "Residents";
ALTER TABLE IF EXISTS session_beneficiaries RENAME TO "SessionBeneficiaries";
ALTER TABLE IF EXISTS user_profiles RENAME TO "UserProfiles";
ALTER TABLE IF EXISTS vaccination_records RENAME TO "VaccinationRecords";
ALTER TABLE IF EXISTS vaccination_session_photos RENAME TO "VaccinationSessionPhotos";
ALTER TABLE IF EXISTS vaccination_sessions RENAME TO "VaccinationSessions";
ALTER TABLE IF EXISTS vaccine_doses RENAME TO "VaccineDoses";
ALTER TABLE IF EXISTS vaccine_monthly_report RENAME TO "VaccineMonthlyReport";
ALTER TABLE IF EXISTS vaccine_monthly_report_with_details RENAME TO "VaccineMonthlyReportWithDetails";
ALTER TABLE IF EXISTS vaccine_requests RENAME TO "VaccineRequests";
ALTER TABLE IF EXISTS vaccines RENAME TO "Vaccines";

-- ============================================
-- Verify the renames worked
-- ============================================
-- You can run this query to check:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;
