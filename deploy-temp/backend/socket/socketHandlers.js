// MERN Stack - Socket.IO Real-time Communication Handlers
// This file manages WebSocket connections for real-time chat functionality

const Message = require("../models/message");
const User = require("../models/user");
const { sendToUser } = require('../services/pushNotification');

// SOCKET CONNECTION HANDLER - Manages individual client connections
const handleConnection = (io) => {
  // Track online users
  const onlineUsers = new Map();
  
  return (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);
    
    socket.user = null;
    socket.currentRoom = "general";
    
    // User comes online
    socket.on('userOnline', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('userOnline', userId);
      console.log(`✅ User ${userId} is online`);
    });
    
    // Typing indicator
    socket.on('typing', ({ roomId, isTyping }) => {
      if (socket.userId) {
        socket.to(roomId).emit('userTyping', {
          userId: socket.userId,
          roomId,
          isTyping
        });
      }
    });
    
    // Message read receipt
    socket.on('messageRead', async ({ messageId, roomId }) => {
      try {
        const message = await Message.findById(messageId);
        if (message) {
          message.readBy = message.readBy || [];
          if (!message.readBy.includes(socket.userId)) {
            message.readBy.push(socket.userId);
            await message.save();
          }
          io.to(roomId).emit('messageRead', { messageId, userId: socket.userId });
        }
      } catch (error) {
        console.error('Message read error:', error);
      }
    });
    
    // 📝 Message edited event
    socket.on('messageEdited', ({ messageId, content, roomId }) => {
      io.to(roomId).emit('messageEdited', { messageId, content, editedAt: new Date() });
    });
    
    // 🗑️ Message deleted event
    socket.on('messageDeleted', ({ messageId, roomId, deleteForEveryone }) => {
      io.to(roomId).emit('messageDeleted', { messageId, deleteForEveryone });
    });
    
    // EVENT: USER AUTHENTICATION - Client sends user credentials
    socket.on("authenticate", async (data) => {
      try {
        const { userId, token } = data;
        
        // VALIDATE TOKEN - In real app, verify JWT token here
        // For now, we'll just find the user by ID
        const user = await User.findById(userId).select("-passwordHash");
        
        if (!user) {
          socket.emit("authError", { message: "Invalid user credentials" });
          return;
        }
        
        // STORE USER DATA - Associate user with socket connection
        socket.user = user;
        socket.userId = userId;
        
        // JOIN DEFAULT ROOM - Add user to general chat room
        socket.join("general");
        
        // NOTIFY USER - Send authentication success
        socket.emit("authenticated", {
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          },
          room: "general"
        });
        
        // BROADCAST USER ONLINE - Tell other users this user is online
        socket.to("general").emit("userOnline", {
          userId: user._id,
          name: user.name
        });
        
        console.log(`✅ User authenticated: ${user.name} (${socket.id})`);
        
      } catch (error) {
        console.error("Authentication error:", error);
        socket.emit("authError", { message: "Authentication failed" });
      }
    });
    
    // EVENT: SEND MESSAGE - User sends a chat message
    socket.on("sendMessage", async (data) => {
      try {
        const { content, messageType = "text", replyTo, roomId } = data;
        
        // VALIDATE USER - Must be authenticated
        if (!socket.user) {
          socket.emit("error", { message: "Must be authenticated to send messages" });
          return;
        }
        
        // VALIDATE CONTENT - Message must have content
        if (!content || content.trim().length === 0) {
          socket.emit("error", { message: "Message content is required" });
          return;
        }
        
        // USE ROOM FROM DATA OR CURRENT ROOM
        const targetRoom = roomId || socket.currentRoom || "general";
        
        // CREATE MESSAGE - Build message object
        const messageData = {
          sender: socket.userId,
          content: content.trim(),
          messageType,
          room: targetRoom,
          replyTo: replyTo || undefined
        };
        
        // SAVE TO DATABASE - Store message permanently
        const message = new Message(messageData);
        const savedMessage = await message.save();
        
        // POPULATE FIELDS - Get message with user details
        const populatedMessage = await Message.findById(savedMessage._id)
                                             .populate("sender", "name email")
                                             .populate("replyTo", "content sender")
                                             .lean();
        
        // BROADCAST MESSAGE - Send to all users in the room
        io.to(targetRoom).emit("newMessage", populatedMessage);
        
        // SEND PUSH NOTIFICATIONS
        const room = await require('../models/room').findById(targetRoom);
        if (room) {
          const recipients = room.participants.filter(p => p.toString() !== socket.userId);
          for (const recipientId of recipients) {
            const recipient = await User.findById(recipientId);
            if (recipient?.notificationSettings?.messages) {
              await sendToUser(recipientId, {
                title: `${socket.user.name}`,
                body: content.substring(0, 100),
                icon: '/logo192.png',
                badge: '/logo192.png',
                data: { roomId: targetRoom, messageId: savedMessage._id }
              });
            }
          }
        }
        
        console.log(`💬 Message from ${socket.user.name} to room ${targetRoom}: ${content.substring(0, 50)}...`);
        
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });
    
    // EVENT: JOIN ROOM - User joins a specific chat room
    socket.on("joinRoom", async (roomId) => {
      try {
        if (!socket.user) {
          socket.emit("error", { message: "Must be authenticated to join rooms" });
          return;
        }
        
        // LEAVE CURRENT ROOM
        if (socket.currentRoom) {
          socket.leave(socket.currentRoom);
          console.log(`User ${socket.user.name} left room ${socket.currentRoom}`);
        }
        
        // JOIN NEW ROOM
        socket.join(roomId);
        socket.currentRoom = roomId;
        
        console.log(`✅ User ${socket.user.name} joined room ${roomId}`);
        
        // NOTIFY USER
        socket.emit("roomJoined", { roomId });
        
      } catch (error) {
        console.error("Join room error:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });
    
    // EVENT: LEAVE ROOM - User leaves a chat room
    socket.on("leaveRoom", (roomId) => {
      try {
        if (roomId) {
          socket.leave(roomId);
          console.log(`User ${socket.user?.name || 'Unknown'} left room ${roomId}`);
        }
        
        if (socket.currentRoom === roomId) {
          socket.currentRoom = null;
        }
        
      } catch (error) {
        console.error("Leave room error:", error);
      }
    });
    
    // EVENT: TYPING INDICATOR - User is typing a message
    socket.on("typing", (data) => {
      if (!socket.user) return;
      
      // BROADCAST TYPING - Tell other users this user is typing
      socket.to(socket.currentRoom).emit("userTyping", {
        userId: socket.userId,
        name: socket.user.name,
        isTyping: data.isTyping
      });
    });
    
    // EVENT: DISCONNECT - User closes connection
    socket.on("disconnect", (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
      
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('userOffline', socket.userId);
      }
      
      if (socket.user && socket.currentRoom) {
        socket.to(socket.currentRoom).emit("userOffline", {
          userId: socket.userId,
          name: socket.user.name
        });
      }
    });
  };
};

// MIDDLEWARE TO ADD SOCKET.IO TO REQUEST OBJECT
const addSocketToRequest = (io) => {
  return (req, res, next) => {
    req.io = io; // Add socket.io instance to request object
    next();
  };
};

module.exports = {
  handleConnection,
  addSocketToRequest
};