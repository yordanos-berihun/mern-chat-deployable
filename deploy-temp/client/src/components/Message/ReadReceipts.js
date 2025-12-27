import React from 'react';
import './ReadReceipts.css';

const ReadReceipts = ({ readBy, participants }) => {
  if (!readBy || readBy.length === 0) return null;

  const readUsers = readBy.map(read => {
    const user = participants?.find(p => p._id === read.user || p._id === read.user?._id);
    return user ? { ...user, readAt: read.readAt } : null;
  }).filter(Boolean);

  if (readUsers.length === 0) return null;

  return (
    <div className="read-receipts">
      <span className="read-icon">✓✓</span>
      <div className="read-tooltip">
        {readUsers.map(user => (
          <div key={user._id} className="read-user">
            {user.name} • {new Date(user.readAt).toLocaleTimeString()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadReceipts;
