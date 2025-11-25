-- ============================================
-- VAXSYNC - SCHEMA LOCK CONSTRAINTS
-- ============================================
-- Prevents accidental schema changes
-- Run this AFTER all tables and columns are created
-- Last Updated: November 20, 2025
-- ============================================

-- ============================================
-- LOCK user_profiles TABLE
-- ============================================
-- Prevent any modifications to user_profiles structure

-- Add CHECK constraint to prevent invalid user_role values
ALTER TABLE public.user_profiles
ADD CONSTRAINT check_user_role 
CHECK (user_role IN ('Health Worker', 'Head Nurse'));

-- Add NOT NULL constraints to critical columns
ALTER TABLE public.user_profiles
ALTER COLUMN first_name SET NOT NULL;

ALTER TABLE public.user_profiles
ALTER COLUMN last_name SET NOT NULL;

ALTER TABLE public.user_profiles
ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.user_profiles
ALTER COLUMN user_role SET NOT NULL;

-- Add UNIQUE constraint to email
ALTER TABLE public.user_profiles
ADD CONSTRAINT unique_user_email UNIQUE (email);

-- ============================================
-- LOCK barangays TABLE
-- ============================================

-- Add NOT NULL constraints
ALTER TABLE public.barangays
ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.barangays
ALTER COLUMN municipality SET NOT NULL;

-- Add UNIQUE constraint to barangay name
ALTER TABLE public.barangays
ADD CONSTRAINT unique_barangay_name UNIQUE (name);

-- Add CHECK constraint for population
ALTER TABLE public.barangays
ADD CONSTRAINT check_population CHECK (population >= 0);

-- ============================================
-- LOCK vaccines TABLE
-- ============================================

-- Add NOT NULL constraints
ALTER TABLE public.vaccines
ALTER COLUMN name SET NOT NULL;

-- Add CHECK constraint for status
ALTER TABLE public.vaccines
ADD CONSTRAINT check_vaccine_status 
CHECK (status IN ('Active', 'Inactive'));

-- Add CHECK constraint for quantity
ALTER TABLE public.vaccines
ADD CONSTRAINT check_vaccine_quantity CHECK (quantity_available >= 0);

-- ============================================
-- LOCK vaccine_requests TABLE
-- ============================================

-- Add NOT NULL constraints
ALTER TABLE public.vaccine_requests
ALTER COLUMN barangay_id SET NOT NULL;

ALTER TABLE public.vaccine_requests
ALTER COLUMN vaccine_id SET NOT NULL;

ALTER TABLE public.vaccine_requests
ALTER COLUMN requested_by SET NOT NULL;

ALTER TABLE public.vaccine_requests
ALTER COLUMN quantity_dose SET NOT NULL;

ALTER TABLE public.vaccine_requests
ALTER COLUMN status SET NOT NULL;

-- Add CHECK constraint for status values
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT check_request_status 
CHECK (status IN ('pending', 'approved', 'rejected', 'released'));

-- Add CHECK constraint for quantity
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT check_request_quantity CHECK (quantity_dose > 0);

-- Add CHECK constraint for quantity_vial
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT check_request_vial CHECK (quantity_vial IS NULL OR quantity_vial >= 0);

-- ============================================
-- LOCK barangay_vaccine_inventory TABLE
-- ============================================

-- Add NOT NULL constraints
ALTER TABLE public.barangay_vaccine_inventory
ALTER COLUMN barangay_id SET NOT NULL;

ALTER TABLE public.barangay_vaccine_inventory
ALTER COLUMN vaccine_id SET NOT NULL;

ALTER TABLE public.barangay_vaccine_inventory
ALTER COLUMN quantity_vial SET NOT NULL;

ALTER TABLE public.barangay_vaccine_inventory
ALTER COLUMN quantity_dose SET NOT NULL;

-- Add CHECK constraints for quantities
ALTER TABLE public.barangay_vaccine_inventory
ADD CONSTRAINT check_inventory_vial CHECK (quantity_vial >= 0);

