require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./models');

const seedDemoUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const demoUsers = [
      { name: 'Alice', email: 'alice@demo.com', password: 'demo123', isEmailVerified: true },
      { name: 'Bob', email: 'bob@demo.com', password: 'demo123', isEmailVerified: true },
      { name: 'Charlie', email: 'charlie@demo.com', password: 'demo123', isEmailVerified: true }
    ];

    for (const userData of demoUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`✅ Created ${userData.name}`);
      } else {
        console.log(`⏭️  ${userData.name} already exists`);
      }
    }

    console.log('✅ Demo users seeded');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedDemoUsers();
