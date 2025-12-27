const express = require('express');
const { User, Room, Message } = require('../models');
const router = express.Router();

// Get all users with room count
router.get('/', async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('name email isOnline lastSeen')
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID with detailed info
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) }
      },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: 'participants',
          as: 'rooms'
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'sender',
          as: 'messages'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          isOnline: 1,
          lastSeen: 1,
          createdAt: 1,
          roomCount: { $size: '$rooms' },
          messageCount: { $size: '$messages' }
        }
      }
    ]);

    if (!user.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, avatar, bio, phone, status } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (status) updateData.statusMessage = status;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user online status
router.patch('/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isOnline } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isOnline,
        lastSeen: new Date()
      },
      { new: true }
    ).select('name isOnline lastSeen');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's chat statistics
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const stats = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) }
      },
      {
        $lookup: {
          from: 'messages',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$sender', '$$userId'] },
                createdAt: { $gte: startDate }
              }
            },
            {
              $group: {
                _id: {
                  date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                  type: '$messageType'
                },
                count: { $sum: 1 }
              }
            }
          ],
          as: 'messageStats'
        }
      },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: 'participants',
          as: 'activeRooms'
        }
      },
      {
        $project: {
          name: 1,
          messageStats: 1,
          totalActiveRooms: { $size: '$activeRooms' },
          totalMessages: { $size: '$messageStats' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats[0] || {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search users for mentions/invites
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { excludeUsers = [], limit = 10 } = req.query;
    
    const excludeIds = Array.isArray(excludeUsers) ? excludeUsers : [excludeUsers];
    
    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        },
        { _id: { $nin: excludeIds } }
      ]
    })
    .select('name email isOnline')
    .limit(parseInt(limit))
    .lean();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get online users
router.get('/status/online', async (req, res) => {
  try {
    const users = await User.find({ isOnline: true })
      .select('name email lastSeen')
      .sort({ lastSeen: -1 })
      .lean();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;