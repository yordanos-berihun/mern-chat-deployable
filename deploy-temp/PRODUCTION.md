# Production Setup - Real MongoDB App

## ✅ What Changed
- Switched from in-memory to MongoDB database
- Real user authentication with JWT
- Email verification system
- Password hashing with bcrypt
- Persistent data storage

## 🚀 Setup Steps

### 1. Seed Demo Users
```bash
cd backend
node seedDemoUsers.js
```

### 2. Configure Email (Optional)
For registration to work, add Gmail credentials to `.env`:
```
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Get App Password: Google Account → Security → 2-Step → App Passwords

### 3. Start Backend
```bash
cd backend
npm start
```

### 4. Start Frontend
```bash
cd client
npm start
```

## 🎯 Features Now Working

### Authentication
- ✅ Register with email verification
- ✅ Login with JWT tokens
- ✅ Password hashing (bcrypt)
- ✅ Token refresh
- ✅ Demo users (Alice, Bob, Charlie)

### Chat
- ✅ Real-time messaging
- ✅ Private & group chats
- ✅ Message reactions
- ✅ Reply to messages
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Online status

### Database
- ✅ MongoDB Atlas connected
- ✅ User persistence
- ✅ Message history
- ✅ Room management

## 🔐 Demo Login
- alice@demo.com / demo123
- bob@demo.com / demo123
- charlie@demo.com / demo123

## 📝 Register New User
1. Click "Register"
2. Fill form
3. Check email for verification link (if SMTP configured)
4. Click link to verify
5. Login

## ⚠️ Important
- Run `seedDemoUsers.js` first to create demo users
- Without SMTP config, new users can't verify email
- Demo users are pre-verified
