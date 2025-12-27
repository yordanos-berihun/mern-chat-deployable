const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const User = require('../models/user');

// Get messages for a room with pagination
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const total = await Message.countDocuments({ room: roomId });
    const messages = await Message.find({ room: roomId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    res.json({
      success: true,
      data: {
        messages,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a message
router.post('/', async (req, res) => {
  try {
    const { senderId, room, content, replyTo } = req.body;
    
    if (!senderId || !room || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const newMessage = await Message.create({
      content,
      sender: senderId,
      room,
      messageType: 'text',
      readBy: [senderId],
      replyTo: replyTo || null
    });
    
    const populated = await Message.findById(newMessage._id).populate('sender', 'name email avatar');
    
    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search messages
router.get('/search', async (req, res) => {
  try {
    const { roomId, query } = req.query;
    
    if (!roomId || !query) {
      return res.status(400).json({ message: 'Room ID and query required' });
    }
    
    const results = await Message.find({
      room: roomId,
      content: { $regex: query, $options: 'i' }
    }).populate('sender', 'name email avatar').limit(50);
    
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Edit message
router.put('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content, userId } = req.body;
    
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    
    const populated = await Message.findById(messageId).populate('sender', 'name email avatar');
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, deleteForEveryone } = req.body;
    
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    if (deleteForEveryone) {
      if (message.sender.toString() !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      await Message.findByIdAndDelete(messageId);
    } else {
      if (!message.deletedFor) message.deletedFor = [];
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }
    }
    
    res.json({ success: true, data: { messageId, deleteForEveryone } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add reaction
router.post('/:messageId/reaction', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;
    
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    const existingIndex = message.reactions.findIndex(
      r => r.user.toString() === userId && r.emoji === emoji
    );
    
    if (existingIndex !== -1) {
      message.reactions.splice(existingIndex, 1);
    } else {
      message.reactions.push({ user: userId, emoji });
    }
    
    await message.save();
    res.json({ success: true, data: { messageId, reactions: message.reactions } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark as read
router.post('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;
    
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }
    
    res.json({ success: true, data: { messageId, readBy: message.readBy } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forward message
router.post('/:messageId/forward', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, targetRoomIds } = req.body;
    
    const original = await Message.findById(messageId);
    if (!original) return res.status(404).json({ message: 'Message not found' });
    
    const forwardedMessages = await Promise.all(
      targetRoomIds.map(roomId =>
        Message.create({
          content: original.content,
          sender: userId,
          room: roomId,
          messageType: original.messageType,
          attachment: original.attachment,
          readBy: [userId],
          forwardedFrom: {
            messageId: original._id,
            originalSender: original.sender,
            originalRoom: original.room
          }
        })
      )
    );
    
    res.json({ success: true, data: { count: forwardedMessages.length } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
