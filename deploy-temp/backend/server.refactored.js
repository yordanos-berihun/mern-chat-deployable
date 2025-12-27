require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const connectDB = require('./config/connectDB');
const { corsOptions, helmetConfig, securityHeaders } = require('./middleware/security');
const { apiLimiter, authLimiter, messageLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/sanitize');
const { errorHandler, notFoundHandler } = require('./handlers/errorHandlers');
const setupSocketHandlers = require('./handlers/socketHandlers');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: corsOptions, transports: ['polling', 'websocket'] });

app.use(helmetConfig);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/messages/', messageLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));
app.use(sanitizeInput);

connectDB();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/link-preview', require('./routes/link-preview'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.use(errorHandler);
app.use('*', notFoundHandler);

setupSocketHandlers(io);

process.on('SIGTERM', () => {
  server.close(() => {
    require('mongoose').connection.close();
    process.exit(0);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`🔒 Security enabled`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
