// models/post.js
const mongoose = require("mongoose");

// Define the shape of a Post document
const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // Reference to User that owns this post
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // this string must match mongoose.model("User", ...) from your user model
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Create the model class
const Post = mongoose.model("Post", postSchema);

// Export the model so routes/posts.js can import it
module.exports = Post;
