// MERN Stack - Profile Routes
// API endpoints for user profile management

const express = require("express");
const router = express.Router();
const Profile = require("../models/profile");
const User = require("../models/user");
const mongoose = require("mongoose");

// MIDDLEWARE - Validate ObjectId
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: "Invalid ID format",
    });
  }
  next();
};

// ASYNC ERROR HANDLER
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/profiles - Get all profiles
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, limit = 50 } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;

    // Fetch profiles with user details
    const profiles = await Profile.find(query)
      .populate("user", "name email createdAt")
      .limit(parseInt(limit))
      .sort({ "stats.lastActive": -1 })
      .lean();

    res.json({
      success: true,
      data: profiles,
      count: profiles.length,
    });
  })
);

// GET /api/profiles/user/:userId - Get profile by user ID
router.get(
  "/user/:id",
  validateObjectId,
  asyncHandler(async (req, res) => {
    const profile = await Profile.findOne({ user: req.params.id })
      .populate("user", "name email createdAt")
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  })
);

// POST /api/profiles - Create or update profile
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const {
      userId,
      bio,
      location,
      statusMessage,
      socialLinks,
      preferences,
    } = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if profile exists
    let profile = await Profile.findOne({ user: userId });

    if (profile) {
      // UPDATE existing profile
      if (bio !== undefined) profile.bio = bio;
      if (location !== undefined) profile.location = location;
      if (statusMessage !== undefined) profile.statusMessage = statusMessage;
      if (socialLinks) profile.socialLinks = { ...profile.socialLinks, ...socialLinks };
      if (preferences) profile.preferences = { ...profile.preferences, ...preferences };

      await profile.save();
    } else {
      // CREATE new profile
      profile = new Profile({
        user: userId,
        bio: bio || "",
        location: location || "",
        statusMessage: statusMessage || "",
        socialLinks: socialLinks || {},
        preferences: preferences || {},
      });

      await profile.save();
    }

    // Populate user details
    await profile.populate("user", "name email");

    res.status(profile.isNew ? 201 : 200).json({
      success: true,
      message: profile.isNew ? "Profile created" : "Profile updated",
      data: profile,
    });
  })
);

// PUT /api/profiles/:id/status - Update user status
router.put(
  "/:id/status",
  validateObjectId,
  asyncHandler(async (req, res) => {
    const { status, statusMessage } = req.body;

    // Validate status
    const validStatuses = ["online", "offline", "away", "busy"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: online, offline, away, or busy",
      });
    }

    // Find and update profile
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    await profile.updateStatus(status, statusMessage);
    await profile.populate("user", "name email");

    res.json({
      success: true,
      message: "Status updated",
      data: profile,
    });
  })
);

// PUT /api/profiles/:id/avatar - Update avatar
router.put(
  "/:id/avatar",
  validateObjectId,
  asyncHandler(async (req, res) => {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        error: "Avatar URL is required",
      });
    }

    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { avatar: avatarUrl },
      { new: true }
    ).populate("user", "name email");

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    res.json({
      success: true,
      message: "Avatar updated",
      data: profile,
    });
  })
);

// GET /api/profiles/online - Get all online users
router.get(
  "/online",
  asyncHandler(async (req, res) => {
    const onlineProfiles = await Profile.getOnlineUsers();

    res.json({
      success: true,
      data: onlineProfiles,
      count: onlineProfiles.length,
    });
  })
);

// POST /api/profiles/:id/activity - Update last active
router.post(
  "/:id/activity",
  validateObjectId,
  asyncHandler(async (req, res) => {
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    await profile.updateLastActive();

    res.json({
      success: true,
      message: "Activity updated",
    });
  })
);

// DELETE /api/profiles/:id - Delete profile
router.delete(
  "/:id",
  validateObjectId,
  asyncHandler(async (req, res) => {
    const profile = await Profile.findByIdAndDelete(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    res.json({
      success: true,
      message: "Profile deleted",
    });
  })
);

module.exports = router;
