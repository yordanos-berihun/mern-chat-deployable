const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for optimization
roomSchema.index({ participants: 1, type: 1 });
roomSchema.index({ lastActivity: -1 });
roomSchema.index({ type: 1, isArchived: 1 });

// Virtual for participant count
roomSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Static method to find user rooms with last message
roomSchema.statics.findUserRoomsWithLastMessage = function(userId) {
  return this.aggregate([
    {
      $match: {
        participants: new mongoose.Types.ObjectId(userId),
        isArchived: false
      }
    },
    {
      $lookup: {
        from: 'messages',
        localField: 'lastMessage',
        foreignField: '_id',
        as: 'lastMessageData'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'participants',
        foreignField: '_id',
        as: 'participantData'
      }
    },
    {
      $addFields: {
        lastMessage: { $arrayElemAt: ['$lastMessageData', 0] },
        participants: '$participantData'
      }
    },
    {
      $sort: { lastActivity: -1 }
    }
  ]);
};

// Static method to find or create private room
roomSchema.statics.findOrCreatePrivateRoom = async function(user1Id, user2Id) {
  const existingRoom = await this.findOne({
    type: 'private',
    participants: { $all: [user1Id, user2Id] }
  });

  if (existingRoom) return existingRoom;

  return this.create({
    type: 'private',
    participants: [user1Id, user2Id],
    createdBy: user1Id
  });
};

// Ensure createdBy defaults to first participant when missing (helps tests)
roomSchema.pre('validate', function(next) {
  if (!this.createdBy && Array.isArray(this.participants) && this.participants.length > 0) {
    this.createdBy = this.participants[0];
  }
  next();
});

// Update last activity on message
roomSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

module.exports = mongoose.models.Room || mongoose.model('Room', roomSchema);