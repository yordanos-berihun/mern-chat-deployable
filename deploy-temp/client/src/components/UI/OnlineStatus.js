import React from 'react';
import './OnlineStatus.css';

const OnlineStatus = ({ isOnline, lastSeen, size = 'small' }) => {
  const formatLastSeen = (date) => {
    if (!date) return 'Last seen recently';
    const now = new Date();
    const lastSeenDate = new Date(date);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays < 7) return `Last seen ${diffDays}d ago`;
    return `Last seen ${lastSeenDate.toLocaleDateString()}`;
  };

  return (
    <div className={`online-status ${size}`}>
      <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
      {!isOnline && lastSeen && (
        <span className="last-seen">{formatLastSeen(lastSeen)}</span>
      )}
    </div>
  );
};

export default OnlineStatus;
