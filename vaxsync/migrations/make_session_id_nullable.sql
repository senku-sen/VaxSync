-- Make session_id nullable in session_beneficiaries table
-- This allows storing custom vaccines/dates that are not associated with a specific session

ALTER TABLE session_beneficiaries
ALTER COLUMN session_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN session_beneficiaries.session_id IS 'Foreign key to vaccination_sessions. Can be NULL for custom vaccines/dates not tied to a specific session.';
