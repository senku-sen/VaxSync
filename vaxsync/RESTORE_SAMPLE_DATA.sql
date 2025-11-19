-- ============================================================================
-- VaxSync Sample Data Restoration
-- ============================================================================
-- This script restores all sample data for testing DASH-01 to DASH-04
-- ============================================================================

-- ============================================================================
-- 1. INSERT BARANGAYS DATA
-- ============================================================================
INSERT INTO barangays (code, name) VALUES
  ('barangay-a', 'Barangay Alawihao'),
  ('barangay-b', 'Barangay Awitan'),
  ('barangay-c', 'Barangay Bagasbas'),
  ('barangay-d', 'Barangay Borabod'),
  ('barangay-e', 'Barangay Calasgasan')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. INSERT INVENTORY DATA
-- ============================================================================
INSERT INTO inventory (vaccine_name, batch, quantity, threshold, location, barangay, expiry_date) VALUES
  ('COVID-19', 'COVID-2025-001', 500, 100, 'Main Clinic', 'barangay-a', '2025-12-31'),
  ('Polio', 'POLIO-2025-001', 300, 50, 'Main Clinic', 'barangay-a', '2025-11-30'),
  ('Measles', 'MEASLES-2025-001', 200, 50, 'Main Clinic', 'barangay-b', '2025-10-31'),
  ('Hepatitis B', 'HEP-B-2025-001', 150, 50, 'Main Clinic', 'barangay-c', '2025-09-30'),
  ('Influenza', 'FLU-2025-001', 250, 75, 'Main Clinic', 'barangay-d', '2025-08-31'),
  ('Dengue', 'DENGUE-2025-001', 180, 60, 'Main Clinic', 'barangay-e', '2025-07-31');

-- ============================================================================
-- 3. INSERT VACCINE USAGE DATA
-- ============================================================================
INSERT INTO vaccine_usage (vaccine_name, quantity, date, barangay, purpose) VALUES
  ('COVID-19', 25, CURRENT_DATE, 'barangay-a', 'Routine immunization'),
  ('Polio', 15, CURRENT_DATE, 'barangay-a', 'School vaccination'),
  ('Measles', 10, CURRENT_DATE - INTERVAL '1 day', 'barangay-b', 'Outbreak response'),
  ('COVID-19', 20, CURRENT_DATE - INTERVAL '2 days', 'barangay-c', 'Booster campaign'),
  ('Hepatitis B', 12, CURRENT_DATE - INTERVAL '3 days', 'barangay-d', 'Newborn vaccination'),
  ('Influenza', 18, CURRENT_DATE - INTERVAL '4 days', 'barangay-e', 'Seasonal campaign');

-- ============================================================================
-- 4. INSERT ALERTS DATA
-- ============================================================================
INSERT INTO alerts (vaccine_name, batch, alert_type, severity, message, current_stock, threshold, location, barangay, expiry_date, status) VALUES
  ('COVID-19', 'COVID-2025-001', 'low_stock', 'warning', 'COVID-19 stock below threshold', 45, 100, 'Main Clinic', 'barangay-a', '2025-12-31', 'active'),
  ('Polio', 'POLIO-2025-001', 'expiring_soon', 'critical', 'Polio vaccine expiring in 5 days', 300, 50, 'Main Clinic', 'barangay-a', '2025-11-25', 'active'),
  ('Measles', 'MEASLES-2025-001', 'low_stock', 'warning', 'Measles stock running low', 85, 100, 'Main Clinic', 'barangay-b', '2025-10-31', 'active');

-- ============================================================================
-- 5. INSERT USERS DATA
-- ============================================================================
INSERT INTO users (email, full_name, role, barangay, status) VALUES
  ('admin@vaxsync.gov', 'Admin User', 'Head_Nurse', 'Main Office', 'active'),
  ('worker1@vaxsync.gov', 'Health Worker 1', 'Health_Worker', 'barangay-a', 'active'),
  ('worker2@vaxsync.gov', 'Health Worker 2', 'Health_Worker', 'barangay-b', 'active'),
  ('worker3@vaxsync.gov', 'Health Worker 3', 'Health_Worker', 'barangay-c', 'active'),
  ('worker4@vaxsync.gov', 'Health Worker 4', 'Health_Worker', 'barangay-d', 'active'),
  ('worker5@vaxsync.gov', 'Health Worker 5', 'Health_Worker', 'barangay-e', 'active');

