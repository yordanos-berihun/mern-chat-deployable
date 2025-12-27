const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password -refreshToken');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, status, avatar } = req.body;
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (status) user.status = status;
    if (avatar !== undefined) user.avatar = avatar;
    
    await user.save();
    
    const updated = await User.findById(id).select('-password -refreshToken');
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Archive/Unarchive room
router.post('/rooms/:roomId/archive', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, archived } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (!user.archivedRooms) user.archivedRooms = [];
    
    if (archived) {
      if (!user.archivedRooms.includes(roomId)) {
        user.archivedRooms.push(roomId);
      }
    } else {
      user.archivedRooms = user.archivedRooms.filter(r => r !== roomId);
    }
    
    await user.save();
    res.json({ success: true, data: { roomId, archived } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get archived rooms
router.get('/rooms/archived/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ success: true, data: user.archivedRooms || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
