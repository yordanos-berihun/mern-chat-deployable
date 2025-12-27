# ⚡ MERN Stack Quick Reference

## 🚀 **Quick Start Commands**

```bash
# Backend
cd "C:\Users\tg computer\Desktop\New folder\MERN"
npm install
node server.js

# Frontend (new terminal)
cd client
npm install
npm start
```

## 📋 **File Locations**

| What | Where |
|------|-------|
| Main server | `server.js` |
| User routes | `routes/users.js` |
| Chat routes | `routes/messages.js` |
| User model | `models/user.js` |
| Message model | `models/message.js` |
| Socket handlers | `socket/socketHandlers.js` |
| React main | `client/src/App.js` |
| Chat UI | `client/src/ChatApp.js` |

## 🔗 **API Endpoints**

### **Users**
```
GET    /api/users          → List all users
GET    /api/users/:id      → Get one user
POST   /api/users          → Create user
PUT    /api/users/:id      → Update user
DELETE /api/users/:id      → Delete user
```

### **Messages**
```
GET    /api/messages       → Get messages
POST   /api/messages       → Send message
PUT    /api/messages/:id   → Edit message
DELETE /api/messages/:id   → Delete message
```

### **Auth**
```
POST   /api/auth/register  → Register user
POST   /api/auth/login     → Login user
```

## 🔌 **Socket.IO Events**

### **Client → Server**
```javascript
socket.emit('authenticate', { userId, token })
socket.emit('sendMessage', { content, room })
socket.emit('typing', { isTyping: true })
```

### **Server → Client**
```javascript
socket.on('authenticated', (data) => {})
socket.on('newMessage', (message) => {})
socket.on('userOnline', (user) => {})
socket.on('userTyping', (data) => {})
```

## 🎨 **React State Patterns**

```javascript
// Simple state
const [value, setValue] = useState(initial);

// Fetch data
useEffect(() => {
  fetchData();
}, []);

// Optimized callback
const handleClick = useCallback(() => {
  // logic
}, [dependencies]);

// Update array
setItems(prev => [...prev, newItem]);

// Update object
setUser(prev => ({ ...prev, name: newName }));
```

## 🗄️ **MongoDB Queries**

```javascript
// Find all
User.find()

// Find one
User.findById(id)

// Create
new User(data).save()

// Update
User.findByIdAndUpdate(id, data, { new: true })

// Delete
User.findByIdAndDelete(id)

// With population
User.find().populate('sender', 'name email')
```

## 🐛 **Common Errors & Fixes**

| Error | Fix |
|-------|-----|
| EADDRINUSE | Port busy → Close other apps |
| MongoDB connection failed | Start MongoDB: `mongod` |
| Cannot find module | Run `npm install` |
| CORS error | Check server CORS config |
| 404 Not Found | Check route path and method |
| 500 Server Error | Check backend console logs |

## 📊 **Testing URLs**

```
Backend Health:  http://localhost:4000/
Users API:       http://localhost:4000/api/users
Messages API:    http://localhost:4000/api/messages
Frontend:        http://localhost:3000/
```

## 🔍 **Debugging Tips**

```javascript
// Backend
console.log('Request:', req.body);
console.log('User:', user);

// Frontend
console.log('State:', users);
console.log('Response:', result);

// Browser DevTools
F12 → Console tab (errors)
F12 → Network tab (API calls)
F12 → Application tab (storage)
```

## 📦 **Package Versions**

```json
Backend:
- express: ^4.18.2
- mongoose: ^8.0.3
- socket.io: ^4.7.4
- cors: ^2.8.5
- bcrypt: ^5.1.1
- jsonwebtoken: ^9.0.2

Frontend:
- react: ^19.2.3
- react-dom: ^19.2.3
- socket.io-client: ^4.7.4
```

## 🎯 **Key Concepts**

**REST API**: Request → Response → Close
**WebSocket**: Persistent connection
**State**: Data that changes over time
**Props**: Data passed to components
**Hooks**: React functions (useState, useEffect)
**Middleware**: Functions that run before routes
**Schema**: Database structure definition
**Population**: MongoDB join operation

## 🚀 **Next Features to Add**

1. ✅ User profiles with avatars
2. ✅ Private messaging
3. ✅ Message search
4. ✅ File uploads
5. ✅ Emoji reactions
6. ✅ Video calls
7. ✅ Push notifications
8. ✅ Dark mode

## 📚 **Documentation Links**

- MongoDB: https://docs.mongodb.com/
- Express: https://expressjs.com/
- React: https://react.dev/
- Socket.IO: https://socket.io/docs/
- Node.js: https://nodejs.org/docs/

---

**Remember**: Read START_HERE.md for detailed instructions!