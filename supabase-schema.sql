-- ClassPass Supabase Database Schema

-- Sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  current_code TEXT,
  time_left INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Attendance records
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  device_fingerprint TEXT
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for attendance system)
CREATE POLICY "Allow public read access" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON attendance FOR SELECT USING (true);

-- Allow public insert for attendance
CREATE POLICY "Allow public insert attendance" ON attendance FOR INSERT WITH CHECK (true);

-- Allow public update for sessions (professor controls)
CREATE POLICY "Allow public update sessions" ON sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public insert sessions" ON sessions FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_sessions_active ON sessions(is_active);
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
