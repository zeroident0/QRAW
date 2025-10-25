import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database helper functions
export const db = {
  // Session management
  async getCurrentSession() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('is_active', true)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching session:', error)
      return null
    }
    return data
  },

  async createSession(className) {
    // End any existing active session
    await supabase
      .from('sessions')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('is_active', true)

    // Create new session
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        class_name: className,
        is_active: true,
        current_code: generateAttendanceCode(),
        time_left: 300
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating session:', error)
      return null
    }
    return data
  },

  async endSession() {
    const { error } = await supabase
      .from('sessions')
      .update({ 
        is_active: false, 
        ended_at: new Date().toISOString() 
      })
      .eq('is_active', true)

    if (error) {
      console.error('Error ending session:', error)
      return false
    }
    return true
  },

  async updateSession(updates) {
    const { error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('is_active', true)

    if (error) {
      console.error('Error updating session:', error)
      return false
    }
    return true
  },

  // Attendance management
  async getAttendance(sessionId) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching attendance:', error)
      return []
    }
    return data
  },

  async submitAttendance(sessionId, studentId, studentName, enteredCode, ipAddress, deviceFingerprint) {
    // Input validation
    if (!studentId || !studentName || !enteredCode) {
      return { success: false, error: 'All fields are required' }
    }

    // Rate limiting: Check for recent submissions from same IP/device (within last 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()
    const { data: recentSubmissions } = await supabase
      .from('attendance')
      .select('id')
      .eq('session_id', sessionId)
      .or(`ip_address.eq.${ipAddress},device_fingerprint.eq.${deviceFingerprint}`)
      .gte('timestamp', thirtySecondsAgo)

    if (recentSubmissions && recentSubmissions.length > 0) {
      return { 
        success: false, 
        error: 'Rate limit exceeded. Please wait 30 seconds before submitting again.' 
      }
    }

    // Sanitize inputs
    const sanitizedStudentId = studentId.trim().toUpperCase()
    const sanitizedStudentName = studentName.trim()
    const sanitizedCode = enteredCode.trim().toUpperCase()

    // Validate student ID format (alphanumeric, 3-20 characters)
    if (!/^[A-Z0-9]{3,20}$/.test(sanitizedStudentId)) {
      return { success: false, error: 'Invalid student ID format. Use 3-20 alphanumeric characters.' }
    }

    // Validate student name format (letters, spaces, hyphens, apostrophes, 2-50 characters)
    if (!/^[A-Za-z\s\-']{2,50}$/.test(sanitizedStudentName)) {
      return { success: false, error: 'Invalid name format. Use 2-50 letters, spaces, hyphens, or apostrophes.' }
    }

    // First get the current session to validate the code
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('current_code, is_active, time_left')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return { success: false, error: 'Session not found' }
    }

    // Check if session is active
    if (!session.is_active) {
      return { success: false, error: 'Session is not active' }
    }

    // Check if time has expired
    if (session.time_left <= 0) {
      return { success: false, error: 'Session has expired' }
    }

    // Validate the entered code
    if (sanitizedCode !== session.current_code) {
      return { success: false, error: 'Invalid code. Please check the board and try again.' }
    }

    // Check if student already submitted
    const { data: existing } = await supabase
      .from('attendance')
      .select('id, student_name')
      .eq('session_id', sessionId)
      .eq('student_id', sanitizedStudentId)
      .single()

    if (existing) {
      // If student ID exists but with different name, this is a security violation
      if (existing.student_name !== sanitizedStudentName) {
        return { 
          success: false, 
          error: 'Security violation: Student ID already registered with different name. Please contact the professor.' 
        }
      }
      return { success: false, error: 'Student ID already submitted' }
    }

    // Check if name already exists with different ID
    const { data: nameExists } = await supabase
      .from('attendance')
      .select('id, student_id')
      .eq('session_id', sessionId)
      .eq('student_name', sanitizedStudentName)
      .single()

    if (nameExists) {
      // If name exists but with different ID, this is a security violation
      if (nameExists.student_id !== sanitizedStudentId) {
        return { 
          success: false, 
          error: 'Security violation: Student name already registered with different ID. Please contact the professor.' 
        }
      }
      return { success: false, error: 'Student name already registered' }
    }

    // Submit attendance
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        session_id: sessionId,
        student_id: sanitizedStudentId,
        student_name: sanitizedStudentName,
        ip_address: ipAddress,
        device_fingerprint: deviceFingerprint
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting attendance:', error)
      return { success: false, error: 'Failed to submit attendance' }
    }

    return { success: true, data }
  },

  // Real-time subscriptions
  subscribeToSession(callback) {
    console.log('🔗 Setting up session subscription...')
    const subscription = supabase
      .channel('session-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sessions' },
        callback
      )
      .subscribe((status) => {
        console.log('🔗 Session subscription status:', status)
      })
    
    console.log('🔗 Session subscription created:', subscription)
    return subscription
  },

  subscribeToAttendance(sessionId, callback) {
    console.log('🔗 Setting up attendance subscription...')
    const subscription = supabase
      .channel('attendance-updates')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance' },
        callback
      )
      .subscribe((status) => {
        console.log('🔗 Attendance subscription status:', status)
      })
    
    console.log('🔗 Attendance subscription created:', subscription)
    return subscription
  }
}

// Generate attendance code (same as before)
const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'BROWN', 'BLACK', 'WHITE']
const nouns = ['CAT', 'DOG', 'FOX', 'BEAR', 'LION', 'TIGER', 'EAGLE', 'SHARK', 'DONUT', 'PIZZA', 'CAKE', 'STAR', 'MOON', 'SUN', 'TREE', 'ROCK', 'BIRD', 'FISH', 'CAR', 'BIKE']

function generateAttendanceCode() {
  const color = colors[Math.floor(Math.random() * colors.length)]
  const number = Math.floor(Math.random() * 100) + 1
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${color}-${number}-${noun}`
}
