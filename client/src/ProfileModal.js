import React, { useState, useCallback, useRef } from 'react';
import './ProfileModal.css';

const ProfileModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    status: user.status || 'Available',
    avatar: user.avatar || '',
    phone: user.phone || '',
    email: user.email || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const statusOptions = [
    'Available',
    'Busy',
    'Away',
    'Do not disturb',
    'Invisible'
  ];

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  }, []);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setAvatarPreview(base64String);
      setFormData(prev => ({ ...prev, avatar: base64String }));
      setUploading(false);
    };
    reader.onerror = () => {
      setError('Failed to read image');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveAvatar = useCallback(() => {
    setAvatarPreview('');
    setFormData(prev => ({ ...prev, avatar: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (formData.name.length > 50) {
      setError('Name must be less than 50 characters');
      return;
    }

    if (formData.bio.length > 200) {
      setError('Bio must be less than 200 characters');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [formData, onSave, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h3>Edit Profile</h3>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          {error && <div className="profile-error">{error}</div>}

          <div className="profile-avatar-section">
            <div className="profile-avatar-large" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
              {uploading ? (
                <div className="avatar-uploading">Uploading...</div>
              ) : avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder-large">
                  {formData.name.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div className="avatar-actions">
              <button type="button" onClick={handleAvatarClick} className="btn-upload" disabled={uploading}>
                {avatarPreview ? 'Change Avatar' : 'Upload Avatar'}
              </button>
              {avatarPreview && (
                <button type="button" onClick={handleRemoveAvatar} className="btn-remove" disabled={uploading}>
                  Remove
                </button>
              )}
            </div>
            <p className="avatar-hint">Max 5MB • JPG, PNG, GIF</p>
          </div>

          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              maxLength={50}
              required
              disabled={saving}
            />
            <span className="char-count">{formData.name.length}/50</span>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              maxLength={200}
              rows={3}
              disabled={saving}
            />
            <span className="char-count">{formData.bio.length}/200</span>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1234567890"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              disabled
            />
          </div>

          <div className="form-group">
            <label>Member Since</label>
            <input
              type="text"
              value={new Date(user.createdAt).toLocaleDateString()}
              disabled
            />
          </div>

          <div className="form-group">
            <label>Last Seen</label>
            <input
              type="text"
              value={user.isOnline ? 'Online now' : new Date(user.lastSeen).toLocaleString()}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={saving}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="profile-modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
