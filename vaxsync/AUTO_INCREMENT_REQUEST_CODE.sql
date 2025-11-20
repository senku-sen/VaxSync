-- ============================================
-- AUTO-INCREMENT REQUEST CODE (VRC000)
-- ============================================
-- Automatically generates VRC000, VRC001, VRC002, etc.
-- for vaccine_requests.request_code
-- Last Updated: November 20, 2025
-- ============================================

-- ============================================
-- STEP 1: CREATE SEQUENCE FOR REQUEST CODE
-- ============================================
CREATE SEQUENCE IF NOT EXISTS public.vaccine_request_code_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- ============================================
-- STEP 2: CREATE FUNCTION TO GENERATE REQUEST CODE
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_request_code()
RETURNS VARCHAR AS $$
DECLARE
  next_val INTEGER;
  code VARCHAR;
BEGIN
  -- Get next value from sequence
  next_val := nextval('public.vaccine_request_code_seq');
  
  -- Format as VRC000, VRC001, VRC002, etc.
  code := 'VRC' || LPAD(next_val::TEXT, 3, '0');
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 3: CREATE TRIGGER TO AUTO-SET REQUEST CODE
-- ============================================
CREATE OR REPLACE FUNCTION public.set_request_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if request_code is NULL
  IF NEW.request_code IS NULL THEN
    NEW.request_code := public.generate_request_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS vaccine_requests_set_code_trigger ON public.vaccine_requests;

-- Create trigger on INSERT
CREATE TRIGGER vaccine_requests_set_code_trigger
BEFORE INSERT ON public.vaccine_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_request_code();

-- ============================================
-- STEP 4: UPDATE EXISTING RECORDS (OPTIONAL)
-- ============================================
-- If you have existing vaccine_requests without codes, run this:
-- UPDATE public.vaccine_requests
-- SET request_code = public.generate_request_code()
-- WHERE request_code IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if sequence exists
-- SELECT * FROM information_schema.sequences 
-- WHERE sequence_name = 'vaccine_request_code_seq';

-- Check if function exists
-- SELECT proname, prosrc FROM pg_proc 
-- WHERE proname IN ('generate_request_code', 'set_request_code');

-- Check if trigger exists
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'vaccine_requests_set_code_trigger';

-- Test: Insert a new vaccine request and check request_code
-- INSERT INTO public.vaccine_requests 
-- (barangay_id, vaccine_id, requested_by, quantity_dose, status)
-- VALUES ('uuid', 'uuid', 'uuid', 10, 'pending')
-- RETURNING id, request_code;

-- ============================================
-- NOTES
-- ============================================
--
-- How it works:
-- 1. Sequence generates: 1, 2, 3, 4, ...
-- 2. Function formats as: VRC001, VRC002, VRC003, ...
-- 3. Trigger automatically sets request_code on INSERT
--
-- Result:
-- ✅ First request: VRC001
-- ✅ Second request: VRC002
-- ✅ Third request: VRC003
-- ✅ Tenth request: VRC010
-- ✅ Hundredth request: VRC100
--
-- ============================================
