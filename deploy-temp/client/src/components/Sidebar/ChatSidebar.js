import React from 'react';
import LoadingSpinner from '../../LoadingSpinner';

const ChatSidebar = ({
  showSidebar,
  setShowSidebar,
  currentUser,
  isConnected,
  theme,
  toggleTheme,
  logout,
  setShowProfileModal,
  showArchived,
  setShowArchived,
  loadingRooms,
  filteredRooms,
  activeRoom,
  handleRoomClick,
  unreadCounts,
  toggleArchiveRoom,
  archivedRooms,
  loadingUsers,
  users,
  createPrivateChat
}) => {
  return (
    <div className={`chat-sidebar ${showSidebar ? 'mobile-open' : ''}`}>
      <div className="sidebar-overlay" onClick={() => setShowSidebar(false)}></div>
      <div className="user-info">
        <div className="user-profile" onClick={() => setShowProfileModal(true)} style={{ cursor: 'pointer' }}>
          {currentUser.avatar && (
            <img src={currentUser.avatar} alt="Profile" className="profile-avatar" />
          )}
          <h3>Welcome, {currentUser.name}</h3>
          {currentUser.status && (
            <span className="user-status-text">{currentUser.status}</span>
          )}
        </div>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">{isConnected ? 'Connected' : 'Reconnecting...'}</span>
        </div>
        <button onClick={toggleTheme} className="theme-toggle-btn" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        {logout && (
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        )}
      </div>

      <div className="rooms-section">
        <div className="rooms-header">
          <h4>Chats</h4>
          <button onClick={() => setShowArchived(!showArchived)} className="archive-toggle-btn" title={showArchived ? 'Show active chats' : 'Show archived chats'}>
            {showArchived ? '📂' : '📦'}
          </button>
        </div>
        {loadingRooms ? (
          <LoadingSpinner size="small" text="Loading chats..." />
        ) : (
          filteredRooms.map(room => (
            <div
              key={room._id}
              className={`room-item ${activeRoom?._id === room._id ? 'active' : ''}`}
              onClick={() => handleRoomClick(room)}
            >
              <div className="room-info">
                <span>{room.name || 'Chat'}</span>
              </div>
              <div className="room-actions">
                {unreadCounts[room._id] > 0 && (
                  <span className="unread-badge">{unreadCounts[room._id]}</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleArchiveRoom(room._id);
                  }}
                  className="archive-room-btn"
                  title={archivedRooms.has(room._id) ? 'Unarchive' : 'Archive'}
                >
                  {archivedRooms.has(room._id) ? '📂' : '📦'}
                </button>
              </div>
            </div>
          ))
        )}
        {filteredRooms.length === 0 && (
          <div className="no-rooms-message">
            {showArchived ? 'No archived chats' : 'No active chats'}
          </div>
        )}
      </div>

      <div className="users-section">
        <h4>Start Private Chat</h4>
        {loadingUsers ? (
          <LoadingSpinner size="small" text="Loading users..." />
        ) : (
          users.filter(u => u._id !== currentUser?._id).map(user => (
            <div
              key={user._id}
              className="user-item"
              onClick={() => createPrivateChat(user._id)}
            >
              <span>{user.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
