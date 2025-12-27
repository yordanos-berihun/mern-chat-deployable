const express = require('express');
const router = express.Router();
const Room = require('../models/room');

// Get user rooms
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const rooms = await Room.find({ participants: userId })
      .populate('participants', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ lastActivity: -1 });
    
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create private room
router.post('/private', async (req, res) => {
  try {
    const { user1Id, user2Id } = req.body;
    
    if (!user1Id || !user2Id) {
      return res.status(400).json({ message: 'Both user IDs required' });
    }
    
    // Check if room exists
    const existing = await Room.findOne({
      type: 'private',
      participants: { $all: [user1Id, user2Id] }
    });
    
    if (existing) {
      return res.json({ success: true, data: existing });
    }
    
    // Create new room
    const newRoom = await Room.create({
      type: 'private',
      participants: [user1Id, user2Id],
      createdBy: user1Id
    });
    
    const populated = await Room.findById(newRoom._id)
      .populate('participants', 'name email avatar');
    
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create group room
router.post('/group', async (req, res) => {
  try {
    const { name, createdBy, participants = [] } = req.body;
    
    if (!name || !createdBy) {
      return res.status(400).json({ message: 'Name and creator required' });
    }
    
    const newRoom = await Room.create({
      name,
      type: 'group',
      participants: [createdBy, ...participants],
      admins: [createdBy],
      createdBy
    });
    
    const populated = await Room.findById(newRoom._id)
      .populate('participants', 'name email avatar');
    
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update group name
router.put('/:roomId/name', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, userId } = req.body;
    
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.type !== 'group') return res.status(400).json({ message: 'Only for groups' });
    if (!room.admins.includes(userId)) return res.status(403).json({ message: 'Admin only' });
    
    room.name = name;
    room.lastActivity = new Date();
    await room.save();
    
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add member
router.post('/:roomId/members', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, newMemberId } = req.body;
    
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.type !== 'group') return res.status(400).json({ message: 'Only for groups' });
    if (!room.admins.includes(userId)) return res.status(403).json({ message: 'Admin only' });
    if (room.participants.includes(newMemberId)) {
      return res.status(400).json({ message: 'Already member' });
    }
    
    room.participants.push(newMemberId);
    await room.save();
    
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove member
router.delete('/:roomId/members/:memberId', async (req, res) => {
  try {
    const { roomId, memberId } = req.params;
    const { userId } = req.body;
    
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.type !== 'group') return res.status(400).json({ message: 'Only for groups' });
    if (!room.admins.includes(userId)) return res.status(403).json({ message: 'Admin only' });
    if (memberId === room.createdBy.toString()) {
      return res.status(400).json({ message: 'Cannot remove creator' });
    }
    
    room.participants = room.participants.filter(p => p.toString() !== memberId);
    room.admins = room.admins.filter(a => a.toString() !== memberId);
    await room.save();
    
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Promote to admin
router.post('/:roomId/admins', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, targetUserId } = req.body;
    
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.type !== 'group') return res.status(400).json({ message: 'Only for groups' });
    if (!room.admins.includes(userId)) return res.status(403).json({ message: 'Admin only' });
    if (!room.participants.includes(targetUserId)) {
      return res.status(400).json({ message: 'Not a member' });
    }
    
    if (!room.admins.includes(targetUserId)) {
      room.admins.push(targetUserId);
      await room.save();
    }
    
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Demote admin
router.delete('/:roomId/admins/:adminId', async (req, res) => {
  try {
    const { roomId, adminId } = req.params;
    const { userId } = req.body;
    
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.type !== 'group') return res.status(400).json({ message: 'Only for groups' });
    if (userId !== room.createdBy.toString()) {
      return res.status(403).json({ message: 'Creator only' });
    }
    if (adminId === room.createdBy.toString()) {
      return res.status(400).json({ message: 'Cannot demote creator' });
    }
    
    room.admins = room.admins.filter(a => a.toString() !== adminId);
    await room.save();
    
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
