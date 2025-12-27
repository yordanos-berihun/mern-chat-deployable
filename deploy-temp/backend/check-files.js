const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const Message = require('./models/message');
    
    const messages = await Message.find({
      messageType: { $in: ['image', 'video', 'audio', 'file'] }
    }).limit(5);
    
    console.log('\nFile messages in database:');
    messages.forEach(msg => {
      console.log(`\nID: ${msg._id}`);
      console.log(`Type: ${msg.messageType}`);
      console.log(`URL: ${msg.attachment?.url}`);
      console.log(`Filename: ${msg.attachment?.filename}`);
    });
    
    if (messages.length === 0) {
      console.log('\nNo file messages found in database!');
      console.log('Files exist in uploads/ but no messages reference them.');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
