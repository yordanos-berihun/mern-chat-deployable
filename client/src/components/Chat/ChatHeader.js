import React from 'react';

const ChatHeader = ({
  setShowSidebar,
  activeRoom,
  users,
  currentUser,
  socket,
  setCallTarget,
  setShowVideoCall,
  setShowAdminPanel,
  showAdminPanel,
  searchQuery,
  handleSearchChange
}) => {
  return (
    <div className="chat-header">
      <button className="mobile-menu-btn" onClick={() => setShowSidebar(true)}>
        ☰
      </button>
      <h3>{activeRoom.name || 'Chat'}</h3>
      {activeRoom.type === 'private' && (
        <button onClick={() => {
          const otherUser = users.find(u => activeRoom.participants?.includes(u._id) && u._id !== currentUser._id);
          if (otherUser) {
            setCallTarget({ ...otherUser, socketId: socket?.id });
            setShowVideoCall(true);
          }
        }} className="call-btn" title="Start Video Call">
          📹
        </button>
      )}
      {activeRoom.type === 'group' && activeRoom.admins?.includes(currentUser._id) && (
        <button onClick={() => setShowAdminPanel(!showAdminPanel)} className="admin-btn" title="Admin Controls">
          ⚙️
        </button>
      )}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
    </div>
  );
};

export default ChatHeader;
