import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';

const app = express();
const server = createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store session data in memory (in production, use a database)
let sessionData = {
  isActive: false,
  currentCode: '',
  timeLeft: 0,
  attendanceList: [],
  submittedIds: [],
  currentClassName: '',
  // Add student verification
  studentRegistry: new Map(), // studentId -> { name, ipAddress, deviceFingerprint }
  maxSubmissionsPerIP: 1, // Prevent IP-based spam
  ipSubmissionCount: new Map() // ipAddress -> count
};

// Timer for automatic code refresh
let sessionTimer = null;

const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'BROWN', 'BLACK', 'WHITE'];
const nouns = ['CAT', 'DOG', 'FOX', 'BEAR', 'LION', 'TIGER', 'EAGLE', 'SHARK', 'DONUT', 'PIZZA', 'CAKE', 'STAR', 'MOON', 'SUN', 'TREE', 'ROCK', 'BIRD', 'FISH', 'CAR', 'BIKE'];

const generateAttendanceCode = () => {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const number = Math.floor(Math.random() * 100) + 1;
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${color}-${number}-${noun}`;
};

// Security functions
const getClientIP = (socket) => {
  return socket.handshake.address || 
         socket.handshake.headers['x-forwarded-for'] || 
         socket.conn.remoteAddress;
};

const generateDeviceFingerprint = (socket) => {
  const ip = getClientIP(socket);
  const userAgent = socket.handshake.headers['user-agent'] || '';
  return `${ip}-${userAgent.slice(0, 50)}`;
};

const isDuplicateSubmission = (studentId, studentName, socket) => {
  const ip = getClientIP(socket);
  const deviceFingerprint = generateDeviceFingerprint(socket);
  
  // Check if student ID already exists
  if (sessionData.submittedIds.includes(studentId)) {
    console.log(`Security: Duplicate ID attempt - ${studentId} from IP: ${ip}`);
    return { isDuplicate: true, reason: 'Student ID already submitted' };
  }
  
  // Check if same name exists with different ID (case-insensitive)
  const existingStudent = sessionData.attendanceList.find(student => 
    student.name.toLowerCase().trim() === studentName.toLowerCase().trim()
  );
  if (existingStudent) {
    console.log(`Security: Duplicate name attempt - "${studentName}" (ID: ${studentId}) already exists as "${existingStudent.name}" (ID: ${existingStudent.id}) from IP: ${ip}`);
    return { isDuplicate: true, reason: 'Student name already registered' };
  }
  
  // Check IP-based spam prevention
  const ipCount = sessionData.ipSubmissionCount.get(ip) || 0;
  if (ipCount >= sessionData.maxSubmissionsPerIP) {
    console.log(`Security: IP rate limit exceeded - ${ip} has ${ipCount} submissions`);
    return { isDuplicate: true, reason: 'Too many submissions from this network' };
  }
  
  // Check device fingerprint for suspicious activity
  const suspiciousDevices = Array.from(sessionData.studentRegistry.values())
    .filter(student => student.deviceFingerprint === deviceFingerprint);
  if (suspiciousDevices.length > 0) {
    console.log(`Security: Device fingerprint match - ${deviceFingerprint} already used by ${suspiciousDevices[0].name} (${suspiciousDevices[0].ipAddress})`);
    return { isDuplicate: true, reason: 'Device already used for submission' };
  }
  
  return { isDuplicate: false };
};

const startSessionTimer = () => {
  if (sessionTimer) {
    clearInterval(sessionTimer);
  }
  
  sessionTimer = setInterval(() => {
    if (sessionData.isActive && sessionData.timeLeft > 0) {
      sessionData.timeLeft -= 1;
      
      if (sessionData.timeLeft <= 0) {
        // Generate new code when timer expires
        sessionData.currentCode = generateAttendanceCode();
        sessionData.timeLeft = 300; // Reset to 5 minutes
      }
      
      // Broadcast updated session data to all connected clients
      io.emit('session-update', sessionData);
    }
  }, 1000);
};

const stopSessionTimer = () => {
  if (sessionTimer) {
    clearInterval(sessionTimer);
    sessionTimer = null;
  }
};

// Function to automatically export attendance data to desktop
const autoExportToDesktop = (attendanceData) => {
  try {
    // Get desktop path
    const desktopPath = path.join(os.homedir(), 'Desktop');
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `ClassPass_Attendance_${attendanceData.currentClassName}_${timestamp}.json`;
    const filePath = path.join(desktopPath, filename);
    
    // Prepare export data
    const exportData = {
      class: attendanceData.currentClassName,
      sessionDate: new Date().toLocaleDateString(),
      sessionTime: new Date().toLocaleTimeString(),
      totalStudents: attendanceData.attendanceList.length,
      attendanceList: attendanceData.attendanceList,
      exportedAt: new Date().toISOString()
    };
    
    // Write to desktop
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Attendance data automatically exported to desktop: ${filename}`);
    return { success: true, filePath, filename };
  } catch (error) {
    console.error('❌ Error auto-exporting to desktop:', error);
    return { success: false, error: error.message };
  }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current session data to newly connected client
  socket.emit('session-update', sessionData);
  
  // Handle professor actions
  socket.on('start-session', (data) => {
    const { className } = data;
    // Reset ALL session data including security tracking
    sessionData = {
      isActive: true,
      currentCode: generateAttendanceCode(),
      timeLeft: 300, // 5 minutes
      attendanceList: [],
      submittedIds: [],
      currentClassName: className,
      // Reset security tracking for new session
      studentRegistry: new Map(),
      maxSubmissionsPerIP: 1,
      ipSubmissionCount: new Map()
    };
    
    startSessionTimer();
    io.emit('session-update', sessionData);
    console.log('Session started for class:', className);
  });
  
  socket.on('end-session', () => {
    // Auto-export attendance data to desktop before ending session
    if (sessionData.attendanceList.length > 0) {
      const exportResult = autoExportToDesktop(sessionData);
      if (exportResult.success) {
        console.log(`📁 Attendance data saved to: ${exportResult.filePath}`);
        // Notify all connected clients about the auto-export
        io.emit('auto-export-complete', {
          message: `Attendance data automatically exported to desktop: ${exportResult.filename}`,
          filename: exportResult.filename,
          totalStudents: sessionData.attendanceList.length
        });
      } else {
        console.error('Failed to auto-export:', exportResult.error);
        io.emit('auto-export-error', {
          message: 'Failed to automatically export attendance data',
          error: exportResult.error
        });
      }
    } else {
      console.log('No attendance data to export');
      io.emit('auto-export-complete', {
        message: 'Session ended with no attendance data to export',
        totalStudents: 0
      });
    }
    
    sessionData = {
      isActive: false,
      currentCode: '',
      timeLeft: 0,
      attendanceList: sessionData.attendanceList, // Keep attendance data
      submittedIds: sessionData.submittedIds,
      currentClassName: sessionData.currentClassName
    };
    
    stopSessionTimer();
    io.emit('session-update', sessionData);
    console.log('Session ended');
  });
  
  socket.on('submit-attendance', (data, callback) => {
    const { studentId, studentName, enteredCode } = data;
    
    // Enhanced security validation
    const duplicateCheck = isDuplicateSubmission(studentId, studentName, socket);
    if (duplicateCheck.isDuplicate) {
      callback({ success: false, error: duplicateCheck.reason });
      return;
    }
    
    // Check if code matches
    if (enteredCode !== sessionData.currentCode) {
      callback({ success: false, error: 'Invalid code. Please check the board and try again.' });
      return;
    }
    
    // Check if session is still active
    if (!sessionData.isActive || sessionData.timeLeft <= 0) {
      callback({ success: false, error: 'Session has expired. Please wait for the next code.' });
      return;
    }
    
    // Get client IP and device fingerprint for security tracking
    const ip = getClientIP(socket);
    const deviceFingerprint = generateDeviceFingerprint(socket);
    
    // Add to attendance list
    const timestamp = new Date().toLocaleTimeString();
    const newStudent = { id: studentId, name: studentName, timestamp };
    
    sessionData.attendanceList.push(newStudent);
    sessionData.submittedIds.push(studentId);
    
    // Update security tracking
    sessionData.studentRegistry.set(studentId, {
      name: studentName,
      ipAddress: ip,
      deviceFingerprint: deviceFingerprint
    });
    
    // Update IP submission count
    const currentIpCount = sessionData.ipSubmissionCount.get(ip) || 0;
    sessionData.ipSubmissionCount.set(ip, currentIpCount + 1);
    
    // Broadcast updated session data to all clients
    io.emit('session-update', sessionData);
    
    callback({ success: true });
    console.log('Attendance submitted:', studentId, studentName, 'from IP:', ip);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// REST API endpoints
app.get('/api/session', (req, res) => {
  res.json(sessionData);
});

app.post('/api/export-attendance', (req, res) => {
  if (sessionData.attendanceList.length === 0) {
    res.status(400).json({ error: 'No attendance data to export' });
    return;
  }
  
  res.json({
    class: sessionData.currentClassName,
    attendanceList: sessionData.attendanceList,
    sessionDate: new Date().toLocaleDateString(),
    sessionTime: new Date().toLocaleTimeString(),
    totalStudents: sessionData.attendanceList.length
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`ClassPass server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});
