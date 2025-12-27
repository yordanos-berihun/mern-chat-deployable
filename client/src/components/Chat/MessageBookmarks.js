import React from 'react';

const MessageBookmarks = ({ bookmarks, onRemove, onNavigate }) => {
  return (
    <div className="bookmarks-panel">
      <h3>🔖 Bookmarked Messages</h3>
      {bookmarks.length === 0 ? (
        <p className="no-bookmarks">No bookmarked messages</p>
      ) : (
        <div className="bookmarks-list">
          {bookmarks.map(msg => (
            <div key={msg._id} className="bookmark-item">
              <div className="bookmark-content" onClick={() => onNavigate(msg._id)}>
                <strong>{msg.sender.name}</strong>
                <p>{msg.content}</p>
                <span className="bookmark-date">
                  {new Date(msg.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button onClick={() => onRemove(msg._id)} className="btn-remove">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageBookmarks;
