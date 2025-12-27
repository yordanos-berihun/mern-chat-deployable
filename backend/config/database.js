const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-chat', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes after connection
    await createIndexes();
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  const { User, Room, Message } = require('../models');
  
  try {
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ name: 1 });
    await User.collection.createIndex({ isOnline: 1 });
    
    // Room indexes
    await Room.collection.createIndex({ participants: 1 });
    await Room.collection.createIndex({ type: 1 });
    await Room.collection.createIndex({ lastActivity: -1 });
    await Room.collection.createIndex({ 'participants': 1, 'type': 1 });
    
    // Message indexes
    await Message.collection.createIndex({ room: 1, createdAt: -1 });
    await Message.collection.createIndex({ sender: 1 });
    await Message.collection.createIndex({ content: 'text' });
    await Message.collection.createIndex({ 'readBy.user': 1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Index creation error:', error);
  }
};

module.exports = connectDB;