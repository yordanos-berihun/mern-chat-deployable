// MERN Stack - User Profile Model
// Extended user information for profile management

const mongoose = require("mongoose");

// PROFILE SCHEMA - Additional user information
const profileSchema = new mongoose.Schema(
  {
    // USER REFERENCE - Link to User model
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One profile per user
    },

    // PROFILE PICTURE - Avatar URL
    avatar: {
      type: String,
      default: "https://ui-avatars.com/api/?name=User&background=007bff&color=fff",
    },

    // BIO - Short description about user
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },

    // STATUS - Current user status
    status: {
      type: String,
      enum: ["online", "offline", "away", "busy"],
      default: "offline",
    },

    // CUSTOM STATUS MESSAGE
    statusMessage: {
      type: String,
      maxlength: [100, "Status message cannot exceed 100 characters"],
      default: "",
    },

    // LOCATION - User location
    location: {
      type: String,
      maxlength: [100, "Location cannot exceed 100 characters"],
      default: "",
    },

    // SOCIAL LINKS
    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      website: { type: String, default: "" },
    },

    // PREFERENCES
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "light",
      },
      notifications: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
    },

    // STATISTICS
    stats: {
      messagesSent: { type: Number, default: 0 },
      lastActive: { type: Date, default: Date.now },
      joinedDate: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true, // Auto-manage createdAt and updatedAt
  }
);

// INDEXES for better query performance
profileSchema.index({ user: 1 });
profileSchema.index({ status: 1 });

// INSTANCE METHODS - Functions available on profile documents

// Update last active timestamp
profileSchema.methods.updateLastActive = function () {
  this.stats.lastActive = new Date();
  return this.save();
};

// Increment message count
profileSchema.methods.incrementMessageCount = function () {
  this.stats.messagesSent += 1;
  return this.save();
};

// Update status
profileSchema.methods.updateStatus = function (newStatus, message = "") {
  this.status = newStatus;
  if (message) this.statusMessage = message;
  return this.save();
};

// STATIC METHODS - Functions available on Profile model

// Get profile with user details
profileSchema.statics.getProfileWithUser = function (userId) {
  return this.findOne({ user: userId })
    .populate("user", "name email createdAt")
    .lean();
};

// Get all online users
profileSchema.statics.getOnlineUsers = function () {
  return this.find({ status: "online" })
    .populate("user", "name email")
    .lean();
};

// VIRTUAL FIELDS - Computed properties

// Check if user is active (active in last 5 minutes)
profileSchema.virtual("isActive").get(function () {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.stats.lastActive > fiveMinutesAgo;
});

// Get days since joined
profileSchema.virtual("daysSinceJoined").get(function () {
  const diffTime = Math.abs(new Date() - this.stats.joinedDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// PRE-SAVE MIDDLEWARE - Runs before saving
profileSchema.pre("save", function (next) {
  // Generate avatar URL if not set
  if (!this.avatar || this.avatar.includes("ui-avatars.com")) {
    // Get user name from populated user or use default
    const userName = this.user?.name || "User";
    this.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName
    )}&background=007bff&color=fff&size=200`;
  }
  next();
});

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;
