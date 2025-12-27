const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    maxlength: 50
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
    ,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please fill a valid email address']
  },
  phone: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  bio: {
    type: String,
    maxlength: 200,
    default: ''
  },
  statusMessage: {
    type: String,
    maxlength: 100,
    default: ''
  },
  archivedRooms: [{
    type: String
  }],
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  pushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    }
  }],
  notificationSettings: {
    enabled: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    reactions: { type: Boolean, default: true }
  },
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  bookmarkedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ name: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ lastSeen: -1 });

// Virtual for user status
userSchema.virtual('status').get(function() {
  if (this.isOnline) return 'online';
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastSeen > fiveMinutesAgo ? 'recently' : 'offline';
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Allow `username` field as alias for `name` when tests or fixtures use it.
userSchema.pre('validate', function(next) {
  if (!this.name && this.username) {
    this.name = this.username;
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find users with aggregation
userSchema.statics.findUsersWithRoomCount = function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'rooms',
        localField: '_id',
        foreignField: 'participants',
        as: 'userRooms'
      }
    },
    {
      $project: {
        name: 1,
        email: 1,
        isOnline: 1,
        lastSeen: 1,
        roomCount: { $size: '$userRooms' }
      }
    }
  ]);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);