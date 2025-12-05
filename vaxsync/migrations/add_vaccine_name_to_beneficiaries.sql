-- Add vaccine_name column to session_beneficiaries table
-- This stores the vaccine name for custom vaccines (when session_id is null)

ALTER TABLE session_beneficiaries
ADD COLUMN vaccine_name VARCHAR(255);

-- Add comment explaining the column
COMMENT ON COLUMN session_beneficiaries.vaccine_name IS 'Vaccine name for custom vaccines (when session_id is null). For session-based vaccines, this is null and vaccine info comes from the vaccination_sessions table.';

-- Create index for faster queries
CREATE INDEX idx_session_beneficiaries_vaccine_name ON session_beneficiaries(vaccine_name);
