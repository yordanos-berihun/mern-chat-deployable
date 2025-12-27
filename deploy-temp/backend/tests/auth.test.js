const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/user');

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-chat-test');
  }
});

afterAll(async () => {
  try { await User.deleteMany({}); } catch (e) {}
  try { if (mongoose.connection.readyState === 1) await mongoose.connection.close(); } catch (e) {}
});

describe('Auth API', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  };

  test('POST /api/auth/register - success', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.accessToken).toBeDefined();
  });

  test('POST /api/auth/register - duplicate user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login - success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  test('POST /api/auth/login - wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpass' });
    
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/refresh - success', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: loginRes.body.refreshToken });
    
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  test('POST /api/auth/forgot-password - success', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });
    
    expect(res.status).toBe(200);
  });
});
