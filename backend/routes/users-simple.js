const express = require('express');
const router = express.Router();
const authRouter = require('./auth-simple');

// Get all users from auth storage
const getUsers = () => {
  if (authRouter.users) {
    return Array.from(authRouter.users.values());
  }
  // Fallback to demo users
  return [
    { _id: 'user_demo1', name: 'Alice', email: 'alice@demo.com' },
    { _id: 'user_demo2', name: 'Bob', email: 'bob@demo.com' },
    { _id: 'user_demo3', name: 'Charlie', email: 'charlie@demo.com' }
  ];
};

// Get all users
router.get('/', (req, res) => {
  const users = getUsers();
  
  res.json({
    success: true,
    data: users
  });
});

// Get user by ID
router.get('/:id', (req, res) => {
  const users = getUsers();
  const user = users.find(u => u._id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Update user profile
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, bio, status, avatar } = req.body;
  
  const users = getUsers();
  const userIndex = users.findIndex(u => u._id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const user = users[userIndex];
  
  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (status) user.status = status;
  if (avatar !== undefined) user.avatar = avatar;
  user.updatedAt = new Date();
  
  if (authRouter.users) {
    authRouter.users.set(user.email, user);
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Archive/Unarchive room
router.post('/rooms/:roomId/archive', (req, res) => {
  const { roomId } = req.params;
  const { userId, archived } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'userId required' });
  }
  
  // Store archived rooms per user in memory
  if (!global.archivedRooms) {
    global.archivedRooms = new Map();
  }
  
  const userArchived = global.archivedRooms.get(userId) || new Set();
  
  if (archived) {
    userArchived.add(roomId);
  } else {
    userArchived.delete(roomId);
  }
  
  global.archivedRooms.set(userId, userArchived);
  
  res.json({
    success: true,
    data: { roomId, archived }
  });
});

// Get archived status for rooms
router.get('/rooms/archived/:userId', (req, res) => {
  const { userId } = req.params;
  
  if (!global.archivedRooms) {
    global.archivedRooms = new Map();
  }
  
  const userArchived = global.archivedRooms.get(userId) || new Set();
  
  res.json({
    success: true,
    data: Array.from(userArchived)
  });
});

module.exports = router;