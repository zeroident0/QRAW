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
    // First check if student already submitted
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .single()

    if (existing) {
      return { success: false, error: 'Student ID already submitted' }
    }

    // Check if name already exists
    const { data: nameExists } = await supabase
      .from('attendance')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_name', studentName)
      .single()

    if (nameExists) {
      return { success: false, error: 'Student name already registered' }
    }

    // Submit attendance
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        student_name: studentName,
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
    return supabase
      .channel('session-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sessions' },
        callback
      )
      .subscribe()
  },

  subscribeToAttendance(sessionId, callback) {
    return supabase
      .channel('attendance-updates')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance' },
        callback
      )
      .subscribe()
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
