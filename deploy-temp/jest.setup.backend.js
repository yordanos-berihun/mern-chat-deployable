// Backend test setup: polyfills and common mocks
// Mock nodemailer so email sends don't require real credentials
// Increase default timeout for backend tests (DB/socket heavy)
try {
  jest.setTimeout(20000);
} catch (e) {
  // ignore if jest not available in this context
}
try {
  jest.mock('nodemailer', () => ({
    createTransport: () => ({
      sendMail: jest.fn().mockResolvedValue({})
    })
  }));
} catch (e) {
  // jest may not be defined in some contexts — ignore
}

// Ensure TextEncoder/TextDecoder exist
if (typeof global.TextEncoder === 'undefined' || typeof global.TextDecoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = global.TextEncoder || TextEncoder;
  global.TextDecoder = global.TextDecoder || TextDecoder;
}

// Provide setImmediate if missing
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = function (fn, ...args) { return setTimeout(fn, 0, ...args); };
}

// Connect to the test MongoDB if an in-memory server provides one.
const mongoose = require('mongoose');
const connectUri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-chat-test';

beforeAll(async () => {
  try {
    await mongoose.connect(connectUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    // ensure indexes are built
    await mongoose.connection.db.command({ ping: 1 });
  } catch (e) {
    // let tests surface connection errors
    console.error('Mongoose connection error in jest setup:', e.message);
  }
});

afterAll(async () => {
  try {
    await mongoose.connection.dropDatabase();
  } catch (e) {}
  try {
    await mongoose.disconnect();
  } catch (e) {}
});
