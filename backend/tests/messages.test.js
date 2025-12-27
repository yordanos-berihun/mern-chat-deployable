const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/user');
const Message = require('../models/message');
const Room = require('../models/room');

let token, userId, roomId;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-chat-test');
  }
  
  const user = await User.create({
    username: 'msgtest',
    email: 'msg@test.com',
    password: 'pass123'
  });
  userId = user._id;
  
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'msg@test.com', password: 'pass123' });
  token = loginRes.body.accessToken;
  
  const room = await Room.create({
    name: 'Test Room',
    type: 'private',
    participants: [userId]
  });
  roomId = room._id;
});

afterAll(async () => {
  try { await Message.deleteMany({}); } catch (e) {}
  try { await Room.deleteMany({}); } catch (e) {}
  try { await User.deleteMany({}); } catch (e) {}
  try { if (mongoose.connection.readyState === 1) await mongoose.connection.close(); } catch (e) {}
});

describe('Messages API', () => {
  let messageId;

  test('POST /api/messages - send message', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId, content: 'Test message' });
    
    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Test message');
    messageId = res.body._id;
  });

  test('GET /api/messages/room/:roomId - get messages', async () => {
    const res = await request(app)
      .get(`/api/messages/room/${roomId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBeGreaterThan(0);
  });

  test('POST /api/messages/:id/reactions - add reaction', async () => {
    const res = await request(app)
      .post(`/api/messages/${messageId}/reactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ emoji: '👍' });
    
    expect(res.status).toBe(200);
    expect(res.body.reactions).toBeDefined();
  });

  test('GET /api/messages/search - search messages', async () => {
    const res = await request(app)
      .get('/api/messages/search')
      .query({ q: 'Test', roomId })
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/messages/file - upload file', async () => {
    const res = await request(app)
      .post('/api/messages/file')
      .set('Authorization', `Bearer ${token}`)
      .field('roomId', roomId.toString())
      .attach('file', Buffer.from('test'), 'test.txt');
    
    expect(res.status).toBe(201);
    expect(res.body.fileUrl).toBeDefined();
  });
});
