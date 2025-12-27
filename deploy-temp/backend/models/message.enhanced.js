const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  content: { type: String, required: true },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'video', 'audio', 'file'], 
    default: 'text' 
  },
  attachment: {
    url: String,
    filename: String,
    type: String,
    size: Number
  },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String
  }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  isPinned: { type: Boolean, default: false },
  pinnedAt: Date,
  pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isScheduled: { type: Boolean, default: false },
  scheduledFor: Date,
  isBookmarked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { 
  timestamps: true 
});

messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isPinned: 1, room: 1 });
messageSchema.index({ isScheduled: 1, scheduledFor: 1 });

module.exports = mongoose.model('Message', messageSchema);
