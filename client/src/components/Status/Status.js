import React, { useState } from 'react';
import './Status.css';

const Status = ({ users, currentUser, onClose, onPost }) => {
  const [statusText, setStatusText] = useState('');
  const [statusImage, setStatusImage] = useState(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setStatusImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePost = () => {
    if (statusText.trim() || statusImage) {
      onPost({ text: statusText, image: statusImage });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="status-modal" onClick={(e) => e.stopPropagation()}>
        <h3>My Status</h3>
        <div className="status-create">
          <textarea placeholder="What's on your mind?" value={statusText} onChange={(e) => setStatusText(e.target.value)} maxLength={200} />
          {statusImage && (
            <div className="status-image-preview">
              <img src={statusImage} alt="Status" />
              <button onClick={() => setStatusImage(null)}>✕</button>
            </div>
          )}
          <div className="status-actions">
            <input type="file" id="status-image" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
            <button onClick={() => document.getElementById('status-image').click()}>📷 Photo</button>
            <button onClick={handlePost} disabled={!statusText.trim() && !statusImage}>Post</button>
          </div>
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Status;