ALTER TABLE public.barangay_vaccine_inventory
ADD CONSTRAINT check_inventory_dose CHECK (quantity_dose >= 0);

ALTER TABLE public.barangay_vaccine_inventory
ADD CONSTRAINT check_inventory_reserved CHECK (reserved_vial IS NULL OR reserved_vial >= 0);

-- ============================================
-- LOCK vaccination_sessions TABLE
-- ============================================

-- Add NOT NULL constraints
ALTER TABLE public.vaccination_sessions
ALTER COLUMN barangay_id SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN vaccine_id SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN session_date SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN session_time SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN target SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN administered SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN created_by SET NOT NULL;

-- Add CHECK constraint for status values
ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT check_session_status 
CHECK (status IN ('Scheduled', 'In progress', 'Completed'));

-- Add CHECK constraints for quantities
ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT check_session_target CHECK (target > 0);

ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT check_session_administered CHECK (administered >= 0);

-- Add CHECK constraint: administered cannot exceed target
ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT check_administered_vs_target CHECK (administered <= target);

-- ============================================
-- FOREIGN KEY CONSTRAINTS (ENSURE THEY EXIST)
-- ============================================

-- user_profiles foreign keys
ALTER TABLE public.user_profiles
ADD CONSTRAINT fk_user_profiles_assigned_barangay_id 
FOREIGN KEY (assigned_barangay_id) REFERENCES public.barangays(id) ON DELETE SET NULL;

-- barangays foreign keys
ALTER TABLE public.barangays
ADD CONSTRAINT fk_barangays_assigned_health_worker 
FOREIGN KEY (assigned_health_worker) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- vaccine_requests foreign keys
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT fk_vaccine_requests_barangay_id 
FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON DELETE CASCADE;

ALTER TABLE public.vaccine_requests
ADD CONSTRAINT fk_vaccine_requests_vaccine_id 
FOREIGN KEY (vaccine_id) REFERENCES public.vaccines(id) ON DELETE CASCADE;

ALTER TABLE public.vaccine_requests
ADD CONSTRAINT fk_vaccine_requests_requested_by 
FOREIGN KEY (requested_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- barangay_vaccine_inventory foreign keys
ALTER TABLE public.barangay_vaccine_inventory
ADD CONSTRAINT fk_barangay_vaccine_inventory_barangay_id 
FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON DELETE CASCADE;

ALTER TABLE public.barangay_vaccine_inventory
ADD CONSTRAINT fk_barangay_vaccine_inventory_vaccine_id 
FOREIGN KEY (vaccine_id) REFERENCES public.vaccines(id) ON DELETE CASCADE;

-- vaccination_sessions foreign keys
ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT fk_vaccination_sessions_barangay_id 
FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON DELETE CASCADE;

ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT fk_vaccination_sessions_vaccine_id 
FOREIGN KEY (vaccine_id) REFERENCES public.vaccines(id) ON DELETE CASCADE;

ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT fk_vaccination_sessions_created_by 
FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all constraints
-- SELECT constraint_name, table_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('user_profiles', 'barangays', 'vaccines', 'vaccine_requests', 'barangay_vaccine_inventory', 'vaccination_sessions')
-- ORDER BY table_name, constraint_name;

-- Check all check constraints
-- SELECT constraint_name, table_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_schema = 'public'
-- ORDER BY table_name, constraint_name;

-- ============================================
-- NOTES
-- ============================================
-- 
-- These constraints prevent:
-- ✅ Invalid data from being inserted
-- ✅ NULL values in critical columns
-- ✅ Duplicate emails/barangay names
-- ✅ Invalid status values
-- ✅ Negative quantities
-- ✅ Administered > target
-- ✅ Orphaned records (foreign key violations)
--
-- These constraints DO NOT prevent:
-- ❌ Adding new columns
-- ❌ Dropping columns
-- ❌ Renaming columns
-- ❌ Changing column types
--
-- To fully lock schema, use PostgreSQL roles and permissions
-- ============================================
