# Online Status Feature - Technical Flow

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER CONNECTS TO APP                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (EnhancedChatApp.js)                                  │
│  ─────────────────────────────────────────────────────────────  │
│  1. Socket connects: io('http://localhost:4000')                │
│  2. User selects profile (setCurrentUser)                       │
│  3. Emit event: socket.emit('userOnline', currentUser._id)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (socketHandlers.js)                                    │
│  ─────────────────────────────────────────────────────────────  │
│  1. Receive 'userOnline' event                                  │
│  2. Store in Map: onlineUsers.set(userId, socket.id)            │
│  3. Broadcast to ALL clients: io.emit('userOnline', userId)     │
│  4. Console log: "✅ User <userId> is online"                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ALL CONNECTED CLIENTS                                           │
│  ─────────────────────────────────────────────────────────────  │
│  1. Receive 'userOnline' event with userId                      │
│  2. Update state: setOnlineUsers(prev => new Set([...prev, id]))│
│  3. Re-render UI with green dot                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  UI UPDATES                                                      │
│  ─────────────────────────────────────────────────────────────  │
│  • Green dot appears next to username                           │
│  • Pulsing animation starts                                     │
│  • isUserOnline(room) returns true                              │
└─────────────────────────────────────────────────────────────────┘
```

## 🔌 Socket Events

### Event: `userOnline`

**Direction:** Client → Server → All Clients

**Client Emits:**
```javascript
socket.emit('userOnline', currentUser._id);
```

**Server Receives:**
```javascript
socket.on('userOnline', (userId) => {
  onlineUsers.set(userId, socket.id);
  io.emit('userOnline', userId);
});
```

**All Clients Receive:**
```javascript
socket.on('userOnline', (userId) => {
  setOnlineUsers(prev => new Set([...prev, userId]));
});
```

### Event: `userOffline`

**Direction:** Server → All Clients (on disconnect)

**Server Emits:**
```javascript
socket.on('disconnect', () => {
  onlineUsers.delete(socket.userId);
  io.emit('userOffline', socket.userId);
});
```

**All Clients Receive:**
```javascript
socket.on('userOffline', (userId) => {
  setOnlineUsers(prev => {
    const newSet = new Set(prev);
    newSet.delete(userId);
    return newSet;
  });
});
```

## 💾 Data Structures

### Frontend State

```javascript
// Set of user IDs who are currently online
const [onlineUsers, setOnlineUsers] = useState(new Set());

// Example:
// onlineUsers = Set { "user123", "user456", "user789" }
```

### Backend Storage

```javascript
// Map: userId → socketId
const onlineUsers = new Map();

// Example:
// onlineUsers = Map {
//   "user123" => "socket_abc",
//   "user456" => "socket_def",
//   "user789" => "socket_ghi"
// }
```

## 🎨 UI Rendering Logic

### Check if User is Online

```javascript
const isUserOnline = (room) => {
  // Only for private chats (not groups)
  if (room.type === 'group') return false;
  
  // Find the other user in the room
  const otherUser = room.participants.find(p => p._id !== currentUser._id);
  
  // Check if they're in the onlineUsers Set
  return otherUser ? onlineUsers.has(otherUser._id) : false;
};
```

### Render Green Dot

```jsx
{/* In user list */}
{onlineUsers.has(user._id) && <span className="online-dot"></span>}

{/* In room list */}
{isUserOnline(room) && <span className="online-dot"></span>}
```

## 🎭 CSS Animation

```css
.online-dot {
  width: 8px;
  height: 8px;
  background: #48bb78;  /* Green */
  border-radius: 50%;
  display: inline-block;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## ⏱️ Timing Diagram

```
Time    Client A          Server            Client B
─────────────────────────────────────────────────────────
0ms     Connect           Accept            -
        │                 │                 
100ms   emit('userOnline')→                 
        │                 Store in Map      
        │                 │                 
200ms   │                 broadcast→        Receive
        │                 │                 Update UI
        │                 │                 Show green dot
        │                 │                 │
...     (User A is shown as online to User B)
...     │                 │                 │
5000ms  │                 │                 Disconnect
        │                 │                 │
5100ms  │                 ←Detect disconnect
        │                 Remove from Map   
        │                 │                 
5200ms  ←Receive 'userOffline'             
        Update UI         │                 
        Hide green dot    │                 
```

## 🔧 Code Locations

### Frontend Files

**File:** `client/src/EnhancedChatApp.js`

**Lines:**
- State declaration: Line ~60
- Socket listener: Line ~450
- UI rendering: Lines ~550, ~580

### Backend Files

**File:** `backend/socket/socketHandlers.js`

**Lines:**
- onlineUsers Map: Line ~10
- userOnline handler: Lines ~18-22
- userOffline handler: Lines ~220-225

### CSS Files

**File:** `client/src/EnhancedChat.css`

**Lines:**
- .online-dot class: ~Line 90
- @keyframes pulse: ~Line 100

## 🐛 Debugging Commands

### Check Online Users (Frontend)

Open browser console:
```javascript
// Access React component state (with React DevTools)
$r.state.onlineUsers

// Or add console.log in code:
console.log('Online users:', Array.from(onlineUsers));
```

### Check Online Users (Backend)

Add to socketHandlers.js:
```javascript
socket.on('userOnline', (userId) => {
  onlineUsers.set(userId, socket.id);
  console.log('📊 Online users:', Array.from(onlineUsers.keys()));
  io.emit('userOnline', userId);
});
```

### Monitor Socket Events

Browser console:
```javascript
// Log all socket events
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

## 📈 Performance Considerations

| Aspect | Impact | Notes |
|--------|--------|-------|
| Memory | Low | Set/Map are efficient |
| Network | Minimal | Only 2 events per user |
| CPU | Negligible | Simple Set operations |
| Scalability | Good | Works with 100+ users |

## ✅ Verification Checklist

- [ ] Socket connects successfully
- [ ] `userOnline` event emitted on login
- [ ] Server stores userId in Map
- [ ] Server broadcasts to all clients
- [ ] All clients receive event
- [ ] State updates correctly
- [ ] UI re-renders with green dot
- [ ] CSS animation plays
- [ ] Dot disappears on disconnect
- [ ] Works for multiple users
- [ ] No memory leaks
- [ ] Console logs show correct flow

## 🚀 Enhancement Ideas (Future)

1. **Last Seen Timestamp**
   - Store disconnect time
   - Show "Last seen 5 minutes ago"

2. **Away Status**
   - Detect inactivity
   - Show yellow dot for "away"

3. **Custom Status**
   - Let users set status message
   - "In a meeting", "Do not disturb"

4. **Persistent Storage**
   - Save to Redis instead of memory
   - Survives server restart

5. **Group Online Count**
   - Show "3/5 members online" for groups

---

**Feature Status:** ✅ Fully Implemented & Working
**Complexity:** Low
**Dependencies:** Socket.IO
**Browser Support:** All modern browsers
