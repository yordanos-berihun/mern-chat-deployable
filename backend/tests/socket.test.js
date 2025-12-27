const io = require('socket.io-client');
const { createServer } = require('http');
const { Server } = require('socket.io');
const setupSocket = require('../socket/socketHandler');

let ioServer, serverSocket, clientSocket;

beforeAll((done) => {
  const httpServer = createServer();
  ioServer = new Server(httpServer);
  setupSocket(ioServer);
  
  httpServer.listen(() => {
    const port = httpServer.address().port;
    clientSocket = io(`http://localhost:${port}`);
    
    ioServer.on('connection', (socket) => {
      serverSocket = socket;
    });
    
    clientSocket.on('connect', done);
  });
});

afterAll(() => {
  ioServer.close();
  clientSocket.close();
});

describe('Socket.IO Events', () => {
  test('userOnline - broadcasts user status', (done) => {
    clientSocket.on('userOnline', (data) => {
      expect(data.userId).toBeDefined();
      done();
    });
    
    clientSocket.emit('userOnline', { userId: 'test123' });
  });

  test('typing - broadcasts typing status', (done) => {
    clientSocket.on('userTyping', (data) => {
      expect(data.roomId).toBe('room123');
      expect(data.isTyping).toBe(true);
      done();
    });
    
    clientSocket.emit('typing', { roomId: 'room123', isTyping: true });
  });

  test('joinRoom - user joins room', (done) => {
    clientSocket.emit('joinRoom', 'room123');
    setTimeout(() => {
      expect(serverSocket.rooms.has('room123')).toBe(true);
      done();
    }, 100);
  });

  test('newMessage - broadcasts message', (done) => {
    const message = { content: 'Hello', roomId: 'room123' };
    
    clientSocket.on('newMessage', (data) => {
      expect(data.content).toBe('Hello');
      done();
    });
    
    ioServer.to('room123').emit('newMessage', message);
  });

  test('messageRead - marks message as read', (done) => {
    clientSocket.on('messageRead', (data) => {
      expect(data.messageId).toBe('msg123');
      done();
    });
    
    clientSocket.emit('messageRead', { messageId: 'msg123', userId: 'user123' });
  });
});
