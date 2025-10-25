# ClassPass - Ephemeral Attendance System

## 🎯 Overview

ClassPass is an innovative attendance tracking system that generates ephemeral codes displayed on smart boards. Students must enter these codes along with their ID to be marked present, preventing cheating through code sharing.

## ✨ Key Features

- **Ephemeral Codes**: Random codes that change every 5 minutes (format: COLOR-NUMBER-NOUN)
- **Anti-Cheat Protection**: Codes expire quickly, preventing sharing
- **Dual Interface**: Separate views for professors and students
- **Real-time Updates**: Live attendance tracking and countdown timers
- **Duplicate Prevention**: Students can only submit once per session
- **Responsive Design**: Works on any device with a browser

## 🚀 How It Works

### For Professors:
1. Open ClassPass on the smart board
2. Select the current class
3. Click "Start Attendance Session"
4. Display the generated code to students
5. Monitor real-time attendance
6. End session when complete

### For Students:
1. Open ClassPass on their device
2. Enter Student ID and current code from board
3. Submit before timer expires
4. Receive confirmation of attendance

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Custom CSS with modern gradients and animations
- **State Management**: React hooks (useState, useEffect)
- **Code Generation**: Custom algorithm with colors, numbers, and nouns

## 📱 Usage Instructions

### Starting the Application

```bash
cd QRAW
npm install
npm run dev
```

### Professor Workflow

1. **Switch to Professor View**: Click "Professor View" button
2. **Select Class**: Choose from dropdown (CS101, MATH201, etc.)
3. **Start Session**: Click "Start Attendance Session"
4. **Display Code**: Show the generated code on smart board
5. **Monitor Attendance**: Watch real-time student submissions
6. **End Session**: Click "End Session" when done

### Student Workflow

1. **Switch to Student View**: Click "Student View" button
2. **Check Session Status**: Ensure session is active
3. **Enter Information**: 
   - Student ID (e.g., "12345")
   - Attendance Code from board (e.g., "BLUE-42-DONUT")
4. **Submit**: Click "Submit Attendance"
5. **Confirmation**: Receive success/error message

## 🎨 Code Format

Codes follow the pattern: **COLOR-NUMBER-NOUN**

Examples:
- `RED-15-CAT`
- `BLUE-42-DONUT`
- `GREEN-7-EAGLE`
- `ORANGE-99-PIZZA`

## ⏰ Timer System

- **Session Duration**: 5 minutes per code
- **Auto-Refresh**: New code generated when timer expires
- **Visual Countdown**: Real-time timer display
- **Expiration Handling**: Graceful error messages for expired codes

## 🔒 Security Features

1. **Code Expiration**: 5-minute window prevents sharing
2. **Duplicate Prevention**: One submission per student ID per session
3. **Code Validation**: Exact match required
4. **Session Validation**: Must be active session
5. **Visual Verification**: Students must see the board

## 📊 Attendance Tracking

- **Real-time List**: Live updates of present students
- **Timestamp Recording**: When each student submitted
- **Session Management**: Track multiple sessions
- **Visual Feedback**: Clear success/error messages

## 🎯 Anti-Cheat Measures

1. **Ephemeral Codes**: Change every 5 minutes
2. **Physical Presence**: Students must see the board
3. **Time Pressure**: Limited submission window
4. **One-Time Use**: No duplicate submissions
5. **Visual Verification**: Code must be typed exactly

## 📱 Responsive Design

- **Mobile-Friendly**: Optimized for phones and tablets
- **Smart Board Ready**: Large, clear displays for boards
- **Cross-Platform**: Works on any modern browser
- **Touch-Friendly**: Easy interaction on touch devices

## 🔧 Customization Options

### Adding New Classes
Edit the `classes` array in `ProfessorBoard` component:
```javascript
const classes = ['CS101', 'MATH201', 'PHYS301', 'ENG401', 'YOUR_CLASS']
```

### Modifying Code Words
Update the `colors` and `nouns` arrays in `App.jsx`:
```javascript
const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'BROWN', 'BLACK', 'WHITE']
const nouns = ['CAT', 'DOG', 'FOX', 'BEAR', 'LION', 'TIGER', 'EAGLE', 'SHARK', 'DONUT', 'PIZZA']
```

### Changing Timer Duration
Modify the timer value in the `startSession` function:
```javascript
setTimeLeft(300) // 300 seconds = 5 minutes
```

## 🚀 Future Enhancements

- [ ] Real-time WebSocket communication
- [ ] Excel export functionality
- [ ] Attendance reports and analytics
- [ ] Multi-class session management
- [ ] Location verification (optional)
- [ ] Student roster integration
- [ ] Backup and restore features

## 🎉 Benefits

1. **Eliminates Manual Entry**: No more Excel spreadsheets
2. **Prevents Cheating**: Ephemeral codes stop sharing
3. **Engaging Experience**: Interactive and modern interface
4. **Time Efficient**: Quick setup and execution
5. **Accessible**: Works on any device with internet
6. **Reliable**: Consistent and accurate tracking

## 📞 Support

For questions or issues, please refer to the code comments or create an issue in the project repository.

---

**ClassPass** - Making attendance tracking simple, secure, and engaging! 🎓✨# QRAW
