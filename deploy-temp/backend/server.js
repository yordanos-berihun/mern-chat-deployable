require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Security middleware imports
const { corsOptions, helmetConfig, securityHeaders } = require('./middleware/security');
const { apiLimiter, authLimiter, messageLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/sanitize');

// Route imports
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');
const roomRoutes = require('./routes/rooms');

const app = express();
const server = http.createServer(app);

// Socket.IO with CORS
// Explicitly provide ws engine to avoid engine.io wsEngine errors in some test environments
// Do not force a specific ws engine here; let socket.io pick the correct
// server-side implementation. For test environments that need a different
// engine, prefer controlling module resolution via Jest's moduleNameMapper
// or conditionally requiring a node-only engine at test runtime. Forcing
// `wsEngine` can cause the ws client to be initialized incorrectly in some
// jest/node environments which expect a server-side implementation.
const io = socketIo(server, {
  cors: corsOptions,
  transports: ['polling', 'websocket']
});

// Security middleware (order matters!)
app.use(helmetConfig);
app.use(securityHeaders);
app.use(cors(corsOptions));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/messages/', messageLimiter);

// Body parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ message: 'Invalid JSON payload' });
      return;
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Input sanitization
app.use(sanitizeInput);

// Cookie parser - required to read HttpOnly refresh tokens
app.use(cookieParser());

// MongoDB connection with security options
// In test environment, tests manage mongoose connections directly.
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
}

// Routes - Use MongoDB for production
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/link-preview', require('./routes/linkPreview'));
app.use('/api/upload', require('./routes/upload'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      details: isDevelopment ? err.message : 'Invalid input data'
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate entry'
    });
  }
  
  res.status(500).json({
    message: 'Internal server error',
    details: isDevelopment ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Rate limiting for socket events
  const socketRateLimit = new Map();
  
  const checkSocketRateLimit = (event) => {
    const now = Date.now();
    const key = `${socket.id}-${event}`;
    const limit = socketRateLimit.get(key) || { count: 0, resetTime: now + 60000 };
    
    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + 60000;
    }
    
    limit.count++;
    socketRateLimit.set(key, limit);
    
    return limit.count <= 30; // 30 events per minute
  };
  
  socket.on('joinRoom', (roomId) => {
    if (!checkSocketRateLimit('joinRoom')) return;
    socket.join(roomId);
  });
  
  socket.on('leaveRoom', (roomId) => {
    if (!checkSocketRateLimit('leaveRoom')) return;
    socket.leave(roomId);
  });
  
  socket.on('sendMessage', (data) => {
    if (!checkSocketRateLimit('sendMessage')) return;
    if (data.content && typeof data.content === 'string') {
      data.content = data.content.trim().substring(0, 1000);
      io.to(data.roomId).emit('newMessage', data);
    }
  });
  
  socket.on('userOnline', (userId) => {
    socket.userId = userId;
    io.emit('userOnline', userId);
  });
  
  socket.on('typing', ({ roomId, userId, userName, isTyping }) => {
    if (socket.userId) {
      socket.to(roomId).emit('userTyping', {
        userId,
        userName,
        roomId,
        isTyping
      });
    }
  });
  
  socket.on('messageEdited', ({ messageId, content, roomId }) => {
    io.to(roomId).emit('messageEdited', { messageId, content, editedAt: new Date() });
  });
  
  socket.on('messageDeleted', ({ messageId, roomId, deleteForEveryone }) => {
    io.to(roomId).emit('messageDeleted', { messageId, deleteForEveryone });
  });
  
  socket.on('messageReaction', ({ messageId, roomId, reactions }) => {
    io.to(roomId).emit('messageReaction', { messageId, reactions });
  });
  
  socket.on('messageRead', ({ messageId, roomId, userId }) => {
    io.to(roomId).emit('messageRead', { messageId, userId });
  });
  
  // WebRTC signaling
  socket.on('call:offer', ({ to, offer, from }) => {
    io.to(to).emit('call:offer', { offer, from: socket.id, fromUser: from });
  });
  
  socket.on('call:answer', ({ to, answer }) => {
    io.to(to).emit('call:answer', { answer, from: socket.id });
  });
  
  socket.on('call:ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('call:ice-candidate', { candidate, from: socket.id });
  });
  
  socket.on('call:end', ({ to }) => {
    io.to(to).emit('call:end', { from: socket.id });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      io.emit('userOffline', socket.userId);
      io.emit('call:end', { from: socket.id });
    }
    socketRateLimit.delete(socket.id);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

// Only start the server when not running under tests.
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔒 Security features enabled`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
}

// Export the express app for tests (supertest expects the app)
module.exports = app;