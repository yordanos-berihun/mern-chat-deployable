const express = require('express');
const router = express.Router();

// In-memory storage for messages per room
const roomMessages = new Map();

// Get messages for a room
router.get('/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  // Get messages for this room
  const messages = roomMessages.get(roomId) || [];
  const total = messages.length;
  
  // Sort by newest first and paginate
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  
  const sortedMessages = messages
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(startIndex, startIndex + limitNum);
  
  res.json({
    success: true,
    data: {
      messages: sortedMessages,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Send a message
router.post('/', (req, res) => {
  const { senderId, room, content, replyTo } = req.body;
  
  if (!senderId || !room || !content) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  const authRouter = require('./auth-simple');
  const allUsers = authRouter.users ? Array.from(authRouter.users.values()) : [];
  const sender = allUsers.find(u => u._id === senderId);
  
  const senderName = sender ? sender.name : `User ${senderId.slice(-4)}`;
  
  let replyToMessage = null;
  if (replyTo) {
    const messages = roomMessages.get(room) || [];
    replyToMessage = messages.find(m => m._id === replyTo);
  }
  
  const newMessage = {
    _id: `msg_${Date.now()}`,
    content: content,
    sender: { _id: senderId, name: senderName, email: sender?.email },
    room: room,
    messageType: 'text',
    createdAt: new Date(),
    readBy: [senderId],
    reactions: [],
    replyTo: replyToMessage ? {
      _id: replyToMessage._id,
      content: replyToMessage.content,
      sender: replyToMessage.sender
    } : null
  };
  
  const messages = roomMessages.get(room) || [];
  messages.push(newMessage);
  roomMessages.set(room, messages);
  
  res.status(201).json({
    success: true,
    data: newMessage
  });
});

// Search messages in a room
router.get('/search', (req, res) => {
  const { roomId, query } = req.query;
  
  if (!roomId || !query) {
    return res.status(400).json({ message: 'Room ID and query required' });
  }
  
  const messages = roomMessages.get(roomId) || [];
  const results = messages.filter(msg => 
    msg.content.toLowerCase().includes(query.toLowerCase())
  );
  
  res.json({
    success: true,
    data: results
  });
});

// 📝 EDIT MESSAGE - Update message content
router.put('/:messageId', (req, res) => {
  const { messageId } = req.params;
  const { content, userId } = req.body;
  
  if (!content || !userId) {
    return res.status(400).json({ message: 'Content and userId required' });
  }
  
  // Find message in all rooms
  let messageFound = false;
  let updatedMessage = null;
  
  for (const [roomId, messages] of roomMessages.entries()) {
    const messageIndex = messages.findIndex(msg => msg._id === messageId);
    
    if (messageIndex !== -1) {
      const message = messages[messageIndex];
      
      // Check if user is the sender
      if (message.sender._id !== userId) {
        return res.status(403).json({ message: 'Not authorized to edit this message' });
      }
      
      // Update message
      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();
      
      messages[messageIndex] = message;
      roomMessages.set(roomId, messages);
      
      updatedMessage = message;
      messageFound = true;
      break;
    }
  }
  
  if (!messageFound) {
    return res.status(404).json({ message: 'Message not found' });
  }
  
  res.json({
    success: true,
    data: updatedMessage
  });
});

// 🗑️ DELETE MESSAGE - Remove message from chat
router.delete('/:messageId', (req, res) => {
  const { messageId } = req.params;
  const { userId, deleteForEveryone } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'userId required' });
  }
  
  let messageFound = false;
  let roomId = null;
  
  for (const [rId, messages] of roomMessages.entries()) {
    const messageIndex = messages.findIndex(msg => msg._id === messageId);
    
    if (messageIndex !== -1) {
      const message = messages[messageIndex];
      
      // Check if user is the sender for "delete for everyone"
      if (deleteForEveryone && message.sender._id !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete for everyone' });
      }
      
      if (deleteForEveryone) {
        // Delete for everyone - remove from array
        messages.splice(messageIndex, 1);
        roomMessages.set(rId, messages);
      } else {
        // Delete for me - mark as deleted for this user
        if (!message.deletedFor) message.deletedFor = [];
        if (!message.deletedFor.includes(userId)) {
          message.deletedFor.push(userId);
        }
        messages[messageIndex] = message;
        roomMessages.set(rId, messages);
      }
      
      roomId = rId;
      messageFound = true;
      break;
    }
  }
  
  if (!messageFound) {
    return res.status(404).json({ message: 'Message not found' });
  }
  
  res.json({
    success: true,
    data: { messageId, roomId, deleteForEveryone }
  });
});

// 👍 ADD REACTION - Add emoji reaction to message
router.post('/:messageId/reaction', (req, res) => {
  const { messageId } = req.params;
  const { userId, emoji } = req.body;
  
  if (!userId || !emoji) {
    return res.status(400).json({ message: 'userId and emoji required' });
  }
  
  let messageFound = false;
  let updatedMessage = null;
  let roomId = null;
  
  for (const [rId, messages] of roomMessages.entries()) {
    const messageIndex = messages.findIndex(msg => msg._id === messageId);
    
    if (messageIndex !== -1) {
      const message = messages[messageIndex];
      
      if (!message.reactions) message.reactions = [];
      
      const existingReaction = message.reactions.findIndex(
        r => r.user === userId && r.emoji === emoji
      );
      
      if (existingReaction !== -1) {
        message.reactions.splice(existingReaction, 1);
      } else {
        message.reactions.push({ user: userId, emoji, createdAt: new Date() });
      }
      
      messages[messageIndex] = message;
      roomMessages.set(rId, messages);
      
      updatedMessage = message;
      roomId = rId;
      messageFound = true;
      break;
    }
  }
  
  if (!messageFound) {
    return res.status(404).json({ message: 'Message not found' });
  }
  
  res.json({
    success: true,
    data: { messageId, roomId, reactions: updatedMessage.reactions }
  });
});

// ✓ MARK AS READ - Mark message as read by user
router.post('/:messageId/read', (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'userId required' });
  }
  
  let messageFound = false;
  let updatedMessage = null;
  let roomId = null;
  
  for (const [rId, messages] of roomMessages.entries()) {
    const messageIndex = messages.findIndex(msg => msg._id === messageId);
    
    if (messageIndex !== -1) {
      const message = messages[messageIndex];
      
      if (!message.readBy) message.readBy = [];
      
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
      }
      
      messages[messageIndex] = message;
      roomMessages.set(rId, messages);
      
      updatedMessage = message;
      roomId = rId;
      messageFound = true;
      break;
    }
  }
  
  if (!messageFound) {
    return res.status(404).json({ message: 'Message not found' });
  }
  
  res.json({
    success: true,
    data: { messageId, roomId, readBy: updatedMessage.readBy }
  });
});

