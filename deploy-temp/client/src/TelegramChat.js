import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { API_BASE } from './apiClient';
import { useSocket } from './hooks/useSocket';
import { useAuth } from './AuthContext';
import { useChatState } from './ChatContext';
import { useError } from './ErrorContext';
import { useTheme } from './ThemeContext';
import ErrorBoundary from './ErrorBoundary';
import LoadingSpinner from './LoadingSpinner';
import './TelegramChat.css';

const MessageBubble = memo(({ message, currentUser, activeRoom, onReaction, onReply, onEdit, onDelete }) => {
  if (!message || !message.sender || !currentUser) return null;
  
  const isOwnMessage = message.sender._id === currentUser._id;
  const readByCount = message.readBy ? message.readBy.filter(id => id !== currentUser._id).length : 0;
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div className={`message-wrapper ${isOwnMessage ? 'own' : 'other'}`}>
      {!isOwnMessage && (
        <div className="message-avatar">
          <div className="avatar-circle">
            {message.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      )}
      
      <div className={`message-bubble ${isOwnMessage ? 'sent' : 'received'} ${message.optimistic ? 'sending' : ''}`}>
        {!isOwnMessage && activeRoom?.type === 'group' && (
          <div className="sender-name">{message.sender?.name || 'Unknown'}</div>
        )}
        
        {message.replyTo && (
          <div className="reply-preview">
            <div className="reply-sender">{message.replyTo.sender?.name || 'Unknown'}</div>
            <div className="reply-text">{message.replyTo.content}</div>
          </div>
        )}
        
        <div className="message-content">
          {message.messageType === 'text' && message.content}
          {message.messageType === 'image' && message.attachment && (
            <img src={`${API_BASE}${message.attachment.url}`} alt="Image" className="message-image" />
          )}
          {message.messageType === 'file' && message.attachment && (
            <a href={`${API_BASE}${message.attachment.url}`} download className="file-message">
              <span className="file-icon">📎</span>
              <span className="file-name">{message.attachment.filename}</span>
            </a>
          )}
          {message.messageType === 'video' && message.attachment && (
            <video src={`${API_BASE}${message.attachment.url}`} controls className="message-video" />
          )}
          {message.messageType === 'audio' && message.attachment && (
            <audio src={`${API_BASE}${message.attachment.url}`} controls className="message-audio" />
          )}
        </div>
        
        <div className="message-meta">
          <span className="message-time">
            {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            {message.isEdited && <span className="edited-label"> (edited)</span>}
          </span>
          {isOwnMessage && (
            <span className={`message-status ${readByCount > 0 ? 'read' : 'sent'}`}>
              {readByCount > 0 ? '✓✓' : '✓'}
            </span>
          )}
        </div>
        
        <div className="message-reactions">
          <button onClick={() => setShowMenu(!showMenu)} className="reaction-btn">⋯</button>
          {showMenu && (
            <div className="message-menu">
              <button onClick={() => { onReply(message); setShowMenu(false); }}>↩️ Reply</button>
              {isOwnMessage && (
                <>
                  <button onClick={() => { onEdit(message); setShowMenu(false); }}>✏️ Edit</button>
                  <button onClick={() => { onDelete(message._id); setShowMenu(false); }}>🗑️ Delete</button>
                </>
              )}
            </div>
          )}
          <button onClick={() => onReaction(message._id, '👍')} className="reaction-btn">👍</button>
          <button onClick={() => onReaction(message._id, '❤️')} className="reaction-btn">❤️</button>
          <button onClick={() => onReaction(message._id, '😂')} className="reaction-btn">😂</button>
          <button onClick={() => onReaction(message._id, '😮')} className="reaction-btn">😮</button>
          {message.reactions && message.reactions.length > 0 && (
            <div className="reactions-display">
              {message.reactions.map((r, i) => (
                <span key={i} className="reaction-item">{r.emoji}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const TelegramChat = () => {
  const { user: currentUser, logout, apiCall } = useAuth();
  const { state, dispatch } = useChatState();
  const { addError } = useError();
  const { theme, toggleTheme } = useTheme();
  const [socket, setSocket] = useState(null);
  const { socketRef, isConnected } = useSocket(currentUser);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const { rooms, activeRoom, messages, users, unreadCounts, isConnected, optimisticMessages } = state;
  const roomMessages = useMemo(() => messages[activeRoom?._id] || [], [messages, activeRoom?._id]);
  const roomOptimistic = useMemo(() => optimisticMessages[activeRoom?._id] || [], [optimisticMessages, activeRoom?._id]);
  const typingUsers = useMemo(() => state.typingUsers[activeRoom?._id] || [], [state.typingUsers, activeRoom?._id]);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const sanitizeInput = useCallback((input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, '').trim().substring(0, 1000);
  }, []);

  const addOptimisticMessage = useCallback((messageData) => {
    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      ...messageData,
      createdAt: new Date().toISOString(),
      sender: currentUser,
      optimistic: true
    };
    dispatch({
      type: 'ADD_OPTIMISTIC_MESSAGE',
      roomId: activeRoom._id,
      payload: optimisticMsg
    });
    return optimisticMsg._id;
  }, [currentUser, activeRoom, dispatch]);

  const removeOptimisticMessage = useCallback((tempId) => {
    dispatch({
      type: 'REMOVE_OPTIMISTIC_MESSAGE',
      roomId: activeRoom._id,
      messageId: tempId
    });
  }, [activeRoom, dispatch]);

  const loadRoomMessages = useCallback(async (roomId) => {
    setLoadingMessages(true);
    try {
      const response = await apiCall(`/api/messages/room/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dispatch({
            type: 'SET_MESSAGES',
            roomId,
            payload: data.data.messages || []
          });
        }
      }
    } catch (error) {
      addError('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [apiCall, dispatch, addError]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await apiCall('/api/users');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dispatch({ type: 'SET_USERS', payload: data.data || [] });
        }
      }
    } catch (error) {
      addError('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, [apiCall, addError, dispatch]);

  const loadUserRooms = useCallback(async () => {
    const userId = currentUser?._id;
    if (!userId) return;
    
    setLoadingRooms(true);
    try {
      const response = await apiCall(`/api/rooms/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dispatch({ type: 'SET_ROOMS', payload: data.data });
        }
      }
    } catch (error) {
      addError('Failed to load chats');
    } finally {
      setLoadingRooms(false);
    }
  }, [currentUser?._id, apiCall, addError, dispatch]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activeRoom || sending) return;

    const sanitizedContent = sanitizeInput(newMessage);
    if (!sanitizedContent) return;

    setSending(true);
    
    if (editingMessage) {
      // Edit existing message
      try {
        const response = await apiCall(`/api/messages/${editingMessage._id}`, {
          method: 'PUT',
          body: JSON.stringify({ content: sanitizedContent, userId: currentUser._id })
        });
        
        if (response.ok) {
          const data = await response.json();
          dispatch({
            type: 'UPDATE_MESSAGE',
            roomId: activeRoom._id,
            messageId: editingMessage._id,
            payload: data.data
          });
          
          if (socket) {
            socket.emit('messageEdited', {
              messageId: editingMessage._id,
              content: sanitizedContent,
              roomId: activeRoom._id
            });
          }
          
          setNewMessage('');
          setEditingMessage(null);
        }
      } catch (error) {
        addError('Failed to edit message');
      } finally {
        setSending(false);
      }
      return;
    }
    
    // Send new message
    const payload = {
      senderId: currentUser._id,
      room: activeRoom._id,
      content: sanitizedContent,
      replyTo: replyingTo?._id || null
    };
    
    const tempId = addOptimisticMessage({
      content: sanitizedContent,
      room: activeRoom._id,
      messageType: 'text',
      replyTo: replyingTo
    });
    
    try {
      const response = await apiCall('/api/messages', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        removeOptimisticMessage(tempId);
        
        dispatch({
          type: 'ADD_MESSAGE',
          roomId: activeRoom._id,
          payload: data.data
        });
        
        if (socket) {
          socket.emit('sendMessage', {
            ...data.data,
            roomId: activeRoom._id
          });
        }
        
        setNewMessage('');
        setReplyingTo(null);
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      removeOptimisticMessage(tempId);
      addError('Failed to send message');
    } finally {
      setSending(false);
    }
  }, [newMessage, activeRoom, currentUser, sending, editingMessage, addOptimisticMessage, removeOptimisticMessage, apiCall, sanitizeInput, addError, dispatch, socket, replyingTo]);

  const handleRoomClick = useCallback((room) => {
    dispatch({ type: 'SET_ACTIVE_ROOM', payload: room });
    setShowSidebar(false);
    dispatch({ type: 'SET_UNREAD_COUNT', roomId: room._id, count: 0 });
    loadRoomMessages(room._id);
    
    if (socket) {
      socket.emit('joinRoom', room._id);
    }
  }, [loadRoomMessages, dispatch, socket]);

  const markMessagesAsRead = useCallback(async (messages) => {
    if (!messages || !activeRoom || !currentUser) return;
    
    const unreadMessages = messages.filter(
      msg => msg.sender._id !== currentUser._id && 
             (!msg.readBy || !msg.readBy.includes(currentUser._id))
    );
    
    for (const message of unreadMessages) {
      try {
        const response = await apiCall(`/api/messages/${message._id}/read`, {
          method: 'POST',
          body: JSON.stringify({ userId: currentUser._id })
        });
        
        if (response.ok) {
          const data = await response.json();
          dispatch({
            type: 'MARK_AS_READ',
            roomId: activeRoom._id,
            messageId: message._id,
            readBy: data.data.readBy
          });
          
          if (socket) {
            socket.emit('messageRead', {
              messageId: message._id,
              roomId: activeRoom._id,
              userId: currentUser._id
            });
          }
        }
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  }, [activeRoom, currentUser, apiCall, dispatch, socket]);

  const createPrivateChat = useCallback(async (otherUserId) => {
    try {
      const response = await apiCall('/api/rooms/private', {
        method: 'POST',
        body: JSON.stringify({
          user1Id: currentUser._id,
          user2Id: otherUserId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          loadUserRooms();
          handleRoomClick(data.data);
        }
      }
    } catch (error) {
      addError('Failed to create chat');
    }
  }, [currentUser, apiCall, loadUserRooms, handleRoomClick, addError]);

  const handleReaction = useCallback(async (messageId, emoji) => {
    try {
      const response = await apiCall(`/api/messages/${messageId}/reaction`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser._id, emoji })
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: 'ADD_REACTION',
          roomId: activeRoom._id,
          messageId,
          reactions: data.data.reactions
        });
        
        if (socket) {
          socket.emit('messageReaction', {
            messageId,
            roomId: activeRoom._id,
            reactions: data.data.reactions
          });
        }
      }
    } catch (error) {
      addError('Failed to add reaction');
    }
  }, [currentUser, activeRoom, apiCall, dispatch, socket, addError]);

  const handleTyping = useCallback(() => {
    if (!socket || !activeRoom) return;
    
    socket.emit('typing', {
      roomId: activeRoom._id,
      userId: currentUser._id,
      userName: currentUser.name,
      isTyping: true
    });
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        roomId: activeRoom._id,
        userId: currentUser._id,
        isTyping: false
      });
    }, 1000);
  }, [socket, activeRoom, currentUser]);

  const handleEdit = useCallback((message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
  }, []);

  const handleDelete = useCallback(async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    
    try {
      const response = await apiCall(`/api/messages/${messageId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: currentUser._id })
      });
      
      if (response.ok) {
        dispatch({
          type: 'DELETE_MESSAGE',
          roomId: activeRoom._id,
          messageId
        });
        
        if (socket) {
          socket.emit('messageDeleted', {
            messageId,
            roomId: activeRoom._id
          });
        }
      }
    } catch (error) {
      addError('Failed to delete message');
    }
  }, [currentUser, activeRoom, apiCall, dispatch, socket, addError]);

  const handleSearch = useCallback(async (query) => {
    if (!query.trim() || !activeRoom) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await apiCall(`/api/messages/search?roomId=${activeRoom._id}&query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || []);
      }
    } catch (error) {
      addError('Search failed');
    }
  }, [activeRoom, apiCall, addError]);

  const handleFileUpload = useCallback(async (file) => {
    if (!file || !activeRoom || uploading) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('senderId', currentUser._id);
    formData.append('room', activeRoom._id);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: 'ADD_MESSAGE',
          roomId: activeRoom._id,
          payload: data.data
        });
        
        if (socket) {
          socket.emit('sendMessage', {
            ...data.data,
            roomId: activeRoom._id
          });
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      addError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [activeRoom, currentUser, uploading, dispatch, socket, addError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (roomMessages.length > 0) {
      markMessagesAsRead(roomMessages);
    }
  }, [roomMessages, roomOptimistic, markMessagesAsRead]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    const onConnectError = (error) => {
      console.error('Socket connection error:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
    };

    const onConnect = () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
      if (currentUser?._id) s.emit('userOnline', currentUser._id);
      if (activeRoom) s.emit('joinRoom', activeRoom._id);
    };

    const onDisconnect = () => dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });

    const onNewMessage = (message) => {
      if (message.sender._id !== currentUser._id) {
        dispatch({ type: 'ADD_MESSAGE', roomId: message.room, payload: message });
      }
    };

    const onMessageReaction = ({ messageId, reactions }) => {
      if (activeRoom) {
        dispatch({ type: 'ADD_REACTION', roomId: activeRoom._id, messageId, reactions });
      }
    };

    const onUserTyping = ({ userId, userName, roomId, isTyping }) => {
      if (userId !== currentUser._id) {
        dispatch({ type: 'SET_TYPING', roomId, payload: isTyping ? [{ userId, userName }] : [] });
      }
    };

    const onMessageRead = ({ messageId, userId }) => {
      if (activeRoom) {
        const message = roomMessages.find(m => m._id === messageId);
        if (message) {
          const readBy = [...(message.readBy || [])];
          if (!readBy.includes(userId)) readBy.push(userId);
          dispatch({ type: 'MARK_AS_READ', roomId: activeRoom._id, messageId, readBy });
        }
      }
    };

    const onMessageEdited = ({ messageId, content, roomId }) => {
      if (activeRoom?._id === roomId) {
        dispatch({ type: 'EDIT_MESSAGE', roomId, messageId, content, editedAt: new Date() });
      }
    };

    const onMessageDeleted = ({ messageId, roomId }) => {
      if (activeRoom?._id === roomId) {
        dispatch({ type: 'DELETE_MESSAGE', roomId, messageId });
      }
    };

    s.on('connect_error', onConnectError);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('newMessage', onNewMessage);
    s.on('messageReaction', onMessageReaction);
    s.on('userTyping', onUserTyping);
    s.on('messageRead', onMessageRead);
    s.on('messageEdited', onMessageEdited);
    s.on('messageDeleted', onMessageDeleted);

    setSocket(s);
    fetchUsers();

    return () => {
      s.off('connect_error', onConnectError);
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('newMessage', onNewMessage);
      s.off('messageReaction', onMessageReaction);
      s.off('userTyping', onUserTyping);
      s.off('messageRead', onMessageRead);
      s.off('messageEdited', onMessageEdited);
      s.off('messageDeleted', onMessageDeleted);
    };
  }, [fetchUsers, currentUser?._id, dispatch, activeRoom]);

  useEffect(() => {
    if (currentUser?._id) {
      loadUserRooms();
    }
  }, [currentUser?._id, loadUserRooms]);

  if (!currentUser) return null;

  return (
    <ErrorBoundary>
      <div className="telegram-app">
        
        <div className={`sidebar ${showSidebar ? 'open' : ''}`}>
          <div className="sidebar-overlay" onClick={() => setShowSidebar(false)}></div>
          
          <div className="sidebar-header">
            <div className="user-profile">
              <div className="profile-avatar">
                {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="profile-info">
                <h3>{currentUser.name}</h3>
                <span className={`status ${isConnected ? 'online' : 'offline'}`}>
                  {isConnected ? 'Online' : 'Connecting...'}
                </span>
              </div>
            </div>
            <div className="header-actions">
              <button className="action-btn" title="New Chat">💬</button>
              <button className="action-btn" onClick={toggleTheme} title="Toggle Theme">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button className="action-btn" onClick={logout} title="Logout">⚙️</button>
            </div>
          </div>

          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(msg => (
                  <div key={msg._id} className="search-result-item">
                    <div className="search-sender">{msg.sender.name}</div>
                    <div className="search-content">{msg.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="chats-list">
            {loadingRooms ? (
              <LoadingSpinner size="small" text="Loading..." />
            ) : (
              rooms.map(room => {
                const otherUser = room.type === 'private' 
                  ? (room.participantData || room.participants || []).find(u => u._id !== currentUser._id)
                  : null;
                const displayName = room.name || otherUser?.name || 'Chat';
                
                return (
                  <div
                    key={room._id}
                    className={`chat-item ${activeRoom?._id === room._id ? 'active' : ''}`}
                    onClick={() => handleRoomClick(room)}
                  >
                    <div className="chat-avatar">
                      {room.type === 'group' ? '👥' : (otherUser?.name?.charAt(0)?.toUpperCase() || 'U')}
                    </div>
                    <div className="chat-info">
                      <div className="chat-name">{displayName}</div>
                      <div className="chat-preview">No messages yet</div>
                    </div>
                    <div className="chat-meta">
                      {unreadCounts[room._id] > 0 && (
                        <span className="unread-count">{unreadCounts[room._id]}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="contacts-section">
            <div className="section-header">
              <h4>Contacts</h4>
            </div>
            {loadingUsers ? (
              <LoadingSpinner size="small" text="Loading..." />
            ) : (
              users.filter(u => u._id !== currentUser?._id).map(user => (
                <div
                  key={user._id}
                  className="contact-item"
                  onClick={() => createPrivateChat(user._id)}
                >
                  <div className="contact-avatar">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="contact-name">{user.name}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="main-chat">
          {activeRoom ? (
            <>
              <div className="chat-header">
                <button className="menu-btn" onClick={() => setShowSidebar(true)}>☰</button>
                <div className="header-info">
                  <div className="chat-avatar">
                    {activeRoom.type === 'group' ? '👥' : 
                      ((activeRoom.participantData || activeRoom.participants || []).find(u => u._id !== currentUser._id)?.name?.charAt(0)?.toUpperCase() || 'U')
                    }
                  </div>
                  <div className="header-details">
                    <h3>{activeRoom.name || 
                      (activeRoom.participantData || activeRoom.participants || []).find(u => u._id !== currentUser._id)?.name || 
                      'Chat'
                    }</h3>
                    <span className="chat-status">
                      {activeRoom.type === 'group' ? `${(activeRoom.participantData || activeRoom.participants || []).length} members` : 'Online'}
                    </span>
                  </div>
                </div>
                <div className="header-actions">
                  <button className="action-btn" title="Search">🔍</button>
                  <button className="action-btn" title="More">⋯</button>
                </div>
              </div>

              <div className="messages-area">
                {loadingMessages && <div className="loading-messages">Loading...</div>}
                {[...roomMessages, ...roomOptimistic].map(message => (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    currentUser={currentUser}
                    activeRoom={activeRoom}
                    onReaction={handleReaction}
                    onReply={setReplyingTo}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
                {typingUsers.length > 0 && (
                  <div className="typing-indicator">
                    {typingUsers[0].userName} is typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="input-area">
                {editingMessage && (
                  <div className="edit-bar">
                    <div>
                      <div className="editing-label">✏️ Editing message</div>
                      <div className="editing-text">{editingMessage.content}</div>
                    </div>
                    <button onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="cancel-edit">×</button>
                  </div>
                )}
                {replyingTo && (
                  <div className="reply-bar">
                    <div>
                      <div className="reply-to-name">Replying to {replyingTo.sender.name}</div>
                      <div className="reply-to-text">{replyingTo.content}</div>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="cancel-reply">×</button>
                  </div>
                )}
                <div className="input-container">
                  <input 
                    type="file" 
                    id="file-upload" 
                    style={{display: 'none'}} 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleFileUpload(file);
                      e.target.value = '';
                    }}
                  />
                  <button className="attach-btn" onClick={() => document.getElementById('file-upload').click()} title="Attach file" disabled={uploading}>
                    {uploading ? '⏳' : '📎'}
                  </button>
                  <button className="attach-btn" onClick={() => addError('Voice call coming soon!')} title="Voice call">📞</button>
                  <button className="attach-btn" onClick={() => addError('Video call coming soon!')} title="Video call">📹</button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message"
                    className="message-input"
                    disabled={sending}
                  />
                  <button 
                    className="send-btn" 
                    onClick={sendMessage} 
                    disabled={sending || !newMessage.trim()}
                    title={editingMessage ? 'Save' : 'Send'}
                  >
                    {sending ? '⏳' : (editingMessage ? '✓' : '➤')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="welcome-screen">
              <div className="welcome-content">
                <div className="welcome-icon">💬</div>
                <h2>Welcome to Chat</h2>
                <p>Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default TelegramChat;