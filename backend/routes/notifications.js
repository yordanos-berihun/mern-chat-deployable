const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { vapidKeys } = require('../services/pushNotification');
const auth = require('../middleware/auth');

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

router.post('/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user.pushSubscriptions) user.pushSubscriptions = [];
    
    const exists = user.pushSubscriptions.some(
      sub => sub.endpoint === subscription.endpoint
    );
    
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/unsubscribe', auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    const user = await User.findById(req.user.userId);
    
    user.pushSubscriptions = user.pushSubscriptions.filter(
      sub => sub.endpoint !== endpoint
    );
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', auth, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings' });
    }
    await User.findByIdAndUpdate(req.user.userId, {
      notificationSettings: settings
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
