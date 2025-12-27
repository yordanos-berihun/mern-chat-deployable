const request = require('supertest');
const express = require('express');
const roomRoutes = require('../../routes/rooms-simple');

const app = express();
app.use(express.json());
app.use('/api/rooms', roomRoutes);

describe('Room Integration Tests', () => {
  let userId1, userId2;

  beforeEach(() => {
    userId1 = 'user_123';
    userId2 = 'user_456';
  });

  describe('Room Management Flow', () => {
    test('should create and retrieve user rooms', async () => {
      // Get initial rooms (should create default)
      const getRoomsResponse = await request(app)
        .get(`/api/rooms/user/${userId1}`);

      expect(getRoomsResponse.status).toBe(200);
      expect(getRoomsResponse.body.success).toBe(true);
      expect(getRoomsResponse.body.data).toHaveLength(1);
      expect(getRoomsResponse.body.data[0].name).toBe('General Chat');
    });

    test('should create private room between users', async () => {
      const createRoomResponse = await request(app)
        .post('/api/rooms/private')
        .send({
          user1Id: userId1,
          user2Id: userId2
        });

      expect(createRoomResponse.status).toBe(201);
      expect(createRoomResponse.body.success).toBe(true);
      expect(createRoomResponse.body.data.type).toBe('private');
      expect(createRoomResponse.body.data.participants).toContain(userId1);
      expect(createRoomResponse.body.data.participants).toContain(userId2);

      // Verify both users have the room
      const user1Rooms = await request(app).get(`/api/rooms/user/${userId1}`);
      const user2Rooms = await request(app).get(`/api/rooms/user/${userId2}`);

      expect(user1Rooms.body.data).toHaveLength(2); // Default + private
      expect(user2Rooms.body.data).toHaveLength(2); // Default + private
    });

    test('should not create duplicate private rooms', async () => {
      // Create first room
      await request(app)
        .post('/api/rooms/private')
        .send({
          user1Id: userId1,
          user2Id: userId2
        });

      // Try to create duplicate
      const duplicateResponse = await request(app)
        .post('/api/rooms/private')
        .send({
          user1Id: userId1,
          user2Id: userId2
        });

      expect(duplicateResponse.status).toBe(200);
      expect(duplicateResponse.body.success).toBe(true);

      // Should still have only 2 rooms for each user
      const user1Rooms = await request(app).get(`/api/rooms/user/${userId1}`);
      expect(user1Rooms.body.data).toHaveLength(2);
    });

    test('should create group room', async () => {
      const createGroupResponse = await request(app)
        .post('/api/rooms/group')
        .send({
          name: 'Test Group',
          createdBy: userId1,
          participants: [userId2]
        });

      expect(createGroupResponse.status).toBe(201);
      expect(createGroupResponse.body.success).toBe(true);
      expect(createGroupResponse.body.data.name).toBe('Test Group');
      expect(createGroupResponse.body.data.type).toBe('group');
      expect(createGroupResponse.body.data.participants).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    test('should fail private room creation without user IDs', async () => {
      const response = await request(app)
        .post('/api/rooms/private')
        .send({
          user1Id: userId1
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Both user IDs required');
    });

    test('should fail group creation without name', async () => {
      const response = await request(app)
        .post('/api/rooms/group')
        .send({
          createdBy: userId1,
          participants: [userId2]
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Name and creator required');
    });
  });
});