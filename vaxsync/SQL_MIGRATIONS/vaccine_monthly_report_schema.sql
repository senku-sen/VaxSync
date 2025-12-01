-- SQL Migration: Vaccine Monthly Report Table
-- This table stores the monthly vaccine inventory reports with NIP standard calculations

-- Create vaccine_monthly_report table if it doesn't exist
CREATE TABLE IF NOT EXISTS vaccine_monthly_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_id UUID NOT NULL REFERENCES vaccines(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  
  -- Inventory Data (INTEGER ONLY - numeric values only)
  initial_inventory INTEGER NOT NULL DEFAULT 0 CHECK (initial_inventory >= 0),
  quantity_supplied INTEGER NOT NULL DEFAULT 0 CHECK (quantity_supplied >= 0),
  quantity_used INTEGER NOT NULL DEFAULT 0 CHECK (quantity_used >= 0),
  quantity_wastage INTEGER NOT NULL DEFAULT 0 CHECK (quantity_wastage >= 0),
  ending_inventory INTEGER NOT NULL DEFAULT 0 CHECK (ending_inventory >= 0),
  
  -- NIP Standard Calculations (INTEGER ONLY - numeric values only)
  vials_needed INTEGER NOT NULL DEFAULT 0 CHECK (vials_needed >= 0),
  max_allocation INTEGER NOT NULL DEFAULT 0 CHECK (max_allocation >= 0),
  stock_level_percentage INTEGER NOT NULL DEFAULT 0 CHECK (stock_level_percentage >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'GOOD',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: One report per vaccine per month
  UNIQUE(vaccine_id, month)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vaccine_monthly_report_vaccine_id ON vaccine_monthly_report(vaccine_id);
CREATE INDEX IF NOT EXISTS idx_vaccine_monthly_report_month ON vaccine_monthly_report(month);
CREATE INDEX IF NOT EXISTS idx_vaccine_monthly_report_status ON vaccine_monthly_report(status);

-- Disable RLS (Row Level Security) for easier access
-- RLS can be enabled later with proper policies if needed
ALTER TABLE vaccine_monthly_report DISABLE ROW LEVEL SECURITY;

-- Create a view for easier querying with vaccine details
CREATE OR REPLACE VIEW vaccine_monthly_report_with_details AS
SELECT 
  vmr.id,
  vmr.vaccine_id,
  v.name as vaccine_name,
  v.batch_number,
  vmr.month,
  vmr.initial_inventory,
  vmr.quantity_supplied,
  vmr.quantity_used,
  vmr.quantity_wastage,
  vmr.ending_inventory,
  vmr.vials_needed,
  vmr.max_allocation,
  vmr.stock_level_percentage,
  vmr.status,
  vmr.created_at,
  vmr.updated_at
FROM vaccine_monthly_report vmr
LEFT JOIN vaccines v ON vmr.vaccine_id = v.id
ORDER BY vmr.month DESC, v.name ASC;

-- Grant permissions to all authenticated users
GRANT ALL PRIVILEGES ON vaccine_monthly_report TO authenticated;
GRANT ALL PRIVILEGES ON vaccine_monthly_report_with_details TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Allow anon users to read (optional)
GRANT SELECT ON vaccine_monthly_report TO anon;
GRANT SELECT ON vaccine_monthly_report_with_details TO anon;
