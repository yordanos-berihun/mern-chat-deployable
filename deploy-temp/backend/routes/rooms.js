const express = require('express');
const { Room, User, Message } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user rooms with optimization
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const rooms = await Room.findUserRoomsWithLastMessage(userId);
    // For compatibility with older integration tests, return the raw
    // rooms array (not wrapped) so callers can do `res.body.length`.
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create private room (optimized)
router.post('/private', auth, async (req, res) => {
  try {
    // Support both { user1Id, user2Id } and legacy { participantId } payloads.
    const { user1Id, user2Id, participantId } = req.body;
    const requesterId = req.user && req.user._id ? req.user._id : user1Id;
    const otherId = participantId || user2Id;

    if (!requesterId || !otherId) {
      return res.status(400).json({ message: 'Both user IDs required' });
    }

    const room = await Room.findOrCreatePrivateRoom(requesterId, otherId);

    // Update user rooms array
    await User.updateMany(
      { _id: { $in: [requesterId, otherId] } },
      { $addToSet: { rooms: room._id } }
    );

    const populatedRoom = await Room.findById(room._id)
      .populate('participants', 'name email isOnline')
      .lean();

    // Return legacy plain room object for integration tests
    return res.status(201).json(populatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create group room
router.post('/group', async (req, res) => {
  try {
    const { name, participants = [] } = req.body;
    
    if (!name || participants.length < 2) {
      return res.status(400).json({ message: 'Name and at least 2 participants required' });
    }

    const room = await Room.create({
      name,
      type: 'group',
      participants,
      createdBy: participants[0],
      admins: [participants[0]]
    });

    await User.updateMany(
      { _id: { $in: participants } },
      { $addToSet: { rooms: room._id } }
    );

    const populatedRoom = await Room.findById(room._id)
      .populate('participants', 'name email avatar')
      .lean();

    res.status(201).json({ success: true, data: populatedRoom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get room details with participants
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await Room.findById(roomId)
      .populate('participants', 'name email isOnline lastSeen')
      .populate('createdBy', 'name email')
      .lean();

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update room (name, add/remove participants)
router.put('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, addParticipants = [], removeParticipants = [] } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    
    if (addParticipants.length > 0) {
      updateData.$addToSet = { participants: { $each: addParticipants } };
    }
    
    if (removeParticipants.length > 0) {
      updateData.$pull = { participants: { $in: removeParticipants } };
    }

    const room = await Room.findByIdAndUpdate(roomId, updateData, { new: true })
      .populate('participants', 'name email isOnline');

    // Update user rooms arrays
    if (addParticipants.length > 0) {
      await User.updateMany(
        { _id: { $in: addParticipants } },
        { $addToSet: { rooms: roomId } }
      );
    }
    
    if (removeParticipants.length > 0) {
      await User.updateMany(
        { _id: { $in: removeParticipants } },
        { $pull: { rooms: roomId } }
      );
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Archive/unarchive room
router.patch('/:roomId/archive', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { isArchived = true } = req.body;
    
    const room = await Room.findByIdAndUpdate(
      roomId,
      { isArchived },
      { new: true }
    ).lean();

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get room statistics
router.get('/:roomId/stats', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { days = 7 } = req.query;
    
    const stats = await Message.getMessageStats(roomId, parseInt(days));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;