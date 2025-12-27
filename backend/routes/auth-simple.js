const express = require('express');
const router = express.Router();

// In-memory storage for users (replace with database later)
const users = new Map();

// Initialize with demo users
const demoUsers = [
  { _id: 'user_demo1', name: 'Alice', email: 'alice@demo.com', isEmailVerified: true },
  { _id: 'user_demo2', name: 'Bob', email: 'bob@demo.com', isEmailVerified: true },
  { _id: 'user_demo3', name: 'Charlie', email: 'charlie@demo.com', isEmailVerified: true }
];

demoUsers.forEach(user => users.set(user.email, user));

// Export users for other routes
router.getAllUsers = () => Array.from(users.values());

// Simple login - creates/finds user with email
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email required' });
  }
  
  // Find existing user or create new one
  let user = users.get(email);
  if (!user) {
    // Auto-create user for demo
    user = {
      _id: `user_${Date.now()}`,
      name: email.split('@')[0],
      email: email,
      isEmailVerified: true,
      createdAt: new Date()
    };
    users.set(email, user);
  }
  
  // Check if email is verified
  if (!user.isEmailVerified) {
    return res.status(403).json({ 
      message: 'Please verify your email before logging in',
      needsVerification: true
    });
  }
  
  res.json({
    success: true,
    user: user,
    accessToken: `token_${user._id}`
  });
});

module.exports.users = users;

// Register new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email required' });
  }
  
  // Check if user exists
  if (users.has(email)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  // Generate verification token
  const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create new user
  const user = {
    _id: `user_${Date.now()}`,
    name: name,
    email: email,
    isEmailVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: Date.now() + 86400000, // 24 hours
    createdAt: new Date()
  };
  users.set(email, user);
  
  // Send verification email
  const { sendVerificationEmail } = require('../utils/email');
  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (error) {
    console.error('Email send failed:', error);
  }
  // For the demo/simple auth route we return a lightweight access token
  // using the `token_<id>` format so tests can authenticate without JWT signing.
  const accessToken = `token_${user._id}`;

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    user: { _id: user._id, name: user.name, email: user.email, isEmailVerified: false },
    accessToken
  });
});

// Verify token and return user
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // Extract user ID from token
  const userId = token.replace('token_', '');
  
  // Find user by ID
  const user = Array.from(users.values()).find(u => u._id === userId);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  res.json({
    success: true,
    user: user
  });
});

// Refresh token
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }
  
  // Simple refresh - just return same token
  const userId = refreshToken.replace('token_', '');
  const user = Array.from(users.values()).find(u => u._id === userId);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
  
  res.json({
    success: true,
    accessToken: `token_${user._id}`,
    user: user
  });
});

// Forgot password - send reset email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email required' });
  }
  
  const user = users.get(email);
  if (!user) {
    // Don't reveal if user exists
    return res.json({ success: true, message: 'If email exists, reset link sent' });
  }
  
  // Generate reset token
  const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  users.set(email, user);
  
  // Send email (simplified - just return token for demo)
  res.json({
    success: true,
    message: 'Reset link sent to email',
    resetToken // Remove in production
  });
});

// Reset password with token
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password required' });
  }
  
  // Find user with valid token
  const user = Array.from(users.values()).find(
    u => u.resetPasswordToken === token && u.resetPasswordExpires > Date.now()
  );
  
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
  
  // Update password
  user.password = newPassword; // In production, hash this
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  users.set(user.email, user);
  
  res.json({
    success: true,
    message: 'Password reset successful'
  });
});

// Verify email with token
router.get('/verify-email/:token', (req, res) => {
  const { token } = req.params;
  
  // Find user with valid token
  const user = Array.from(users.values()).find(
    u => u.emailVerificationToken === token && u.emailVerificationExpires > Date.now()
  );
  
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired verification link' });
  }
  
  // Verify email
  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  users.set(user.email, user);
  
  res.json({
    success: true,
    message: 'Email verified successfully! You can now login.'
  });
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email required' });
  }
  
  const user = users.get(email);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  if (user.isEmailVerified) {
    return res.status(400).json({ message: 'Email already verified' });
  }
  
  // Generate new token
  const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = Date.now() + 86400000; // 24 hours
  users.set(email, user);
  
  // Send email
  const { sendVerificationEmail } = require('../utils/email');
  try {
    await sendVerificationEmail(email, verificationToken);
    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send email' });
  }
});

module.exports = router;