-- Security Migration: Add constraints to prevent identity spoofing
-- IMPORTANT: Run fix-attendance-data.sql FIRST to clean existing data
-- Then run this SQL in your Supabase SQL editor

-- First, check if data is ready for constraints
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Check for invalid student_id formats
    SELECT COUNT(*) INTO invalid_count 
    FROM attendance 
    WHERE NOT (student_id ~ '^[A-Z0-9]{3,20}$');
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % records with invalid student_id format. Run fix-attendance-data.sql first!', invalid_count;
    END IF;
    
    -- Check for invalid student_name formats
    SELECT COUNT(*) INTO invalid_count 
    FROM attendance 
    WHERE NOT (student_name ~ '^[A-Za-z\s\-'']{2,50}$');
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % records with invalid student_name format. Run fix-attendance-data.sql first!', invalid_count;
    END IF;
    
    RAISE NOTICE 'Data validation passed. Proceeding with constraint creation...';
END $$;

-- Add unique constraint to prevent duplicate student IDs in the same session
-- This ensures a student ID can only appear once per session
ALTER TABLE attendance 
ADD CONSTRAINT unique_student_per_session 
UNIQUE (session_id, student_id);

-- Add unique constraint to prevent duplicate student names in the same session  
-- This ensures a student name can only appear once per session
ALTER TABLE attendance 
ADD CONSTRAINT unique_name_per_session 
UNIQUE (session_id, student_name);

-- Add index for rate limiting queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_attendance_rate_limit ON attendance(session_id, ip_address, timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_device_rate_limit ON attendance(session_id, device_fingerprint, timestamp);

-- Add check constraint to validate student ID format
ALTER TABLE attendance 
ADD CONSTRAINT check_student_id_format 
CHECK (student_id ~ '^[A-Z0-9]{3,20}$');

-- Add check constraint to validate student name format
ALTER TABLE attendance 
ADD CONSTRAINT check_student_name_format 
CHECK (student_name ~ '^[A-Za-z\s\-'']{2,50}$');

-- Add comment explaining the security measures
COMMENT ON TABLE attendance IS 'Attendance records with security constraints to prevent identity spoofing';
COMMENT ON CONSTRAINT unique_student_per_session ON attendance IS 'Prevents same student ID from being used multiple times in one session';
COMMENT ON CONSTRAINT unique_name_per_session ON attendance IS 'Prevents same student name from being used multiple times in one session';
