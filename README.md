# MERN Stack Real-Time Chat Application

A full-featured real-time chat application built with MongoDB, Express, React, and Node.js.

## ✨ Implemented Features

### 🔐 Authentication & Security
- ✅ JWT authentication with access & refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Protected routes with auth middleware
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Helmet security headers
- ✅ Input sanitization
- ✅ CORS configuration
- ✅ Environment variables for secrets

### 💬 Core Chat Features
- ✅ Real-time messaging with Socket.IO
- ✅ Private 1-on-1 chats
- ✅ Group chat creation
- ✅ Message reactions (👍 ❤️ 😂 😮)
- ✅ File & image sharing
- ✅ Message search functionality
- ✅ Reply to messages (threading)

### 👥 User Presence & Status
- ✅ Online/Offline status indicators
- ✅ Real-time typing indicators
- ✅ Unread message count badges
- ✅ Read receipts (message tracking)

### 🔔 Notifications
- ✅ Browser push notifications
- ✅ Unread message badges
- ✅ Auto-notification when tab is inactive

### 🎨 UI/UX Features
- ✅ Modern gradient design
- ✅ Smooth animations
- ✅ Responsive layout
- ✅ Message timestamps
- ✅ File preview before sending
- ✅ Auto-scroll to latest message
- ✅ Error toast notifications

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (running locally or cloud)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### Frontend Setup
```bash
cd client
npm install
npm start
```

## 📁 Project Structure

```
MERN/
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth & error handling
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── socket/          # Socket.IO handlers
│   ├── uploads/         # File storage
│   └── server.js        # Entry point
└── client/
    └── src/
        ├── EnhancedChatApp.js  # Main chat component
        └── EnhancedChat.css    # Styles
```

## 🔧 Configuration

### Environment Variables (.env)
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/mern-chat
JWT_SECRET=your_secret_key
REFRESH_SECRET=your_refresh_key
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

### Messages
- `GET /api/messages/room/:roomId` - Get room messages
- `POST /api/messages` - Send text message
- `POST /api/messages/file` - Send file message
- `POST /api/messages/:id/reactions` - Add reaction
- `GET /api/messages/search` - Search messages

### Rooms
- `GET /api/rooms/user/:userId` - Get user's rooms
- `POST /api/rooms/private` - Create private chat
- `POST /api/rooms/group` - Create group chat

## 🔌 Socket.IO Events

### Client → Server
- `userOnline` - User comes online
- `typing` - User is typing
- `joinRoom` - Join chat room
- `leaveRoom` - Leave chat room
- `messageRead` - Mark message as read

### Server → Client
- `newMessage` - New message received
- `userOnline` - User came online
- `userOffline` - User went offline
- `userTyping` - User typing status
- `messageReaction` - Reaction added
- `messageRead` - Message read by user

## 🎯 Key Features Explained

### Online Status
Users see green dots next to online users in real-time. Status updates automatically on connect/disconnect.

### Typing Indicators
When a user types, others see "User is typing..." below the messages. Indicator disappears 1 second after typing stops.

### Unread Counts
Red badges show unread message counts per chat. Counts reset when opening the chat.

### Read Receipts
Messages track which users have read them via the `readBy` array in the database.

### Browser Notifications
Desktop notifications appear for new messages when the browser tab is inactive (requires user permission).

### Security Features
- JWT tokens expire after 15 minutes (access) / 7 days (refresh)
- Passwords hashed with bcrypt (10 salt rounds)
- Rate limiting prevents API abuse
- Helmet adds security headers
- Input sanitization prevents XSS

## 🔒 Security Best Practices

1. **Never commit .env files** - Use .env.example as template
2. **Change default secrets** - Generate strong random keys
3. **Use HTTPS in production** - Enable SSL/TLS
4. **Validate all inputs** - Server-side validation
5. **Sanitize user content** - Prevent XSS attacks
6. **Implement CSRF protection** - For production apps
7. **Regular dependency updates** - Keep packages current

## 📝 Usage

1. **Register/Login** - Create account or login
2. **Start Chat** - Click user to start private chat
3. **Create Group** - Click "+ Create Group" button
4. **Send Messages** - Type and press Enter or click Send
5. **Share Files** - Click 📎 to attach files
6. **React to Messages** - Click emoji buttons on messages
7. **Search** - Use search bar to find messages

## 🐛 Troubleshooting

### Socket.IO not connecting
- Check backend is running on port 4000
- Verify CORS settings in server.js
- Check browser console for errors

### Messages not appearing
- Ensure you've joined a room
- Check MongoDB connection
- Verify socket event listeners

### File upload fails
- Check file size (max 10MB)
- Ensure uploads/ directory exists
- Verify multer configuration

## 🚧 Future Enhancements

- [ ] Message editing & deletion
- [ ] Voice/video messages
- [ ] Image preview in chat
- [ ] Message forwarding
- [ ] User profiles with avatars
- [ ] Archive chats
- [ ] Group admin controls
- [ ] Message pagination
- [ ] Dark mode
- [ ] Emoji picker
- [ ] Link previews
- [ ] Cloud storage (AWS S3)

## 📄 License

MIT License - Feel free to use for learning and projects

## 🤝 Contributing

Contributions welcome! Please follow standard Git workflow:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📧 Support

For issues or questions, please open a GitHub issue.

---

Built with ❤️ using MERN Stack
