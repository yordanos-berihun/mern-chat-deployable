import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSocket } from './hooks/useSocket';
import { API_BASE } from './apiClient';
import EmojiPicker from './components/UI/EmojiPicker';
import LoadingSpinner from './components/UI/LoadingSpinner';
import MessageItem from './components/Message/MessageItem';
import MessagePagination from './components/Message/MessagePagination';
import TypingIndicator from './components/Chat/TypingIndicator';
import OnlineStatus from './components/UI/OnlineStatus';
import SearchMessages from './components/Chat/SearchMessages';
import VoiceRecorder from './components/Chat/VoiceRecorder';
import CreateGroupModal from './components/Modals/CreateGroupModal';
import './EnhancedChat.css';
import './DarkMode.css';

const EnhancedChatApp = () => {
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState({});
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const { socketRef, isConnected: socketConnected } = useSocket(currentUser);
  const [isConnected, setIsConnected] = useState(!!socketConnected);
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkedMessages, setBookmarkedMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const apiCall = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const isForm = options.body instanceof FormData;
    const headers = {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE}${url}`, { credentials: 'include', ...options, headers });
  }, []);

  const loadMessages = useCallback(async (roomId, pageNum = 1) => {
    setLoading(true);
    try {
      const response = await apiCall(`/api/messages/room/${roomId}?page=${pageNum}&limit=50`);
      const data = await response.json();
      if (data.success) {
        setMessages(prev => ({
          ...prev,
          [roomId]: pageNum === 1 ? data.data.messages : [...(prev[roomId] || []), ...data.data.messages]
        }));
        setHasMore(data.data.messages.length === 50);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const loadRooms = useCallback(async () => {
    try {
      const response = await apiCall(`/api/rooms/user/${currentUser._id}`);
      const data = await response.json();
      if (data.success) setRooms(data.data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  }, [apiCall, currentUser._id]);

  const loadUsers = useCallback(async () => {
    try {
      const response = await apiCall('/api/users');
      const data = await response.json();
      if (data.success) setUsers(data.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, [apiCall]);

  const loadBookmarks = useCallback(async () => {
    try {
      const response = await apiCall(`/api/messages/bookmarks/${currentUser._id}`);
      const data = await response.json();
      if (data.success) setBookmarkedMessages(data.data);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  }, [apiCall, currentUser._id]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activeRoom || sending) return;
    setSending(true);
    try {
      const response = await apiCall('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          senderId: currentUser._id,
          room: activeRoom._id,
          content: newMessage,
          replyTo: replyingTo?._id
        })
      });
      if (response.ok) {
        setNewMessage('');
        setReplyingTo(null);
        setEditingMessage(null);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }, [newMessage, activeRoom, currentUser, sending, replyingTo, apiCall]);

  const handleEdit = useCallback((message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
  }, []);

  const handleDelete = useCallback(async (messageId, deleteForEveryone) => {
    try {
      await apiCall(`/api/messages/${messageId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: currentUser._id, deleteForEveryone })
      });
      loadMessages(activeRoom._id);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }, [apiCall, currentUser, activeRoom, loadMessages]);

  const handleReaction = useCallback(async (messageId, emoji) => {
    try {
      await apiCall(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser._id, emoji })
      });
      loadMessages(activeRoom._id);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  }, [apiCall, currentUser, activeRoom, loadMessages]);

  const handlePin = useCallback(async (messageId) => {
    try {
      await apiCall(`/api/messages/${messageId}/pin`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser._id })
      });
      loadRooms();
    } catch (error) {
      console.error('Failed to pin message:', error);
    }
  }, [apiCall, currentUser, loadRooms]);

  const handleBookmark = useCallback(async (messageId) => {
    try {
      await apiCall(`/api/messages/${messageId}/bookmark`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser._id })
      });
      loadBookmarks();
    } catch (error) {
      console.error('Failed to bookmark message:', error);
    }
  }, [apiCall, currentUser, loadBookmarks]);

  const handleForward = useCallback(async (message, targetRoomIds) => {
    try {
      await apiCall(`/api/messages/${message._id}/forward`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser._id, targetRoomIds })
      });
    } catch (error) {
      console.error('Failed to forward message:', error);
    }
  }, [apiCall, currentUser]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file || file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (e) => setFilePreview({ file, url: e.target.result, type: file.type, name: file.name });
    reader.readAsDataURL(file);
  }, []);

  const uploadFile = useCallback(async () => {
    if (!filePreview || !activeRoom) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', filePreview.file);
      formData.append('senderId', currentUser._id);
      formData.append('room', activeRoom._id);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/upload/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (response.ok) {
        setFilePreview(null);
        loadMessages(activeRoom._id);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploadingFile(false);
    }
  }, [filePreview, activeRoom, currentUser, loadMessages]);

  const handleVoiceMessage = useCallback(async (audioBlob) => {
    if (!activeRoom) return;
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice-message.webm');
    formData.append('senderId', currentUser._id);
    formData.append('room', activeRoom._id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/upload/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (response.ok) {
        setShowVoiceRecorder(false);
        loadMessages(activeRoom._id);
      }
    } catch (error) {
      console.error('Failed to send voice message:', error);
    }
  }, [activeRoom, currentUser, loadMessages]);

  const handleTyping = useCallback(() => {
    if (socket && activeRoom) {
      socket.emit('typing', { roomId: activeRoom._id, userId: currentUser._id, userName: currentUser.name });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { roomId: activeRoom._id, userId: currentUser._id });
      }, 1000);
    }
  }, [socket, activeRoom, currentUser]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode);
      return newMode;
    });
  }, []);

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    const onConnect = () => { setIsConnected(true); if (currentUser._id) s.emit('userOnline', currentUser._id); };
    const onDisconnect = () => setIsConnected(false);
    const onNewMessage = (message) => {
      if (message.room === activeRoom?._id) {
        setMessages(prev => ({ ...prev, [message.room]: [...(prev[message.room] || []), message] }));
      }
      setUnreadCounts(prev => ({ ...prev, [message.room]: (prev[message.room] || 0) + 1 }));
    };
    const onUserOnline = (userId) => setOnlineUsers(prev => new Set([...prev, userId]));
    const onUserOffline = (userId) => setOnlineUsers(prev => { const newSet = new Set(prev); newSet.delete(userId); return newSet; });
    const onUserTyping = ({ roomId, userId, userName }) => {
      if (roomId === activeRoom?._id && userId !== currentUser._id) {
        setTypingUsers(prev => ({ ...prev, [roomId]: [...(prev[roomId] || []), userName] }));
      }
    };
    const onStopTyping = ({ roomId, userId }) => {
      setTypingUsers(prev => { const users = (prev[roomId] || []).filter(u => u !== userId); return { ...prev, [roomId]: users }; });
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('newMessage', onNewMessage);
    s.on('userOnline', onUserOnline);
    s.on('userOffline', onUserOffline);
    s.on('userTyping', onUserTyping);
    s.on('stopTyping', onStopTyping);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('newMessage', onNewMessage);
      s.off('userOnline', onUserOnline);
      s.off('userOffline', onUserOffline);
      s.off('userTyping', onUserTyping);
      s.off('stopTyping', onStopTyping);
    };
  }, [socketRef, currentUser._id, activeRoom?._id]);

  useEffect(() => {
    loadRooms();
    loadUsers();
  }, [loadRooms, loadUsers]);

  useEffect(() => {
    if (activeRoom) {
      loadMessages(activeRoom._id);
      setPinnedMessages(activeRoom.pinnedMessages || []);
      if (socket) {
        socket.emit('joinRoom', activeRoom._id);
        socket.emit('markRoomAsRead', activeRoom._id);
      }
      setUnreadCounts(prev => ({ ...prev, [activeRoom._id]: 0 }));
    }
  }, [activeRoom, loadMessages, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[activeRoom?._id]]);

  const roomMessages = messages[activeRoom?._id] || [];
  const typingInRoom = typingUsers[activeRoom?._id] || [];

  return (
    <div className={`enhanced-chat-app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className={`chat-sidebar ${showSidebar ? 'mobile-open' : ''}`}>
        <div className="user-info">
          <h3>{currentUser.name}</h3>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </div>
          <button onClick={toggleDarkMode} className="theme-toggle-btn">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="sidebar-actions">
          <button onClick={() => setShowCreateGroup(true)}>+ Create Group</button>
          <button onClick={() => { loadBookmarks(); setShowBookmarks(true); }}>📑 Bookmarks</button>
        </div>

        <div className="rooms-section">
          <h4>Chats</h4>
          {rooms.map(room => (
            <div key={room._id} className={`room-item ${activeRoom?._id === room._id ? 'active' : ''}`} onClick={() => setActiveRoom(room)}>
              <span>{room.name || 'Chat'}</span>
              {unreadCounts[room._id] > 0 && <span className="unread-badge">{unreadCounts[room._id]}</span>}
            </div>
          ))}
        </div>

        <div className="users-section">
          <h4>Users</h4>
          {users.filter(u => u._id !== currentUser._id).map(user => (
            <div key={user._id} className="user-item" onClick={async () => {
              const response = await apiCall('/api/rooms/private', {
                method: 'POST',
                body: JSON.stringify({ user1Id: currentUser._id, user2Id: user._id })
              });
              const data = await response.json();
              if (data.success) {
                loadRooms();
                setActiveRoom(data.data);
              }
            }}>
              <OnlineStatus isOnline={onlineUsers.has(user._id)} lastSeen={user.lastSeen} />
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {activeRoom ? (
          <>
            <div className="chat-header">
              <button className="mobile-menu-btn" onClick={() => setShowSidebar(true)}>☰</button>
              <h3>{activeRoom.name || 'Chat'}</h3>
              <button onClick={() => setShowSearch(true)}>🔍</button>
            </div>

            {pinnedMessages.length > 0 && (
              <div className="pinned-messages-bar">
                📌 {pinnedMessages.length} pinned message(s)
              </div>
            )}

            <div className="messages-container">
              {hasMore && <MessagePagination onLoadMore={() => { setPage(p => p + 1); loadMessages(activeRoom._id, page + 1); }} hasMore={hasMore} loading={loading} />}
              {roomMessages.map(message => (
                <MessageItem
                  key={message._id}
                  message={message}
                  currentUser={currentUser}
                  activeRoom={activeRoom}
                  onReactionClick={handleReaction}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReply={setReplyingTo}
                  onForward={handleForward}
                  onPin={handlePin}
                  onBookmark={handleBookmark}
                  apiCall={apiCall}
                />
              ))}
              {typingInRoom.length > 0 && <TypingIndicator users={typingInRoom} />}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
              {filePreview && (
                <div className="file-preview-bar">
                  {filePreview.type.startsWith('image/') && <img src={filePreview.url} alt="Preview" />}
                  <span>{filePreview.name}</span>
                  <button onClick={uploadFile} disabled={uploadingFile}>{uploadingFile ? 'Uploading...' : 'Send'}</button>
                  <button onClick={() => setFilePreview(null)}>✕</button>
                </div>
              )}
              {replyingTo && (
                <div className="replying-banner">
                  Replying to {replyingTo.sender.name}
                  <button onClick={() => setReplyingTo(null)}>✕</button>
                </div>
              )}
              {editingMessage && (
                <div className="editing-banner">
                  Editing message
                  <button onClick={() => { setEditingMessage(null); setNewMessage(''); }}>✕</button>
                </div>
              )}
              <div className="input-row">
                <input type="file" id="file-input" style={{ display: 'none' }} onChange={handleFileSelect} />
                <button onClick={() => document.getElementById('file-input').click()}>📎</button>
                <button onClick={() => setShowVoiceRecorder(true)}>🎤</button>
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😀</button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  disabled={sending}
                />
                <button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
              {showEmojiPicker && <EmojiPicker onEmojiSelect={(emoji) => { setNewMessage(prev => prev + emoji); setShowEmojiPicker(false); }} onClose={() => setShowEmojiPicker(false)} />}
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <h3>Select a chat to start messaging</h3>
          </div>
        )}
      </div>

      {showCreateGroup && <CreateGroupModal users={users.filter(u => u._id !== currentUser._id)} currentUser={currentUser} onClose={() => setShowCreateGroup(false)} onSuccess={() => { loadRooms(); setShowCreateGroup(false); }} apiCall={apiCall} />}
      {showSearch && <SearchMessages roomId={activeRoom._id} onClose={() => setShowSearch(false)} apiCall={apiCall} />}
      {showVoiceRecorder && <VoiceRecorder onSend={handleVoiceMessage} onClose={() => setShowVoiceRecorder(false)} />}
      {showBookmarks && (
        <div className="modal-overlay" onClick={() => setShowBookmarks(false)}>
          <div className="bookmarks-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Bookmarked Messages</h3>
            {bookmarkedMessages.map(msg => (
              <div key={msg._id} className="bookmark-item">
                <strong>{msg.sender.name}</strong> in {msg.room.name}
                <p>{msg.content}</p>
              </div>
            ))}
            <button onClick={() => setShowBookmarks(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChatApp;
