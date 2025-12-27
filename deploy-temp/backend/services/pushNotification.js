const webpush = require('web-push');

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh4U',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls'
};

webpush.setVapidDetails(
  'mailto:admin@mernchat.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const sendNotification = async (subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
};

const sendToUser = async (userId, payload) => {
  const User = require('../models/user');
  const user = await User.findById(userId);
  
  if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
    return { success: false, error: 'No subscriptions found' };
  }

  const results = await Promise.all(
    user.pushSubscriptions.map(sub => sendNotification(sub, payload))
  );

  return { success: true, sent: results.filter(r => r.success).length };
};

module.exports = { sendNotification, sendToUser, vapidKeys };
