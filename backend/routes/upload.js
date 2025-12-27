const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/message');
const Room = require('../models/room');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mp3|wav|webm|ogg|m4a/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('File type not allowed'));
  }
});

// Profile picture upload
router.post('/profile', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const avatarUrl = `/uploads/${req.file.filename}`;
    const User = require('../models/User');
    
    await User.findByIdAndUpdate(userId, { avatar: avatarUrl });
    
    res.json({ success: true, data: { avatar: avatarUrl } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Message file upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { senderId, room } = req.body;
    if (!senderId || !room) return res.status(400).json({ success: false, message: 'senderId and room required' });

    let messageType = 'file';
    if (req.file.mimetype.startsWith('image/')) messageType = 'image';
    else if (req.file.mimetype.startsWith('video/')) messageType = 'video';
    else if (req.file.mimetype.startsWith('audio/')) messageType = 'audio';

    const fileUrl = `/uploads/${req.file.filename}`;

    const message = await Message.create({
      content: req.file.originalname,
      sender: senderId,
      room,
      messageType,
      attachment: { url: fileUrl, filename: req.file.originalname, type: req.file.mimetype, size: req.file.size },
      likes: []
    });

    await Room.findByIdAndUpdate(room, { lastMessage: message._id, lastActivity: new Date() });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name email avatar').lean();

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
