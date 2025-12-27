// config/db.js
const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mern_tutorial", {
      serverSelectionTimeoutMS: 5000
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("⚠️  MongoDB connection error:", err.message);
    console.log("⚠️  Server will continue without database. Please start MongoDB.");
  }
}

module.exports = connectDB;
