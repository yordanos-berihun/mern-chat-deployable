import React, { useState, memo } from 'react';
import { API_BASE } from '../../apiClient';
import LazyImage from '../UI/LazyImage';
import LinkPreview from './LinkPreview';
import ReadReceipts from './ReadReceipts';
import TimeAgo from '../UI/TimeAgo';

const MessageItem = memo(({ message, currentUser, onReactionClick, activeRoom, onEdit, onDelete, onReply, onForward, onImageClick, onPin, onBookmark, onLike, apiCall }) => {
  const isOwnMessage = message.sender._id === currentUser._id;
  const readByCount = message.readBy ? message.readBy.filter(id => id !== currentUser._id).length : 0;
  const totalParticipants = activeRoom ? activeRoom.participants.length - 1 : 0;
  const isReadByAll = readByCount === totalParticipants && totalParticipants > 0;
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = message.messageType === 'text' && message.content ? message.content.match(urlRegex) : [];

  return (
    <div className={`message ${isOwnMessage ? 'own-message' : ''} ${message.optimistic ? 'optimistic' : ''}`}>
      {message.replyTo && (
        <div className="reply-preview">
          <div className="reply-line"></div>
          <div className="reply-content">
            <span className="reply-sender">{message.replyTo.sender.name}</span>
            <span className="reply-text">{message.replyTo.content}</span>
          </div>
        </div>
      )}

      <div className="message-header">
        <div className="sender-info">
          {message.sender.avatar && (
            <img src={message.sender.avatar} alt="Avatar" className="message-avatar" />
          )}
          <strong>{message.sender.name}</strong>
        </div>
        <span className="timestamp">
          {message.isEdited && <span className="edited-indicator">edited</span>}
          <TimeAgo date={message.createdAt} />
        </span>
        <div className="message-menu">
          <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>⋯</button>
          {showMenu && (
            <div className="menu-dropdown">
              <button onClick={() => { onReply(message); setShowMenu(false); }}>Reply</button>
              <button onClick={() => { onForward(message); setShowMenu(false); }}>Forward</button>
              <button onClick={() => { onBookmark(message._id); setShowMenu(false); }}>Bookmark</button>
              {activeRoom?.admins?.includes(currentUser._id) && (
                <button onClick={() => { onPin(message._id); setShowMenu(false); }}>Pin</button>
              )}
              {isOwnMessage && (
                <>
                  <button onClick={() => { onEdit(message); setShowMenu(false); }}>Edit</button>
                  <button onClick={() => { setShowDeleteMenu(true); setShowMenu(false); }}>Delete</button>
                </>
              )}
            </div>
          )}
          {showDeleteMenu && (
            <div className="delete-menu-dropdown">
              <button onClick={() => { onDelete(message._id, false); setShowDeleteMenu(false); }}>Delete for me</button>
              {isOwnMessage && (
                <button onClick={() => { onDelete(message._id, true); setShowDeleteMenu(false); }}>Delete for everyone</button>
              )}
              <button onClick={() => setShowDeleteMenu(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      <div className="message-content">
        {message.messageType === 'text' && message.content}
        {message.messageType === 'image' && message.attachment && (
          <LazyImage
            src={`${API_BASE}${message.attachment.url}`}
            alt="Shared content"
            className="message-image"
            onClick={() => onImageClick(message)}
            style={{ cursor: 'pointer' }}
          />
        )}
        {message.messageType === 'video' && message.attachment && (
          <video controls className="message-video">
            <source src={`${API_BASE}${message.attachment.url}`} type={message.attachment.type} />
          </video>
        )}
        {message.messageType === 'audio' && message.attachment && (
          <audio controls className="message-audio">
            <source src={`${API_BASE}${message.attachment.url}`} type={message.attachment.type} />
          </audio>
        )}
        {message.messageType === 'file' && message.attachment && (
          <a href={`${API_BASE}${message.attachment.url}`} download className="file-link">
            📎 {message.attachment.filename}
          </a>
        )}
      </div>

      {urls && urls.length > 0 && (
        <div className="message-links">
          {urls.slice(0, 2).map((url, idx) => (
            <LinkPreview key={idx} url={url} apiCall={apiCall} />
          ))}
        </div>
      )}

      {isOwnMessage && (
        <div className="message-status">
          <ReadReceipts readBy={message.readBy} participants={activeRoom?.participants} />
        </div>
      )}

      <div className="message-reactions">
        <button onClick={() => onLike(message._id)} className="like-btn" title="Like">
          {message.likes?.includes(currentUser._id) ? '❤️' : '🤍'}
          {message.likes?.length > 0 && <span className="like-count">{message.likes.length}</span>}
        </button>
        {['👍', '❤️', '😂', '😮'].map(emoji => (
          <button
            key={emoji}
            onClick={() => onReactionClick(message._id, emoji)}
            className="reaction-btn"
          >
            {emoji}
          </button>
        ))}
        {message.reactions?.map((reaction, idx) => (
          <span key={idx} className="reaction">
            {reaction.emoji}
          </span>
        ))}
      </div>
    </div>
  );
});

export default MessageItem;
