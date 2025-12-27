// routes/posts.js
const express = require("express");
const mongoose = require("mongoose");
const Post = require("../models/post");

const router = express.Router();

// Small helper: validate :id is a Mongo ObjectId
const validateObjectId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid post ID format" });
  }

  next();
};

// POST /api/posts
// Create a new post for the logged-in user
router.post("/", async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "title and content are required" });
    }

    // req.user.id comes from requireAuth (JWT)
    const post = new Post({
      title,
      content,
      user: req.user.id,
    });

    const savedPost = await post.save();
    res.status(201).json(savedPost);
  } catch (err) {
    next(err);
  }
});

// GET /api/posts
// Get all posts belonging to the logged-in user
router.get("/", async (req, res, next) => {
  try {
    const posts = await Post.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id
// Get a single post by id, only if it belongs to the logged-in user
router.get("/:id", validateObjectId, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    next(err);
  }
});

// PUT /api/posts/:id
// Update a post if it belongs to the logged-in user
router.put("/:id", validateObjectId, async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title && !content) {
      return res
        .status(400)
        .json({ error: "Provide at least one field: title or content" });
    }

    const post = await Post.findOne({ _id: req.params.id, user: req.user.id });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;

    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:id
// Delete a post if it belongs to the logged-in user
router.delete("/:id", validateObjectId, async (req, res, next) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ message: "Post deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
