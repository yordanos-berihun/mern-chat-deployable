const mongoose = require('mongoose');
const { User, Room, Message } = require('../models');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-chat');
    
    // Clear existing data
    await User.deleteMany({});
    await Room.deleteMany({});
    await Message.deleteMany({});
    
    // Create users
    const users = await User.create([
      { name: 'Alice Johnson', email: 'alice@example.com', password: 'password123' },
      { name: 'Bob Smith', email: 'bob@example.com', password: 'password123' },
      { name: 'Charlie Brown', email: 'charlie@example.com', password: 'password123' },
      { name: 'Diana Prince', email: 'diana@example.com', password: 'password123' },
      { name: 'Eve Wilson', email: 'eve@example.com', password: 'password123' }
    ]);
    
    console.log(`Created ${users.length} users`);
    
    // Create rooms
    const rooms = await Room.create([
      {
        name: 'General Discussion',
        type: 'group',
        participants: users.map(u => u._id),
        createdBy: users[0]._id
      },
      {
        name: 'Project Team',
        type: 'group',
        participants: [users[0]._id, users[1]._id, users[2]._id],
        createdBy: users[0]._id
      },
      {
        type: 'private',
        participants: [users[0]._id, users[1]._id],
        createdBy: users[0]._id
      },
      {
        type: 'private',
        participants: [users[2]._id, users[3]._id],
        createdBy: users[2]._id
      }
    ]);
    
    console.log(`Created ${rooms.length} rooms`);
    
    // Create messages
    const messages = [];
    for (let i = 0; i < 1000; i++) {
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const sender = users[Math.floor(Math.random() * users.length)];
      
      if (room.participants.includes(sender._id)) {
        messages.push({
          content: `Test message ${i + 1} - ${Math.random().toString(36).substring(7)}`,
          sender: sender._id,
          room: room._id,
          messageType: Math.random() > 0.8 ? 'image' : 'text',
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
      }
    }
    
    await Message.insertMany(messages);
    console.log(`Created ${messages.length} messages`);
    
    // Update room last messages
    for (const room of rooms) {
      const lastMessage = await Message.findOne({ room: room._id }).sort({ createdAt: -1 });
      if (lastMessage) {
        room.lastMessage = lastMessage._id;
        room.lastActivity = lastMessage.createdAt;
        await room.save();
      }
    }
    
    console.log('✅ Database seeded successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();