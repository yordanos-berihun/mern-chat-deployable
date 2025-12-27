const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/user');
const Room = require('../models/room');
const Message = require('../models/message');

describe('Integration: Complete Chat Flow', () => {
  let user1Token, user2Token, user1Id, user2Id, roomId;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-chat-test');
    }
    await User.deleteMany({});
    await Room.deleteMany({});
    await Message.deleteMany({});
  });

  afterAll(async () => {
    try { if (mongoose.connection.readyState === 1) await mongoose.connection.close(); } catch (e) {}
  });

  test('1. Register two users', async () => {
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@test.com', password: 'pass123' });
    
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob', email: 'bob@test.com', password: 'pass123' });
    
    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    
    user1Token = res1.body.accessToken;
    user2Token = res2.body.accessToken;
    user1Id = res1.body.user._id;
    user2Id = res2.body.user._id;
  });

  test('2. Create private room', async () => {
    const res = await request(app)
      .post('/api/rooms/private')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ participantId: user2Id });
    
    expect(res.status).toBe(201);
    expect(res.body.participants).toHaveLength(2);
    roomId = res.body._id;
  });

  test('3. Send message', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ roomId, content: 'Hello Bob!' });
    
    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Hello Bob!');
  });

  test('4. Receive message', async () => {
    const res = await request(app)
      .get(`/api/messages/room/${roomId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.messages[0].content).toBe('Hello Bob!');
  });

  test('5. Reply to message', async () => {
    const messages = await Message.find({ roomId });
    const originalMsgId = messages[0]._id;
    
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ roomId, content: 'Hi Alice!', replyTo: originalMsgId });
    
    expect(res.status).toBe(201);
    expect(res.body.replyTo).toBeDefined();
  });

  test('6. Add reaction', async () => {
    const messages = await Message.find({ roomId });
    const messageId = messages[0]._id;
    
    const res = await request(app)
      .post(`/api/messages/${messageId}/reactions`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ emoji: '👍' });
    
    expect(res.status).toBe(200);
  });

  test('7. Search messages', async () => {
    const res = await request(app)
      .get('/api/messages/search')
      .query({ q: 'Hello', roomId })
      .set('Authorization', `Bearer ${user1Token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('8. Get user rooms', async () => {
    const res = await request(app)
      .get(`/api/rooms/user/${user1Id}`)
      .set('Authorization', `Bearer ${user1Token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