-- ============================================================================
-- 6. INSERT VACCINE REQUESTS DATA
-- ============================================================================
INSERT INTO vaccine_requests (request_id, health_worker_id, health_worker_name, barangay, vaccine_type, quantity_requested, status, notes) VALUES
  ('REQ001', NULL, 'Health Worker 1', 'barangay-a', 'COVID-19', 50, 'pending', 'For immunization drive'),
  ('REQ002', NULL, 'Health Worker 1', 'barangay-a', 'Measles', 30, 'pending', 'Routine vaccination for school children'),
  ('REQ003', NULL, 'Health Worker 2', 'barangay-b', 'Polio', 25, 'approved', 'School vaccination program'),
  ('REQ004', NULL, 'Health Worker 3', 'barangay-c', 'Influenza', 60, 'released', 'Essential flu vaccination campaign'),
  ('REQ005', NULL, 'Health Worker 4', 'barangay-d', 'COVID-19', 50, 'rejected', 'Booster dose campaign'),
  ('REQ006', NULL, 'Health Worker 5', 'barangay-e', 'Hepatitis B', 25, 'released', 'Newborn vaccination program');

-- ============================================================================
-- 7. INSERT RESIDENTS DATA
-- ============================================================================
INSERT INTO residents (full_name, age, address, barangay, contact_number, vaccine_status, status) VALUES
  ('Tony Stark', 35, '123 Main St', 'barangay-a', '09123456789', 'Fully Vaccinated', 'approved'),
  ('Juan Dela Cruz', 28, '456 Oak Ave', 'barangay-a', '09987654321', 'Partially Vaccinated', 'pending'),
  ('Balugo Santiago', 38, '987 Cedar Ln', 'barangay-b', '09778888999', 'Partially Vaccinated', 'pending'),
  ('James Doakes', 45, '321 Pine Rd', 'barangay-c', '09555555555', 'Fully Vaccinated', 'approved'),
  ('Dexter Morgan', 32, '654 Elm St', 'barangay-d', '09666666666', 'Not Vaccinated', 'pending'),
  ('Peter Parker', 26, '789 Maple Dr', 'barangay-e', '09777777777', 'Fully Vaccinated', 'approved');

-- ============================================================================
-- 8. INSERT VACCINATION SESSIONS DATA
-- ============================================================================
INSERT INTO vaccination_sessions (barangay, session_date, vaccine_type, target_doses, administered_doses, status) VALUES
  ('barangay-a', NOW() + INTERVAL '2 days', 'COVID-19', 100, 95, 'completed'),
  ('barangay-b', NOW() + INTERVAL '3 days', 'Polio', 80, 0, 'scheduled'),
  ('barangay-c', NOW() + INTERVAL '1 day', 'Measles', 120, 45, 'in_progress'),
  ('barangay-d', NOW() + INTERVAL '5 days', 'Influenza', 90, 0, 'scheduled'),
  ('barangay-e', NOW() + INTERVAL '4 days', 'Hepatitis B', 75, 30, 'in_progress');

-- ============================================================================
-- 9. INSERT NOTIFICATIONS DATA
-- ============================================================================
INSERT INTO notifications (user_id, title, message, notification_type, is_read) VALUES
  (NULL, 'Low Stock Alert', 'COVID-19 vaccine stock is running low', 'alert', false),
  (NULL, 'Expiry Warning', 'Polio vaccine expiring in 5 days', 'warning', false),
  (NULL, 'Request Approved', 'Your vaccine request has been approved', 'success', false),
  (NULL, 'New Vaccination Session', 'New vaccination session scheduled for barangay-a', 'info', false),
  (NULL, 'Resident Approved', 'New resident has been approved', 'success', false);

-- ============================================================================
-- END OF DATA RESTORATION
-- ============================================================================
-- All sample data has been restored successfully
-- ============================================================================
