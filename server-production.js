import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

// Configure CORS for Socket.IO - allow all origins for cross-network access
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false
  }
});

app.use(cors({
  origin: "*",
  credentials: false
}));
app.use(express.json());

// Serve static files (for production deployment)
app.use(express.static('dist'));

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
  maxSubmissionsPerIP: 3, // Prevent IP-based spam
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
    return { isDuplicate: true, reason: 'Student ID already submitted' };
  }
  
  // Check if same name exists with different ID
  const existingStudent = sessionData.attendanceList.find(student => 
    student.name.toLowerCase() === studentName.toLowerCase()
  );
  if (existingStudent) {
    return { isDuplicate: true, reason: 'Student name already registered' };
  }
  
  // Check IP-based spam prevention
  const ipCount = sessionData.ipSubmissionCount.get(ip) || 0;
  if (ipCount >= sessionData.maxSubmissionsPerIP) {
    return { isDuplicate: true, reason: 'Too many submissions from this network' };
  }
  
  // Check device fingerprint for suspicious activity
  const suspiciousDevices = Array.from(sessionData.studentRegistry.values())
    .filter(student => student.deviceFingerprint === deviceFingerprint);
  if (suspiciousDevices.length > 0) {
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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id, 'from:', socket.handshake.address);
  
  // Send current session data to newly connected client
  socket.emit('session-update', sessionData);
  
  // Handle professor actions
  socket.on('start-session', (data) => {
    const { className } = data;
    sessionData = {
      isActive: true,
      currentCode: generateAttendanceCode(),
      timeLeft: 300, // 5 minutes
      attendanceList: [],
      submittedIds: [],
      currentClassName: className,
      // Reset security data for new session
      studentRegistry: new Map(),
      maxSubmissionsPerIP: 3,
      ipSubmissionCount: new Map()
    };
    
    startSessionTimer();
    io.emit('session-update', sessionData);
    console.log('Session started for class:', className);
  });
  
  socket.on('end-session', () => {
    sessionData = {
      isActive: false,
      currentCode: '',
      timeLeft: 0,
      attendanceList: sessionData.attendanceList, // Keep attendance data
      submittedIds: sessionData.submittedIds,
      currentClassName: sessionData.currentClassName,
      // Keep security data for audit
      studentRegistry: sessionData.studentRegistry,
      maxSubmissionsPerIP: sessionData.maxSubmissionsPerIP,
      ipSubmissionCount: sessionData.ipSubmissionCount
    };
    
    stopSessionTimer();
    io.emit('session-update', sessionData);
    console.log('Session ended');
  });
  
  socket.on('submit-attendance', (data, callback) => {
    const { studentId, studentName, enteredCode } = data;
    const ip = getClientIP(socket);
    const deviceFingerprint = generateDeviceFingerprint(socket);
    
    // Comprehensive security checks
    const duplicateCheck = isDuplicateSubmission(studentId, studentName, socket);
    if (duplicateCheck.isDuplicate) {
      callback({ success: false, error: duplicateCheck.reason });
      console.log('Security violation:', duplicateCheck.reason, 'IP:', ip, 'Student:', studentId);
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
    
    // Additional validation
    if (!studentId || !studentName || studentId.trim() === '' || studentName.trim() === '') {
      callback({ success: false, error: 'Student ID and name are required.' });
      return;
    }
    
    // Add to attendance list and security registry
    const timestamp = new Date().toLocaleTimeString();
    const newStudent = { 
      id: studentId.trim(), 
      name: studentName.trim(), 
      timestamp,
      ipAddress: ip,
      deviceFingerprint: deviceFingerprint
    };
    
    sessionData.attendanceList.push(newStudent);
    sessionData.submittedIds.push(studentId.trim());
    
    // Update security tracking
    sessionData.studentRegistry.set(studentId.trim(), {
      name: studentName.trim(),
      ipAddress: ip,
      deviceFingerprint: deviceFingerprint,
      timestamp: timestamp
    });
    
    // Update IP submission count
    const currentIPCount = sessionData.ipSubmissionCount.get(ip) || 0;
    sessionData.ipSubmissionCount.set(ip, currentIPCount + 1);
    
    // Broadcast updated session data to all clients
    io.emit('session-update', sessionData);
    
    callback({ success: true });
    console.log('Attendance submitted:', studentId, studentName, 'IP:', ip);
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    connectedClients: io.engine.clientsCount,
    sessionActive: sessionData.isActive
  });
});

// Security monitoring endpoint (for professors)
app.get('/api/security-report', (req, res) => {
  const ipStats = Array.from(sessionData.ipSubmissionCount.entries())
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count);
  
  const deviceStats = Array.from(sessionData.studentRegistry.values())
    .reduce((acc, student) => {
      const fingerprint = student.deviceFingerprint;
      acc[fingerprint] = (acc[fingerprint] || 0) + 1;
      return acc;
    }, {});
  
  res.json({
    totalSubmissions: sessionData.attendanceList.length,
    uniqueIPs: sessionData.ipSubmissionCount.size,
    suspiciousIPs: ipStats.filter(stat => stat.count > 1),
    deviceFingerprints: Object.keys(deviceStats).length,
    maxSubmissionsPerIP: sessionData.maxSubmissionsPerIP,
    securityViolations: sessionData.attendanceList.filter(student => 
      sessionData.ipSubmissionCount.get(student.ipAddress) > 1
    )
  });
});

// Serve React app for all other routes (for production)
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'dist' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🌍 ClassPass server running on port ${PORT}`);
  console.log(`🌐 WebSocket server ready for cross-network connections`);
  console.log(`📱 Access from any device: http://localhost:${PORT}`);
  console.log(`🔗 For cross-network access, deploy to cloud platform`);
});
