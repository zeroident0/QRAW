# ClassPass - Cross-Device Attendance System

## 🌐 **Cross-Device & Cross-Network Support**

ClassPass now works across different devices and networks using a real-time WebSocket server!

## 🚀 **Setup Instructions**

### **1. Install Server Dependencies**
```bash
cd QRAW
npm install express socket.io cors nodemon
```

### **2. Start the Server**
```bash
# Option 1: Direct start
node server.js

# Option 2: Development mode with auto-restart
npx nodemon server.js
```

The server will start on `http://localhost:3001`

### **3. Start the React App**
```bash
npm run dev
```

The React app will start on `http://localhost:5173`

## 🌍 **Cross-Device Usage**

### **For Professors:**
1. **Smart Board**: Open `http://localhost:3001` on the smart board
2. **Laptop**: Open `http://localhost:3001` on your laptop
3. **Phone**: Open `http://localhost:3001` on your phone
4. **Any Device**: All devices show the same session status!

### **For Students:**
1. **Phone**: Open `http://localhost:3001` on your phone
2. **Laptop**: Open `http://localhost:3001` on your laptop
3. **Tablet**: Open `http://localhost:3001` on your tablet
4. **Any Device**: All devices see the same attendance code!

## 🔄 **Real-Time Synchronization**

### **What Works Across Devices:**
- ✅ **Session Status**: Active/Inactive synchronized instantly
- ✅ **Attendance Codes**: Same code on all devices
- ✅ **Timer Countdown**: Synchronized countdown everywhere
- ✅ **Attendance List**: Real-time updates across all devices
- ✅ **Duplicate Prevention**: Works across all devices
- ✅ **Connection Status**: Shows server connection status

### **Example Scenarios:**

**Scenario 1: Professor starts session**
- Smart Board: Shows "Session Active" with code
- Student Phone: Immediately shows "🟢 Session Active"
- Student Laptop: Shows same code and timer
- Professor Phone: Shows live attendance list

**Scenario 2: Student submits attendance**
- Student Phone: Submits attendance
- Smart Board: Shows new student in list instantly
- Professor Laptop: Sees updated count
- Other Students: See updated attendance count

**Scenario 3: Timer expires**
- All Devices: Code changes simultaneously
- All Devices: Timer resets to 5 minutes
- All Devices: New code appears everywhere

## 🛠️ **Technical Features**

### **Server Architecture:**
- **Express.js**: REST API endpoints
- **Socket.IO**: Real-time WebSocket communication
- **CORS**: Cross-origin resource sharing enabled
- **In-Memory Storage**: Session data stored on server

### **Client Features:**
- **Socket.IO Client**: Real-time connection to server
- **Connection Status**: Visual indicator of server connection
- **Auto-Reconnection**: Automatically reconnects if connection drops
- **Error Handling**: Graceful handling of network issues

### **Security Features:**
- **Server-Side Validation**: All validation happens on server
- **Real-Time Updates**: No localStorage vulnerabilities
- **Cross-Device Sync**: Works across different networks
- **Role-Based Access**: Professor password protection

## 📱 **Network Requirements**

### **Local Network:**
- All devices must be on the same WiFi network
- Server runs on `localhost:3001`
- Clients connect to `http://[server-ip]:3001`

### **Internet Deployment:**
- Deploy server to cloud (Heroku, AWS, etc.)
- Update client connection URL
- Works across different networks worldwide

## 🔧 **Configuration**

### **Server Port:**
```javascript
const PORT = process.env.PORT || 3001;
```

### **Client Connection:**
```javascript
const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling']
});
```

### **Production Deployment:**
```javascript
// Update this URL for production
const socket = io('https://your-server.com', {
  transports: ['websocket', 'polling']
});
```

## 🎯 **Benefits**

1. **True Multi-Device**: Works on any device with a browser
2. **Cross-Network**: Students can be on different networks
3. **Real-Time**: Instant updates across all devices
4. **Reliable**: Server-side validation and storage
5. **Scalable**: Can handle many concurrent users
6. **Professional**: Production-ready architecture

## 🚨 **Troubleshooting**

### **Connection Issues:**
- Check if server is running on port 3001
- Verify all devices are on same network
- Check firewall settings
- Look for connection status indicator

### **Performance Issues:**
- Server handles all validation
- Client only displays data
- WebSocket is more efficient than polling
- Automatic reconnection on network issues

---

**ClassPass** - Now truly cross-device and cross-network! 🌍✨
