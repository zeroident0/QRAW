import { useState, useEffect } from 'react'
import { supabase, db } from '../lib/supabase.js'

// Generate attendance code (same as in App.jsx)
const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'BROWN', 'BLACK', 'WHITE']
const nouns = ['CAT', 'DOG', 'FOX', 'BEAR', 'LION', 'TIGER', 'EAGLE', 'SHARK', 'DONUT', 'PIZZA', 'CAKE', 'STAR', 'MOON', 'SUN', 'TREE', 'ROCK', 'BIRD', 'FISH', 'CAR', 'BIKE']

const generateAttendanceCode = () => {
  const color = colors[Math.floor(Math.random() * colors.length)]
  const number = Math.floor(Math.random() * 100) + 1
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${color}-${number}-${noun}`
}

// Supabase-based session synchronization
export const useSupabaseSync = (isProfessor = false) => {
  const [sessionData, setSessionData] = useState({
    isActive: false,
    currentCode: '',
    timeLeft: 0,
    attendanceList: [],
    submittedIds: [],
    currentClassName: '',
    sessionId: null
  })

  const [isConnected, setIsConnected] = useState(false)
  const [autoExportMessage, setAutoExportMessage] = useState('')

  useEffect(() => {
    // Check connection
    const checkConnection = async () => {
      try {
        console.log('🔍 Checking Supabase connection...')
        console.log('🔍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
        console.log('🔍 Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
        
        const { data, error } = await supabase.from('sessions').select('id').limit(1)
        console.log('🔍 Connection test result:', { data, error })
        setIsConnected(!error)
        
        if (error) {
          console.error('❌ Supabase connection failed:', error)
        } else {
          console.log('✅ Supabase connection successful')
        }
      } catch (err) {
        console.error('❌ Supabase connection error:', err)
        setIsConnected(false)
      }
    }

    checkConnection()

    // Load current session
    const loadCurrentSession = async () => {
      const session = await db.getCurrentSession()
      if (session) {
        const attendance = await db.getAttendance(session.id)
        setSessionData({
          isActive: session.is_active,
          currentCode: session.current_code,
          timeLeft: session.time_left,
          attendanceList: attendance.map(a => ({
            id: a.student_id,
            name: a.student_name,
            timestamp: new Date(a.timestamp).toLocaleTimeString()
          })),
          submittedIds: attendance.map(a => a.student_id),
          currentClassName: session.class_name,
          sessionId: session.id
        })
      }
    }

    loadCurrentSession()

    // Subscribe to session changes
    const sessionSubscription = db.subscribeToSession((payload) => {
      console.log('🔔 Session updated:', payload)
      loadCurrentSession()
    })

    // Subscribe to attendance changes (listen to all attendance changes)
    const attendanceSubscription = db.subscribeToAttendance(null, (payload) => {
      console.log('📝 Attendance updated:', payload)
      console.log('📝 Payload details:', JSON.stringify(payload, null, 2))
      loadCurrentSession() // Reload session data when any attendance changes
    })

    // Test subscription status
    console.log('🔗 Setting up real-time subscriptions...')
    console.log('🔗 Session subscription:', sessionSubscription)
    console.log('🔗 Attendance subscription:', attendanceSubscription)
    
    // Test if subscriptions are working by checking their status
    setTimeout(() => {
      console.log('🔍 Checking subscription status after 2 seconds...')
      console.log('🔍 Session subscription state:', sessionSubscription?.state)
      console.log('🔍 Attendance subscription state:', attendanceSubscription?.state)
      
      // Test real-time by manually inserting a test record
      console.log('🧪 Testing real-time by inserting test record...')
      supabase.from('attendance').insert({
        session_id: '00000000-0000-0000-0000-000000000000', // dummy ID
        student_id: 'TEST123',
        student_name: 'Test Student',
        ip_address: 'test',
        device_fingerprint: 'test'
      }).then(result => {
        console.log('🧪 Test insert result:', result)
      }).catch(err => {
        console.log('🧪 Test insert error (expected):', err)
      })
    }, 2000)

    // Debug: Log current session data
    console.log('Initial session data loaded:', sessionData)

    // Only professors update the timer - students just display the current value
    const timerInterval = setInterval(async () => {
      if (isProfessor) {
        try {
          const session = await db.getCurrentSession()
          if (session && session.is_active && session.time_left > 0) {
            const newTimeLeft = session.time_left - 1
            
            if (newTimeLeft <= 0) {
              // Generate new code and reset timer
              const newCode = generateAttendanceCode()
              await db.updateSession({
                current_code: newCode,
                time_left: 300
              })
            } else {
              // Update timer
              await db.updateSession({ time_left: newTimeLeft })
            }
          }
        } catch (error) {
          console.log('Timer update error:', error)
        }
      }
    }, 1000)

    // Cleanup
    return () => {
      clearInterval(timerInterval)
      sessionSubscription.unsubscribe()
      attendanceSubscription.unsubscribe()
    }
  }, [])

  const updateSessionData = async (newData) => {
    if (newData.isActive !== undefined) {
      if (newData.isActive) {
        const session = await db.createSession(newData.currentClassName)
        if (session) {
          setSessionData(prev => ({
            ...prev,
            isActive: true,
            currentCode: session.current_code,
            timeLeft: session.time_left,
            currentClassName: session.class_name,
            sessionId: session.id
          }))
        }
      } else {
        await db.endSession()
        setSessionData(prev => ({
          ...prev,
          isActive: false,
          currentCode: '',
          timeLeft: 0
        }))
      }
    }
  }

  const submitAttendance = async (studentId, studentName, enteredCode) => {
    console.log('Submitting attendance:', { studentId, studentName, enteredCode, sessionId: sessionData.sessionId })
    
    if (!sessionData.sessionId) {
      return { success: false, error: 'No active session' }
    }

    // Get client info (simplified for browser)
    const ipAddress = 'unknown' // Would need server-side detection
    const deviceFingerprint = navigator.userAgent.slice(0, 50)

    const result = await db.submitAttendance(
      sessionData.sessionId,
      studentId,
      studentName,
      enteredCode,
      ipAddress,
      deviceFingerprint
    )
    
    console.log('Attendance submission result:', result)
    return result
  }

  return [sessionData, updateSessionData, submitAttendance, isConnected, autoExportMessage]
}

