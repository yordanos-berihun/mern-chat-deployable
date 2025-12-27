import React, { useState } from 'react';
import './ProfileModal.css';
import { API_BASE } from './apiClient';

const ProfileModal = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name || '');
  const [status, setStatus] = useState(user.status || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userId', user._id);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/upload/profile`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setAvatar(`${API_BASE}${data.data.avatar}`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      alert(error.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ name, status, avatar });
      onClose();
    } catch (error) {
      alert(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Profile</h2>
        
        <div className="profile-avatar-section">
          <div className="avatar-preview">
            {avatar ? (
              <img src={avatar} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder">{name.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
          />
          <button onClick={() => document.getElementById('avatar-upload').click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Change Avatar'}
          </button>
        </div>

        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="form-group">
          <label>Status</label>
          <input
            type="text"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="What's on your mind?"
            maxLength={100}
          />
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim()} className="btn-save">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