// ➡️ FORWARD MESSAGE - Forward message to another room
router.post('/:messageId/forward', (req, res) => {
  const { messageId } = req.params;
  const { userId, targetRoomIds } = req.body;
  
  if (!userId || !targetRoomIds || !Array.isArray(targetRoomIds)) {
    return res.status(400).json({ message: 'userId and targetRoomIds array required' });
  }
  
  // Find original message
  let originalMessage = null;
  for (const [rId, messages] of roomMessages.entries()) {
    const message = messages.find(msg => msg._id === messageId);
    if (message) {
      originalMessage = message;
      break;
    }
  }
  
  if (!originalMessage) {
    return res.status(404).json({ message: 'Message not found' });
  }
  
  const authRouter = require('./auth-simple');
  const allUsers = authRouter.users ? Array.from(authRouter.users.values()) : [];
  const sender = allUsers.find(u => u._id === userId);
  const senderName = sender ? sender.name : `User ${userId.slice(-4)}`;
  
  const forwardedMessages = [];
  
  // Forward to each target room
  targetRoomIds.forEach(targetRoomId => {
    const forwardedMessage = {
      _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: originalMessage.content,
      sender: { _id: userId, name: senderName, email: sender?.email },
      room: targetRoomId,
      messageType: originalMessage.messageType,
      attachment: originalMessage.attachment,
      createdAt: new Date(),
      readBy: [userId],
      reactions: [],
      forwardedFrom: {
        messageId: originalMessage._id,
        originalSender: originalMessage.sender,
        originalRoom: originalMessage.room
      }
    };
    
    const messages = roomMessages.get(targetRoomId) || [];
    messages.push(forwardedMessage);
    roomMessages.set(targetRoomId, messages);
    forwardedMessages.push(forwardedMessage);
  });
  
  res.json({
    success: true,
    data: { forwardedMessages, count: forwardedMessages.length }
  });
});

module.exports = router;