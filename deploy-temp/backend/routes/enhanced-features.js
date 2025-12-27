const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const { requireAuth } = require('../middleware/requireAuth');

router.post('/:id/pin', requireAuth, async (req, res) => {
  try {
    const { roomId } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    
    const pinnedCount = await Message.countDocuments({ room: roomId, isPinned: true });
    if (pinnedCount >= 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 pinned messages allowed' });
    }
    
    message.isPinned = true;
    message.pinnedAt = new Date();
    message.pinnedBy = req.user._id;
    await message.save();
    
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id/unpin', requireAuth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    
    message.isPinned = false;
    message.pinnedAt = null;
    message.pinnedBy = null;
    await message.save();
    
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/pinned/:roomId', requireAuth, async (req, res) => {
  try {
    const messages = await Message.find({ 
      room: req.params.roomId, 
      isPinned: true 
    })
    .populate('sender', 'name avatar')
    .sort({ pinnedAt: -1 })
    .limit(5);
    
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/schedule', requireAuth, async (req, res) => {
  try {
    const { content, room, scheduledFor } = req.body;
    const scheduledDate = new Date(scheduledFor);
    
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Schedule time must be in future' });
    }
    
    const message = new Message({
      sender: req.user._id,
      room,
      content,
      messageType: 'text',
      isScheduled: true,
      scheduledFor: scheduledDate
    });
    
    await message.save();
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/scheduled/:userId', requireAuth, async (req, res) => {
  try {
    const messages = await Message.find({
      sender: req.params.userId,
      isScheduled: true,
      scheduledFor: { $gt: new Date() }
    })
    .populate('room', 'name')
    .sort({ scheduledFor: 1 });
    
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
