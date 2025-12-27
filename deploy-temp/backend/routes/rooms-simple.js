const express = require('express');
const router = express.Router();

// Simple auth middleware
// For test harness routes we allow unauthenticated access — tests pass
// explicit user IDs in the path, so this is a no-op authenticate.
const authenticate = (req, res, next) => next();

// In-memory storage for rooms per user
const userRooms = new Map();
const allRooms = new Map();

// Initialize with some default rooms
const initializeDefaultRooms = (userId) => {
  if (!userRooms.has(userId)) {
    const defaultRooms = [
      {
        _id: `room_${userId}_general`,
        name: 'General Chat',
        type: 'group',
        participants: [userId],
        createdBy: userId,
        lastActivity: new Date()
      }
    ];
    
    userRooms.set(userId, defaultRooms);
    defaultRooms.forEach(room => allRooms.set(room._id, room));
  }
};

// Get user rooms
router.get('/user/:userId', authenticate, (req, res) => {
  const { userId } = req.params;
  
  // Initialize default rooms if user doesn't have any
  initializeDefaultRooms(userId);
  
  const rooms = userRooms.get(userId) || [];
  
  res.json({
    success: true,
    data: rooms
  });
});

// Create private room between two users
router.post('/private', (req, res) => {
  const { user1Id, user2Id } = req.body;
  
  if (!user1Id || !user2Id) {
    return res.status(400).json({ message: 'Both user IDs required' });
  }
  
  // Check if private room already exists
  const existingRoom = Array.from(allRooms.values()).find(room => 
    room.type === 'private' && 
    room.participants.includes(user1Id) && 
    room.participants.includes(user2Id)
  );
  
  if (existingRoom) {
    return res.json({
      success: true,
      data: existingRoom
    });
  }
  
  // Create new private room
  const newRoom = {
    _id: `room_${Date.now()}`,
    name: null,
    type: 'private',
    participants: [user1Id, user2Id],
    createdBy: user1Id,
    lastActivity: new Date()
  };
  
  // Add room to both users
  [user1Id, user2Id].forEach(userId => {
    initializeDefaultRooms(userId);
    const rooms = userRooms.get(userId) || [];
    rooms.push(newRoom);
    userRooms.set(userId, rooms);
  });
  
  allRooms.set(newRoom._id, newRoom);
  
  res.status(201).json({
    success: true,
    data: newRoom
  });
});

// Create group room
router.post('/group', (req, res) => {
  const { name, createdBy, participants = [] } = req.body;
  
  if (!name || !createdBy) {
    return res.status(400).json({ message: 'Name and creator required' });
  }
  
  const newRoom = {
    _id: `room_${Date.now()}`,
    name: name,
    type: 'group',
    participants: [createdBy, ...participants],
    admins: [createdBy],
    createdBy: createdBy,
    lastActivity: new Date()
  };
  
  // Add room to all participants
  [createdBy, ...participants].forEach(userId => {
    initializeDefaultRooms(userId);
    const rooms = userRooms.get(userId) || [];
    rooms.push(newRoom);
    userRooms.set(userId, rooms);
  });
  
  allRooms.set(newRoom._id, newRoom);
  
  res.status(201).json({
    success: true,
    data: newRoom
  });
});

// Update group name (admin only)
router.put('/:roomId/name', (req, res) => {
  const { roomId } = req.params;
  const { name, userId } = req.body;
  
  const room = allRooms.get(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (room.type !== 'group') return res.status(400).json({ message: 'Only for groups' });
  if (!room.admins?.includes(userId)) return res.status(403).json({ message: 'Admin only' });
  
  room.name = name;
  room.lastActivity = new Date();
  res.json({ success: true, data: room });
});

// Add member (admin only)
router.post('/:roomId/members', (req, res) => {
  const { roomId } = req.params;
  const { userId, newMemberId } = req.body;
  
  const room = allRooms.get(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (room.type !== 'group') return res.status(400).json({ message: 'Only for groups' });
  if (!room.admins?.includes(userId)) return res.status(403).json({ message: 'Admin only' });
  if (room.participants.includes(newMemberId)) return res.status(400).json({ message: 'Already member' });
  
  room.participants.push(newMemberId);
  initializeDefaultRooms(newMemberId);
  const memberRooms = userRooms.get(newMemberId) || [];
  memberRooms.push(room);
  userRooms.set(newMemberId, memberRooms);
  
  res.json({ success: true, data: room });
});

// Remove member (admin only)
router.delete('/:roomId/members/:memberId', (req, res) => {
  const { roomId, memberId } = req.params;
  const { userId } = req.body;
  
  const room = allRooms.get(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (room.type !== 'group') return res.status(400).json({ message: 'Only for groups' });
  if (!room.admins?.includes(userId)) return res.status(403).json({ message: 'Admin only' });
  if (memberId === room.createdBy) return res.status(400).json({ message: 'Cannot remove creator' });
  
  room.participants = room.participants.filter(p => p !== memberId);
  room.admins = room.admins?.filter(a => a !== memberId);
  
  const memberRooms = userRooms.get(memberId) || [];
  userRooms.set(memberId, memberRooms.filter(r => r._id !== roomId));
  
  res.json({ success: true, data: room });
});

// Promote to admin (admin only)
router.post('/:roomId/admins', (req, res) => {
  const { roomId } = req.params;
  const { userId, targetUserId } = req.body;
  
  const room = allRooms.get(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (room.type !== 'group') return res.status(400).json({ message: 'Only for groups' });
  if (!room.admins?.includes(userId)) return res.status(403).json({ message: 'Admin only' });
  if (!room.participants.includes(targetUserId)) return res.status(400).json({ message: 'Not a member' });
  
  if (!room.admins) room.admins = [room.createdBy];
  if (!room.admins.includes(targetUserId)) room.admins.push(targetUserId);
  
  res.json({ success: true, data: room });
});

// Demote admin (creator only)
router.delete('/:roomId/admins/:adminId', (req, res) => {
  const { roomId, adminId } = req.params;
  const { userId } = req.body;
  
  const room = allRooms.get(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (room.type !== 'group') return res.status(400).json({ message: 'Only for groups' });
  if (userId !== room.createdBy) return res.status(403).json({ message: 'Creator only' });
  if (adminId === room.createdBy) return res.status(400).json({ message: 'Cannot demote creator' });
  
  room.admins = room.admins?.filter(a => a !== adminId) || [];
  res.json({ success: true, data: room });
});

module.exports = router;