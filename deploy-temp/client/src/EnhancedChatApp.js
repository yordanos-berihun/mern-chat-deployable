import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useSocket } from './hooks/useSocket';
import { useAuth } from './AuthContext';
import EmojiPicker from './components/UI/EmojiPicker';
import LoadingSpinner from './components/UI/LoadingSpinner';
import MessageItem from './components/Message/MessageItem';
import MessagePagination from './components/Message/MessagePagination';
import TypingIndicator from './components/Chat/TypingIndicator';
import OnlineStatus from './components/UI/OnlineStatus';
import SearchMessages from './components/Chat/SearchMessages';
import VoiceRecorder from './components/Chat/VoiceRecorder';
import CreateGroupModal from './components/Modals/CreateGroupModal';
import VideoCall from './components/Call/VideoCall';
import LocationShare from './components/Message/LocationShare';
import Poll from './components/Message/Poll';
import Stickers from './components/UI/Stickers';
import ChatSettings from './components/Modals/ChatSettings';
import Status from './components/Status/Status';
import ProfileModal from './ProfileModal';
import './EnhancedChat.css';
import './DarkMode.css';

const EnhancedChatApp = () => {
  const { user: currentUser } = useAuth();
  
  if (!currentUser) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading user data...</div>;
  }
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState({});
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const { socketRef: sharedSocketRef, isConnected: socketConnected } = useSocket(currentUser);
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
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [callTarget, setCallTarget] = useState(null);
  const [showLocationShare, setShowLocationShare] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [messageDraft, setMessageDraft] = useState({});

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevRoomRef = useRef(null);
  const activeRoomRef = useRef(null);
  const listRef = useRef(null);
  const lastTypingEmitRef = useRef(0);

  // Base API URL (use REACT_APP_API_URL in production)
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  /**
   * Centralized API call helper
   * - Uses `credentials: 'include'` so HttpOnly refresh cookie is sent automatically
   * - Sets Content-Type only when body is not FormData (browser will set multipart boundary)
   * - If a non-cookie access token is stored (not recommended), it will still be sent
   */
  const apiCall = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('token'); // avoid long-term storage in production
    const isFormData = options.body instanceof FormData;

    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

    return fetch(`${API_BASE}${url}`, {
      credentials: 'include',
      ...options,
      headers
    });
  }, []);

  const loadMessages = useCallback(async (roomId, pageNum = 1) => {
    if (loading) return;
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
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [apiCall, loading]);

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
    setMessageDraft(prev => ({ ...prev, [activeRoom._id]: '' }));
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

  const handleLike = useCallback(async (messageId) => {
    try {
      await apiCall(`/api/messages/${messageId}/like`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser._id })
      });
      loadMessages(activeRoom._id);
    } catch (error) {
      console.error('Failed to like message:', error);
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
      // Use API_BASE and include credentials so refresh cookie is sent.
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/upload/upload`, {
        method: 'POST',
        credentials: 'include',
        // Do not set Content-Type for FormData - browser sets the multipart boundary
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

  const handleLocationShare = useCallback(async (location) => {
    if (!activeRoom) return;
    try {
      await apiCall('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          senderId: currentUser._id,
          room: activeRoom._id,
          content: `Location: ${location.latitude}, ${location.longitude}`,
          messageType: 'location',
          location
        })
      });
      loadMessages(activeRoom._id);
    } catch (error) {
      console.error('Failed to share location:', error);
    }
  }, [activeRoom, currentUser, apiCall, loadMessages]);

  const handlePollSend = useCallback(async (poll) => {
    if (!activeRoom) return;
    try {
      await apiCall('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          senderId: currentUser._id,
          room: activeRoom._id,
          content: poll.question,
          messageType: 'poll',
          poll
        })
      });
      loadMessages(activeRoom._id);
    } catch (error) {
      console.error('Failed to send poll:', error);
    }
  }, [activeRoom, currentUser, apiCall, loadMessages]);

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

  const handleStickerSend = useCallback(async (content, type) => {
    if (!activeRoom) return;
    try {
      await apiCall('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          senderId: currentUser._id,
          room: activeRoom._id,
          content,
          messageType: type
        })
      });
      loadMessages(activeRoom._id);
    } catch (error) {
      console.error('Failed to send sticker:', error);
    }
  }, [activeRoom, currentUser, apiCall, loadMessages]);

  const handleMute = useCallback(async (time) => {
    if (!activeRoom) return;
    try {
      await apiCall(`/api/rooms/${activeRoom._id}/mute`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser._id, muteTime: time })
      });
    } catch (error) {
      console.error('Failed to mute:', error);
    }
  }, [activeRoom, currentUser, apiCall]);

  const handleBlock = useCallback(async () => {
    if (!activeRoom) return;
    try {
      await apiCall(`/api/users/block`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser._id, blockUserId: activeRoom.participants.find(p => p !== currentUser._id) })
      });
    } catch (error) {
      console.error('Failed to block:', error);
    }
  }, [activeRoom, currentUser, apiCall]);

  const handleDisappearing = useCallback(async (time) => {
    if (!activeRoom) return;
    try {
      await apiCall(`/api/rooms/${activeRoom._id}/disappearing`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser._id, disappearTime: time })
      });
    } catch (error) {
      console.error('Failed to set disappearing:', error);
    }
  }, [activeRoom, currentUser, apiCall]);

  const handleExport = useCallback(() => {
    if (!activeRoom) return;
    const msgs = messages[activeRoom._id] || [];
    const text = msgs.map(m => `[${new Date(m.createdAt).toLocaleString()}] ${m.sender.name}: ${m.content}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${activeRoom.name || 'export'}.txt`;
    a.click();
  }, [activeRoom, messages]);

  const handleStatusPost = useCallback(async (status) => {
    try {
      await apiCall('/api/status', {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser._id, ...status })
      });
    } catch (error) {
      console.error('Failed to post status:', error);
    }
  }, [currentUser, apiCall]);

  useEffect(() => {
    if (activeRoom && messageDraft[activeRoom._id]) {
      setNewMessage(messageDraft[activeRoom._id]);
    }
  }, [activeRoom, messageDraft]);

  const handleTyping = useCallback(() => {
    const s = socketRef.current;
    if (!s || !activeRoom) return;

    setMessageDraft(prev => ({ ...prev, [activeRoom._id]: newMessage }));

    const now = Date.now();
    // Throttle typing emits to at most once per 500ms
    if (now - lastTypingEmitRef.current > 500) {
      s.emit('typing', { roomId: activeRoom._id, userId: currentUser._id, userName: currentUser.name });
      lastTypingEmitRef.current = now;
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      s.emit('stopTyping', { roomId: activeRoom._id, userId: currentUser._id });
      lastTypingEmitRef.current = 0;
    }, 800);
  }, [activeRoom, currentUser, newMessage]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode);
      return newMode;
    });
  }, []);

  // mirror shared socket ref and connection state
  useEffect(() => { socketRef.current = sharedSocketRef.current; }, [sharedSocketRef.current]);
  useEffect(() => { setIsConnected(!!socketConnected); }, [socketConnected]);

  // attach listeners to the shared socket
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    const onConnect = () => {
      setIsConnected(true);
      if (currentUser?._id) s.emit('userOnline', currentUser._id);
    };

    const onReconnect = () => {
      setIsConnected(true);
      if (currentUser?._id) s.emit('userOnline', currentUser._id);
      const ar = activeRoomRef.current;
      if (ar && ar._id) s.emit('joinRoom', ar._id);
    };

    const onDisconnect = () => setIsConnected(false);

    const onNewMessage = (message) => {
      setMessages(prev => ({ ...prev, [message.room]: [...(prev[message.room] || []), message] }));
      setUnreadCounts(prev => ({ ...prev, [message.room]: (prev[message.room] || 0) + 1 }));
    };

    const onUserOnline = (userId) => setOnlineUsers(prev => new Set([...prev, userId]));
    const onUserOffline = (userId) => setOnlineUsers(prev => { const newSet = new Set(prev); newSet.delete(userId); return newSet; });

    const onUserTyping = ({ roomId, userId, userName }) => {
      setTypingUsers(prev => ({ ...prev, [roomId]: [...(prev[roomId] || []).filter(u => u !== userName), userName] }));
    };

    const onStopTyping = ({ roomId, userId }) => {
      setTypingUsers(prev => { const users = (prev[roomId] || []).filter(u => u !== userId); return { ...prev, [roomId]: users }; });
    };

    const onMessageEdited = ({ messageId, content, editedAt }) => {
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(roomId => {
          updated[roomId] = (updated[roomId] || []).map(m => m._id === messageId ? { ...m, content, editedAt } : m);
        });
        return updated;
      });
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(roomId => { updated[roomId] = (updated[roomId] || []).filter(m => m._id !== messageId); });
        return updated;
      });
    };

    s.on('connect', onConnect);
    s.on('reconnect', onReconnect);
    s.on('disconnect', onDisconnect);
    s.on('newMessage', onNewMessage);
    s.on('userOnline', onUserOnline);
    s.on('userOffline', onUserOffline);
    s.on('userTyping', onUserTyping);
    s.on('stopTyping', onStopTyping);
    s.on('messageEdited', onMessageEdited);
    s.on('messageDeleted', onMessageDeleted);

    return () => {
      s.off('connect', onConnect);
      s.off('reconnect', onReconnect);
      s.off('disconnect', onDisconnect);
      s.off('newMessage', onNewMessage);
      s.off('userOnline', onUserOnline);
      s.off('userOffline', onUserOffline);
      s.off('userTyping', onUserTyping);
      s.off('stopTyping', onStopTyping);
      s.off('messageEdited', onMessageEdited);
      s.off('messageDeleted', onMessageDeleted);
    };
  }, [sharedSocketRef, currentUser?._id]);

  // keep a ref copy of activeRoom for use inside socket handlers
  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  useEffect(() => {
    loadRooms();
    loadUsers();
  }, [loadRooms, loadUsers]);

  useEffect(() => {
    if (activeRoom) {
      setPage(1);
      setHasMore(true);
      loadMessages(activeRoom._id, 1);
      setPinnedMessages(activeRoom.pinnedMessages || []);
      const s = socketRef.current;
      const prevRoomId = prevRoomRef.current;
      if (s) {
        if (prevRoomId && prevRoomId !== activeRoom._id) {
          s.emit('leaveRoom', prevRoomId);
        }
        s.emit('joinRoom', activeRoom._id);
        s.emit('markRoomAsRead', activeRoom._id);
      }
      prevRoomRef.current = activeRoom._id;
      setUnreadCounts(prev => ({ ...prev, [activeRoom._id]: 0 }));
    }
  }, [activeRoom?._id, loadMessages]);

  useEffect(() => {
    const msgs = messages[activeRoom?._id] || [];
    if (listRef.current && msgs.length > 0) {
      try { listRef.current.scrollToItem(msgs.length - 1, 'end'); } catch (e) { /* ignore */ }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeRoom]);

  const roomMessages = messages[activeRoom?._id] || [];
  const typingInRoom = typingUsers[activeRoom?._id] || [];

  return (
    <div className={`enhanced-chat-app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className={`chat-sidebar ${showSidebar ? 'mobile-open' : ''}`}>
        <div className="user-info">
          <div className="user-profile" onClick={() => setShowProfileModal(true)} style={{ cursor: 'pointer' }}>
            <h3>{currentUser.name}</h3>
          </div>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </div>
          <button onClick={toggleDarkMode} className="theme-toggle-btn">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="sidebar-actions">
          <button onClick={() => setShowStatus(true)}>📱 Status</button>
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
              <div className="header-actions">
                <button onClick={() => setShowSearch(true)} title="Search">🔍</button>
                <button onClick={() => setShowChatSettings(true)} title="Settings">⚙️</button>
                {activeRoom.type === 'private' && (
                  <>
                    <button onClick={() => {
                      const otherUser = users.find(u => activeRoom.participants?.includes(u._id) && u._id !== currentUser._id);
                      if (otherUser) {
                        setCallTarget({ ...otherUser, socketId: otherUser._id });
                        setShowVideoCall(true);
                      }
                    }} title="Video Call">📹</button>
                    <button onClick={() => {
                      const otherUser = users.find(u => activeRoom.participants?.includes(u._id) && u._id !== currentUser._id);
                      if (otherUser) {
                        setCallTarget({ ...otherUser, socketId: otherUser._id });
                        setShowVideoCall(true);
                      }
                    }} title="Voice Call">📞</button>
                  </>
                )}
              </div>
            </div>

            {pinnedMessages.length > 0 && (
              <div className="pinned-messages-bar">
                📌 {pinnedMessages.length} pinned message(s)
              </div>
            )}

            <div className="messages-container">
              {hasMore && page === 1 && <MessagePagination onLoadMore={() => loadMessages(activeRoom._id, page + 1)} hasMore={hasMore} loading={loading} />}
              <List
                height={500}
                itemCount={roomMessages.length}
                itemSize={96}
                width={'100%'}
                ref={listRef}
              >
                {({ index, style }) => {
                  const message = roomMessages[index];
                  return (
                    <div style={style} key={message._id}>
                      <MessageItem
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
                        onLike={handleLike}
                        apiCall={apiCall}
                      />
                    </div>
                  );
                }}
              </List>
              {typingInRoom.length > 0 && <TypingIndicator users={typingInRoom} />}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
              {filePreview && (
                <div className="file-preview-bar">
                  {filePreview.type.startsWith('image/') && <img src={filePreview.url} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />}
                  <span>{filePreview.name}</span>
                  <button onClick={uploadFile} disabled={uploadingFile} className="btn-send">{uploadingFile ? 'Uploading...' : 'Send'}</button>
                  <button onClick={() => setFilePreview(null)} className="btn-cancel">✕</button>
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
                <button onClick={() => document.getElementById('file-input').click()} title="Attach file">📎</button>
                <button onClick={() => setShowVoiceRecorder(true)} title="Voice message">🎤</button>
                <button onClick={() => setShowStickers(true)} title="Stickers/GIFs">😊</button>
                <button onClick={() => setShowLocationShare(true)} title="Share location">📍</button>
                <button onClick={() => setShowPoll(true)} title="Create poll">📊</button>
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji">😀</button>
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
      {showLocationShare && <LocationShare onSend={handleLocationShare} onClose={() => setShowLocationShare(false)} />}
      {showPoll && <Poll onSend={handlePollSend} onClose={() => setShowPoll(false)} />}
      {showStickers && <Stickers onSelect={handleStickerSend} onClose={() => setShowStickers(false)} />}
      {showChatSettings && <ChatSettings room={activeRoom} currentUser={currentUser} onClose={() => setShowChatSettings(false)} onMute={handleMute} onBlock={handleBlock} onDisappearing={handleDisappearing} onExport={handleExport} />}
      {showStatus && <Status users={users} currentUser={currentUser} onClose={() => setShowStatus(false)} onPost={handleStatusPost} />}
      {showVideoCall && callTarget && <VideoCall socket={socketRef.current} currentUser={currentUser} targetUser={callTarget} onClose={() => { setShowVideoCall(false); setCallTarget(null); }} />}
      {showProfileModal && <ProfileModal user={currentUser} onClose={() => setShowProfileModal(false)} onSave={async (data) => {
        try {
          const response = await apiCall(`/api/users/${currentUser._id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
          });
          if (response.ok) {
            alert('Profile updated successfully');
            setShowProfileModal(false);
          }
        } catch (error) {
          alert('Failed to update profile');
        }
      }} />}
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
