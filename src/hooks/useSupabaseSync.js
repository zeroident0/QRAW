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
export const useSupabaseSync = () => {
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
        const { data, error } = await supabase.from('sessions').select('id').limit(1)
        setIsConnected(!error)
      } catch (err) {
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
      console.log('Session updated:', payload)
      loadCurrentSession()
    })

    // Subscribe to attendance changes
    const attendanceSubscription = db.subscribeToAttendance(null, (payload) => {
      console.log('Attendance updated:', payload)
      loadCurrentSession()
    })

    // Debug: Log current session data
    console.log('Initial session data loaded:', sessionData)

    // Countdown timer
    const timerInterval = setInterval(async () => {
      setSessionData(prev => {
        if (prev.isActive && prev.timeLeft > 0) {
          const newTimeLeft = prev.timeLeft - 1
          
          // If timer reaches 0, generate new code and reset timer
          if (newTimeLeft <= 0) {
            const newCode = generateAttendanceCode()
            // Update session in database with new code and reset timer
            db.updateSession({
              current_code: newCode,
              time_left: 300
            })
            
            return {
              ...prev,
              timeLeft: 300,
              currentCode: newCode
            }
          }
          
          // Update timer in database every 10 seconds to avoid too many DB calls
          if (newTimeLeft % 10 === 0) {
            db.updateSession({ time_left: newTimeLeft })
          }
          
          return {
            ...prev,
            timeLeft: newTimeLeft
          }
        }
        return prev
      })
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
    if (!sessionData.sessionId) {
      return { success: false, error: 'No active session' }
    }

    // Get client info (simplified for browser)
    const ipAddress = 'unknown' // Would need server-side detection
    const deviceFingerprint = navigator.userAgent.slice(0, 50)

    return await db.submitAttendance(
      sessionData.sessionId,
      studentId,
      studentName,
      enteredCode,
      ipAddress,
      deviceFingerprint
    )
  }

  return [sessionData, updateSessionData, submitAttendance, isConnected, autoExportMessage]
}
