// MERN Stack - Enhanced Message Routes
// API endpoints for handling chat messages with rooms and file sharing

const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const Room = require('../models/room');
const { uploadSingle } = require('../middleware/upload');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// SEND TEXT MESSAGE
// POST /api/messages
router.post('/', asyncHandler(async (req, res) => {
  const { senderId, roomId, content } = req.body;
  
  if (!senderId || !roomId || !content) {
    return res.status(400).json({ error: 'Sender, room, and content required' });
  }
  
  const message = await Message.create({
    sender: senderId,
    room: roomId,
    content,
    messageType: 'text'
  });
  
  await message.populate('sender', 'name email');
  
  // Update room last activity
  await Room.findByIdAndUpdate(roomId, {
    lastMessage: message._id,
    lastActivity: new Date()
  });
  
  // Emit to Socket.IO
  req.io.to(roomId).emit('newMessage', message);
  
  res.status(201).json({ success: true, data: message });
}));

// SEND FILE MESSAGE
// POST /api/messages/file
router.post('/file',
  uploadSingle('file'),
  asyncHandler(async (req, res) => {
    const { senderId, roomId } = req.body;
    
    if (!req.uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const messageType = req.uploadedFile.mimetype.startsWith('image/') ? 'image' : 'file';
    
    const message = await Message.create({
      sender: senderId,
      room: roomId,
      messageType,
      content: `Shared ${messageType}: ${req.uploadedFile.originalName}`,
      attachment: {
        filename: req.uploadedFile.filename,
        url: req.uploadedFile.url,
        size: req.uploadedFile.size,
        mimetype: req.uploadedFile.mimetype
      }
    });
    
    await message.populate('sender', 'name email');
    
    await Room.findByIdAndUpdate(roomId, {
      lastMessage: message._id,
      lastActivity: new Date()
    });
    
    req.io.to(roomId).emit('newMessage', message);
    
    res.status(201).json({ success: true, data: message });
  })
);

// GET ROOM MESSAGES
// GET /api/messages/room/:roomId
router.get('/room/:roomId', asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  
  const messages = await Message.find({ room: roomId, isDeleted: false })
    .populate('sender', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  res.json({ success: true, data: messages.reverse() });
}));

// ADD REACTION
// POST /api/messages/:messageId/reactions
router.post('/:messageId/reactions', asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { userId, emoji } = req.body;
  
  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  await message.addReaction(userId, emoji);
  await message.populate('sender', 'name email');
  
  req.io.to(message.room.toString()).emit('messageReaction', {
    messageId,
    userId,
    emoji,
    reactions: message.reactions
  });
  
  res.json({ success: true, data: message });
}));

// SEARCH MESSAGES
// GET /api/messages/search
router.get('/search', asyncHandler(async (req, res) => {
  const { roomId, query } = req.query;
  
  if (!roomId || !query) {
    return res.status(400).json({ error: 'Room ID and search query required' });
  }
  
  const messages = await Message.find({
    room: roomId,
    isDeleted: false,
    content: { $regex: query, $options: 'i' }
  })
  .populate('sender', 'name email')
  .sort({ createdAt: -1 })
  .limit(20);
  
  res.json({ success: true, data: messages });
}));

module.exports = router;