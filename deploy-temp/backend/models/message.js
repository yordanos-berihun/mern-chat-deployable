const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  // Legacy alias expected by some tests
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'video', 'audio', 'location', 'poll', 'contact', 'sticker', 'gif'],
    default: 'text'
  },
  attachment: {
    filename: String,
    url: String,
    size: Number,
    type: String
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  poll: {
    question: String,
    options: [String],
    votes: Map
  },
  contact: {
    name: String,
    phone: String,
    userId: String
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  scheduledFor: Date
}, {
  timestamps: true
});

// Compound indexes for optimization
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ content: 'text' });
messageSchema.index({ 'readBy.user': 1 });
messageSchema.index({ room: 1, messageType: 1 });

// Static method for paginated room messages with aggregation
messageSchema.statics.getRoomMessages = function(roomId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.aggregate([
    {
      $match: { room: new mongoose.Types.ObjectId(roomId) }
    },
    {
      $sort: { createdAt: 1 }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'sender',
        foreignField: '_id',
        as: 'senderData'
      }
    },
    {
      $lookup: {
        from: 'messages',
        localField: 'replyTo',
        foreignField: '_id',
        as: 'replyToData'
      }
    },
    {
      $addFields: {
        sender: { 
          $ifNull: [
            { $arrayElemAt: ['$senderData', 0] },
            { _id: '$sender', name: 'Unknown', email: 'unknown@user.com' }
          ]
        },
        replyTo: { $arrayElemAt: ['$replyToData', 0] }
      }
    },
    {
      $project: {
        senderData: 0,
        replyToData: 0,
        'sender.password': 0
      }
    }
  ]);
};

// Keep legacy `roomId` field in sync for tests that query it directly
messageSchema.pre('save', function(next) {
  if (this.room && !this.roomId) this.roomId = this.room;
  next();
});

// Static method for message search with full-text search
messageSchema.statics.searchMessages = function(roomId, query, limit = 10) {
  return this.aggregate([
    {
      $match: {
        room: new mongoose.Types.ObjectId(roomId),
        $text: { $search: query }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'sender',
        foreignField: '_id',
        as: 'senderData'
      }
    },
    {
      $addFields: {
        sender: { $arrayElemAt: ['$senderData', 0] },
        score: { $meta: 'textScore' }
      }
    },
    {
      $sort: { score: { $meta: 'textScore' }, createdAt: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        senderData: 0
      }
    }
  ]);
};

// Static method for unread message count
messageSchema.statics.getUnreadCount = function(roomId, userId) {
  return this.countDocuments({
    room: roomId,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId }
  });
};

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(read => read.user.equals(userId))) {
    this.readBy.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method for message analytics
messageSchema.statics.getMessageStats = function(roomId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        room: new mongoose.Types.ObjectId(roomId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sender: '$sender'
        },
        messageCount: { $sum: 1 },
        messageTypes: { $push: '$messageType' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        totalMessages: { $sum: '$messageCount' },
        uniqueSenders: { $addToSet: '$_id.sender' },
        messageTypes: { $push: '$messageTypes' }
      }
    },
    {
      $addFields: {
        uniqueSenderCount: { $size: '$uniqueSenders' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);