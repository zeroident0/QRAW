import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import './App.css'
import { useSupabaseSync } from './hooks/useSupabaseSync'

// Cross-device synchronization using Supabase
const useSocketSync = () => {
  return useSupabaseSync()
}

// Utility functions for code generation
const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'BROWN', 'BLACK', 'WHITE']
const nouns = ['CAT', 'DOG', 'FOX', 'BEAR', 'LION', 'TIGER', 'EAGLE', 'SHARK', 'DONUT', 'PIZZA', 'CAKE', 'STAR', 'MOON', 'SUN', 'TREE', 'ROCK', 'BIRD', 'FISH', 'CAR', 'BIKE']

const generateAttendanceCode = () => {
  const color = colors[Math.floor(Math.random() * colors.length)]
  const number = Math.floor(Math.random() * 100) + 1
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${color}-${number}-${noun}`
}

// Professor Board Component
const ProfessorBoard = ({ onStartSession, onEndSession, currentCode, timeLeft, isActive, attendanceList, currentClassName, autoExportMessage }) => {
  const [selectedClass, setSelectedClass] = useState('CS101')
  const classes = ['CS101', 'MATH201', 'PHYS301', 'ENG401']

  const exportToExcel = () => {
    if (attendanceList.length === 0) {
      alert('No attendance data to export!')
      return
    }

    // Prepare data for Excel
    const excelData = [
      ['ClassPass Attendance Report'],
      ['Class:', currentClassName || selectedClass],
      ['Session Date:', new Date().toLocaleDateString()],
      ['Session Time:', new Date().toLocaleTimeString()],
      ['Total Students Present:', attendanceList.length],
      [], // Empty row
      ['Student ID', 'Student Name', 'Timestamp', 'Status']
    ]

    // Add attendance data
    attendanceList.forEach(student => {
      excelData.push([student.id, student.name, student.timestamp, 'Present'])
    })

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report')

    // Style the header rows
    const range = XLSX.utils.decode_range(ws['!ref'])
    for (let row = 0; row <= 5; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        if (!ws[cellAddress]) continue
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "000000" } },
          fgColor: { rgb: "FFFFFF" }
        }
      }
    }

    // Style the data header row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 6, c: col })
      if (!ws[cellAddress]) continue
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "F0F0F0" } }
      }
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `ClassPass_Attendance_${currentClassName || selectedClass}_${timestamp}.xlsx`

    // Save the file
    XLSX.writeFile(wb, filename)
  }

  return (
    <div className="professor-board">
      <div className="board-header">
        <h1>ClassPass - Professor Dashboard</h1>
        <div className="class-selector">
          <label>Select Class:</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
      </div>

      {autoExportMessage && (
        <div className={`auto-export-message ${autoExportMessage.includes('❌') ? 'error' : 'success'}`}>
          <span className="export-icon">📁</span>
          <span>{autoExportMessage}</span>
        </div>
      )}

      {!isActive ? (
        <div className="session-controls">
          <button 
            className="start-session-btn"
            onClick={() => onStartSession(selectedClass)}
          >
            Start Attendance Session
          </button>
        </div>
      ) : (
        <div className="active-session">
          <div className="attendance-code-display">
            <h2>Current Attendance Code</h2>
            <div className="code-display">
              <span className="attendance-code">{currentCode}</span>
            </div>
            <div className="timer-display">
              <span className="timer">Time Left: {timeLeft}s</span>
            </div>
          </div>

          <div className="attendance-list">
            <h3>Students Present ({attendanceList.length})</h3>
            <div className="student-list">
              {attendanceList.map((student, index) => (
                <div key={index} className="student-item">
                  <div className="student-info">
                    <span className="student-id">{student.id}</span>
                    <span className="student-name">{student.name}</span>
                  </div>
                  <span className="timestamp">{student.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="session-actions">
            <button 
              className="export-btn"
              onClick={exportToExcel}
              disabled={attendanceList.length === 0}
            >
              📊 Export to Excel
            </button>
            <button 
              className="end-session-btn"
              onClick={onEndSession}
            >
              End Session
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Student Form Component
const StudentForm = ({ onSubmitAttendance, currentCode, timeLeft, isActive, submittedIds }) => {
  const [studentId, setStudentId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [enteredCode, setEnteredCode] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if current student ID has already submitted
  const hasAlreadySubmitted = submittedIds.includes(studentId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isActive) {
      setMessage('No active session. Please wait for the professor to start attendance.')
      return
    }

    if (timeLeft <= 0) {
      setMessage('Session has expired. Please wait for the next code.')
      return
    }

    if (hasAlreadySubmitted) {
      setMessage('❌ You have already submitted attendance for this session.')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const result = await onSubmitAttendance(studentId, studentName, enteredCode)
      if (result.success) {
        setMessage('✅ Attendance Recorded Successfully!')
        setStudentId('')
        setStudentName('')
        setEnteredCode('')
      } else {
        setMessage(`❌ ${result.error}`)
      }
    } catch (error) {
      setMessage('❌ Error submitting attendance. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="student-form">
      <div className="form-header">
        <h1>ClassPass - Student</h1>
        <div className="session-status">
          {isActive ? (
            <div className="status-active">
              <span className="status-indicator">🟢</span>
              <span>Session Active - {timeLeft}s remaining</span>
            </div>
          ) : (
            <div className="status-inactive">
              <span className="status-indicator">🔴</span>
              <span>No Active Session</span>
            </div>
          )}
        </div>

        {hasAlreadySubmitted && studentId && (
          <div className="already-submitted-warning">
            <span className="warning-icon">⚠️</span>
            <span>You have already submitted attendance for this session.</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="attendance-form">
        <div className="form-group">
          <label htmlFor="studentId">Student ID:</label>
          <input
            type="text"
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Enter your student ID"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentName">Full Name:</label>
          <input
            type="text"
            id="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter your full name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="attendanceCode">Attendance Code:</label>
          <input
            type="text"
            id="attendanceCode"
            value={enteredCode}
            onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
            placeholder="Enter code from the board"
            required
            disabled={isSubmitting}
          />
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting || !isActive || hasAlreadySubmitted}
        >
          {isSubmitting ? 'Submitting...' : hasAlreadySubmitted ? 'Already Submitted' : 'Submit Attendance'}
        </button>
      </form>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="instructions">
        <h3>Instructions:</h3>
        <ol>
          <li>Look at the smart board for the current attendance code</li>
          <li>Enter your Student ID, Full Name, and the code exactly as shown</li>
          <li>Submit before the timer runs out</li>
          <li>You can only submit once per session</li>
        </ol>
      </div>
    </div>
  )
}

// Main App Component
function App() {
  const [userRole, setUserRole] = useState(null) // null, 'professor', or 'student'
  const [professorPassword, setProfessorPassword] = useState('')
  const [sessionData, updateSessionData, submitAttendanceToServer, isConnected, autoExportMessage] = useSocketSync()

  // Professor password (in real app, this would be server-side)
  const PROFESSOR_PASSWORD = 'professor123'

  const handleRoleSelection = (role) => {
    if (role === 'professor') {
      // Show password prompt for professor access
      const password = prompt('Enter professor password:')
      if (password === PROFESSOR_PASSWORD) {
        setUserRole('professor')
      } else {
        alert('Invalid password. Access denied.')
      }
    } else {
      setUserRole('student')
    }
  }

  const logout = () => {
    setUserRole(null)
    // Don't clear session data on logout - let it persist across tabs
  }

  const startSession = (className) => {
    updateSessionData({
      isActive: true,
      currentClassName: className
    })
  }

  const endSession = () => {
    updateSessionData({
      isActive: false
    })
  }

  const submitAttendance = async (studentId, studentName, enteredCode) => {
    // Use server-side validation and submission
    return await submitAttendanceToServer(studentId, studentName, enteredCode)
  }

  return (
    <div className="app">
      {!userRole ? (
        <div className="role-selection">
          <div className="role-selection-card">
            <h1>ClassPass</h1>
            <p className="subtitle">Ephemeral Attendance System</p>
            
            <div className="role-buttons">
              <button 
                className="professor-btn"
                onClick={() => handleRoleSelection('professor')}
              >
                <div className="role-icon">👨‍🏫</div>
                <div className="role-title">Professor</div>
                <div className="role-description">Start attendance sessions and manage classes</div>
              </button>
              
              <button 
                className="student-btn"
                onClick={() => handleRoleSelection('student')}
              >
                <div className="role-icon">🎓</div>
                <div className="role-title">Student</div>
                <div className="role-description">Submit attendance with your ID and code</div>
              </button>
            </div>
            
            <div className="security-notice">
              <p>🔒 Secure access control ensures only authorized users can manage sessions</p>
            </div>
            
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-icon">{isConnected ? '🟢' : '🔴'}</span>
              <span>{isConnected ? 'Connected to server' : 'Disconnected from server'}</span>
            </div>
          </div>
        </div>
      ) : userRole === 'professor' ? (
        <div>
          <div className="user-header">
            <span className="user-info">👨‍🏫 Professor Mode</span>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
          <ProfessorBoard
            onStartSession={startSession}
            onEndSession={endSession}
            currentCode={sessionData.currentCode}
            timeLeft={sessionData.timeLeft}
            isActive={sessionData.isActive}
            attendanceList={sessionData.attendanceList}
            currentClassName={sessionData.currentClassName}
            autoExportMessage={autoExportMessage}
          />
        </div>
      ) : (
        <div>
          <div className="user-header">
            <span className="user-info">🎓 Student Mode</span>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
          <StudentForm
            onSubmitAttendance={submitAttendance}
            currentCode={sessionData.currentCode}
            timeLeft={sessionData.timeLeft}
            isActive={sessionData.isActive}
            submittedIds={sessionData.submittedIds}
          />
        </div>
      )}
    </div>
  )
}

export default App