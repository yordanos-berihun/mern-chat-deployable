// MERN Stack Frontend - Real-time Chat Component
// This component handles the chat interface with Socket.IO integration

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from './apiClient';
import { useSocket } from './hooks/useSocket';

// CHAT APPLICATION COMPONENT - Main chat interface
const ChatApp = ({ user, onLogout }) => {
  // STATE MANAGEMENT - All chat-related state
  const [messages, setMessages] = useState([]);           // Array of chat messages
  const [newMessage, setNewMessage] = useState('');       // Current message being typed
  const [onlineUsers, setOnlineUsers] = useState([]);     // List of online users
  const [isTyping, setIsTyping] = useState(false);        // Current user typing status
  const [typingUsers, setTypingUsers] = useState([]);     // Other users who are typing
  const [isConnected, setIsConnected] = useState(false);  // Socket connection status
  const [currentRoom, setCurrentRoom] = useState('general'); // Current chat room
  const [error, setError] = useState('');                 // Error messages
  
  // REFS - Direct DOM access and persistent values
  const { socketRef, isConnected: socketConnected } = useSocket(user);
  const messagesEndRef = useRef(null);                    // Reference to scroll to bottom
  const typingTimeoutRef = useRef(null);                  // Timeout for typing indicator
  const messageInputRef = useRef(null);                   // Reference to message input field

  // mirror connection status from hook
  useEffect(() => { setIsConnected(!!socketConnected); }, [socketConnected]);

  // AUTO-SCROLL EFFECT - Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // SCROLL TO BOTTOM FUNCTION - Auto-scroll to show latest messages
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  // SEND MESSAGE FUNCTION - Handle message submission
  const sendMessage = useCallback((e) => {
    e.preventDefault();
    
    // VALIDATE MESSAGE - Check if message has content
    if (!newMessage.trim() || !socketRef.current || !isConnected) {
      return;
    }

    // EMIT MESSAGE - Send to server via Socket.IO
    socketRef.current.emit('sendMessage', {
      content: newMessage.trim(),
      messageType: 'text'
    });

    // CLEAR INPUT - Reset message field
    setNewMessage('');
    
    // STOP TYPING INDICATOR
    handleTypingStop();
    
    // FOCUS INPUT - Keep focus on input field
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [newMessage, isConnected, handleTypingStop]);

  // TYPING INDICATOR FUNCTIONS - Handle typing status
  const handleTypingStart = useCallback(() => {
    if (!isTyping && socketRef.current) {
      setIsTyping(true);
      socketRef.current.emit('typing', { isTyping: true });
    }
    
    // CLEAR EXISTING TIMEOUT
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // SET NEW TIMEOUT - Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  }, [isTyping, handleTypingStop]);

  const handleTypingStop = useCallback(() => {
    if (isTyping && socketRef.current) {
      setIsTyping(false);
      socketRef.current.emit('typing', { isTyping: false });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [isTyping]);

  // INPUT CHANGE HANDLER - Handle message input changes
  const handleInputChange = useCallback((e) => {
    setNewMessage(e.target.value);
    
    // START TYPING INDICATOR - Only if user is actually typing
    if (e.target.value.trim() && !isTyping) {
      handleTypingStart();
    } else if (!e.target.value.trim() && isTyping) {
      handleTypingStop();
    }
  }, [isTyping, handleTypingStart, handleTypingStop]);

  // FORMAT MESSAGE TIME - Convert timestamp to readable format
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      // SHOW TIME - If message is from today
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      // SHOW DATE AND TIME - If message is older
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // RENDER COMPONENT - Chat interface JSX
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      {/* SIDEBAR - Online users and chat info */}
      <div style={{
        width: '250px',
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px',
        overflowY: 'auto'
      }}>
        {/* USER INFO HEADER */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>💬 MERN Chat</h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
            Welcome, <strong>{user.name}</strong>!
          </p>
          <button
            onClick={onLogout}
            style={{
              padding: '5px 10px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Logout
          </button>
        </div>

        {/* CONNECTION STATUS */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            padding: '8px',
            borderRadius: '4px',
            backgroundColor: isConnected ? '#27ae60' : '#e74c3c',
            textAlign: 'center',
            fontSize: '12px'
          }}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>

        {/* CURRENT ROOM */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>📍 Current Room</h4>
          <div style={{
            padding: '8px',
            backgroundColor: '#34495e',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            #{currentRoom}
          </div>
        </div>

        {/* ONLINE USERS LIST */}
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
            👥 Online Users ({onlineUsers.length + 1})
          </h4>
          <div style={{ fontSize: '12px' }}>
            {/* CURRENT USER */}
            <div style={{
              padding: '5px',
              marginBottom: '5px',
              backgroundColor: '#27ae60',
              borderRadius: '4px'
            }}>
              🟢 {user.name} (You)
            </div>
            
            {/* OTHER ONLINE USERS */}
            {onlineUsers.map(onlineUser => (
              <div
                key={onlineUser.id}
                style={{
                  padding: '5px',
                  marginBottom: '5px',
                  backgroundColor: '#34495e',
                  borderRadius: '4px'
                }}
              >
                🟢 {onlineUser.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        {/* CHAT HEADER */}
        <div style={{
          padding: '15px 20px',
          backgroundColor: '#3498db',
          color: 'white',
          borderBottom: '1px solid #ddd'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            💬 Chat Room: #{currentRoom}
          </h2>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div style={{
            padding: '10px 20px',
            backgroundColor: '#e74c3c',
            color: 'white',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* MESSAGES CONTAINER */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {/* RENDER MESSAGES */}
          {messages.map((message, index) => (
            <div
              key={message._id || index}
              style={{
                display: 'flex',
                flexDirection: message.sender._id === user.id ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              {/* MESSAGE BUBBLE */}
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: message.sender._id === user.id ? '#3498db' : '#ecf0f1',
                color: message.sender._id === user.id ? 'white' : '#2c3e50',
                wordWrap: 'break-word'
              }}>
                {/* SENDER NAME - Only show for other users' messages */}
                {message.sender._id !== user.id && (
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    opacity: 0.8
                  }}>
                    {message.sender.name}
                  </div>
                )}
                
                {/* MESSAGE CONTENT */}
                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                  {message.content}
                </div>
                
                {/* MESSAGE TIME */}
                <div style={{
                  fontSize: '11px',
                  marginTop: '4px',
                  opacity: 0.7,
                  textAlign: message.sender._id === user.id ? 'right' : 'left'
                }}>
                  {formatMessageTime(message.createdAt)}
                </div>
              </div>
            </div>
          ))}

          {/* TYPING INDICATORS */}
          {typingUsers.length > 0 && (
            <div style={{
              padding: '10px',
              fontStyle: 'italic',
              color: '#7f8c8d',
              fontSize: '14px'
            }}>
              {typingUsers.map(u => u.name).join(', ')} 
              {typingUsers.length === 1 ? ' is' : ' are'} typing...
            </div>
          )}

          {/* SCROLL ANCHOR - Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>

        {/* MESSAGE INPUT FORM */}
        <form
          onSubmit={sendMessage}
          style={{
            padding: '20px',
            borderTop: '1px solid #ddd',
            backgroundColor: '#f8f9fa'
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              ref={messageInputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder={isConnected ? "Type your message..." : "Connecting..."}
              disabled={!isConnected}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '25px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: isConnected ? 'white' : '#f5f5f5'
              }}
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!isConnected || !newMessage.trim()}
              style={{
                padding: '12px 20px',
                backgroundColor: isConnected && newMessage.trim() ? '#3498db' : '#bdc3c7',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: isConnected && newMessage.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Send 📤
            </button>
          </div>
          
          {/* CHARACTER COUNTER */}
          <div style={{
            textAlign: 'right',
            fontSize: '12px',
            color: '#7f8c8d',
            marginTop: '5px'
          }}>
            {newMessage.length}/1000 characters
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatApp;