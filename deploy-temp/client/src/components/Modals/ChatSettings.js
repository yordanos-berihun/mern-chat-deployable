import React, { useState } from 'react';
import './ChatSettings.css';

const ChatSettings = ({ room, currentUser, onClose, onMute, onBlock, onDisappearing, onExport }) => {
  const [muteTime, setMuteTime] = useState('1h');
  const [disappearTime, setDisappearTime] = useState('24h');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chat-settings-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Chat Settings</h3>
        
        <div className="setting-section">
          <h4>🔕 Mute Notifications</h4>
          <select value={muteTime} onChange={(e) => setMuteTime(e.target.value)}>
            <option value="1h">1 hour</option>
            <option value="8h">8 hours</option>
            <option value="1d">1 day</option>
            <option value="1w">1 week</option>
            <option value="forever">Forever</option>
          </select>
          <button onClick={() => { onMute(muteTime); onClose(); }}>Mute</button>
        </div>

        <div className="setting-section">
          <h4>⏱️ Disappearing Messages</h4>
          <select value={disappearTime} onChange={(e) => setDisappearTime(e.target.value)}>
            <option value="off">Off</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="90d">90 days</option>
          </select>
          <button onClick={() => { onDisappearing(disappearTime); onClose(); }}>Set</button>
        </div>

        {room.type === 'private' && (
          <div className="setting-section">
            <h4>🚫 Block User</h4>
            <button onClick={() => { if (window.confirm('Block this user?')) { onBlock(); onClose(); } }} className="danger-btn">
              Block User
            </button>
          </div>
        )}

        <div className="setting-section">
          <h4>📥 Export Chat</h4>
          <button onClick={() => { onExport(); onClose(); }}>Export as TXT</button>
        </div>

        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    </div>
  );
};

export default ChatSettings;
