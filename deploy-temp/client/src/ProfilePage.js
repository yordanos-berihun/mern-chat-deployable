// MERN Stack - User Profile Management Component
import React, { useState, useEffect, useCallback } from 'react';
import FileUpload from './FileUpload'; // Import file upload component
import { api } from './apiClient';

const ProfilePage = ({ user, onBack }) => {
  // STATE MANAGEMENT
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  // FORM STATE
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [status, setStatus] = useState('online');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  
  // AVATAR UPLOAD STATE
  const [showAvatarUpload, setShowAvatarUpload] = useState(false); // Show/hide upload component
  const [avatarUploading, setAvatarUploading] = useState(false);   // Track upload progress

  

  // FETCH PROFILE FUNCTION
    const fetchProfile = useCallback(async () => {
      try {
        setLoading(true);
        const result = await api.get(`/api/profiles/user/${user.id}`);
        if (result && result.success) {
          setProfile(result.data);
          // Populate form fields
          setBio(result.data.bio || '');
          setLocation(result.data.location || '');
          setStatusMessage(result.data.statusMessage || '');
          setStatus(result.data.status || 'online');
          setGithub(result.data.socialLinks?.github || '');
          setLinkedin(result.data.socialLinks?.linkedin || '');
          setTwitter(result.data.socialLinks?.twitter || '');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    }, [API_BASE, user.id]);
  
    // FETCH PROFILE on component mount
    useEffect(() => {
      fetchProfile();
    }, [fetchProfile]);

  // SAVE PROFILE FUNCTION
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);

      const profileData = {
        userId: user.id,
        bio,
        location,
        statusMessage,
        socialLinks: { github, linkedin, twitter },
      };

      const result = await api.post('/api/profiles', profileData);
      if (!result || !result.success) throw new Error(result?.error || 'Failed to save profile');
      setProfile(result.data);
      setEditing(false);
      alert('Profile saved successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // UPDATE STATUS FUNCTION
  const handleStatusChange = async (newStatus) => {
    if (!profile) return;

    try {
      const response = await fetch(`${API_BASE}/profiles/${profile._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, statusMessage }),
      });

      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
        setStatus(newStatus);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // AVATAR UPLOAD SUCCESS HANDLER
  const handleAvatarUploadSuccess = (uploadData) => {
    console.log('✅ Avatar upload successful:', uploadData);
    
    // UPDATE PROFILE WITH NEW AVATAR
    if (uploadData.profile) {
      setProfile(uploadData.profile);
    }
    
    // HIDE UPLOAD COMPONENT
    setShowAvatarUpload(false);
    setAvatarUploading(false);
    
    // SHOW SUCCESS MESSAGE
    alert('Profile picture updated successfully!');
  };

  // AVATAR UPLOAD ERROR HANDLER
  const handleAvatarUploadError = (error) => {
    console.error('❌ Avatar upload failed:', error);
    setAvatarUploading(false);
    setError('Failed to upload profile picture: ' + error.message);
  };

  if (loading && !profile) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>🔄 Loading profile...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1>👤 My Profile</h1>
        <button
          onClick={onBack}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* PROFILE CARD */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px',
      }}>
        {/* AVATAR & BASIC INFO */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          {/* AVATAR WITH UPLOAD BUTTON */}
          <div style={{ position: 'relative', marginRight: '20px' }}>
            <img
              src={profile?.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=007bff&color=fff&size=200`}
              alt="Avatar"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '3px solid #007bff',
                objectFit: 'cover' // Ensure image fits properly
              }}
            />
            {/* CHANGE AVATAR BUTTON */}
            <button
              onClick={() => setShowAvatarUpload(!showAvatarUpload)}
              disabled={avatarUploading}
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Change profile picture"
            >
              {avatarUploading ? '⏳' : '📷'}
            </button>
          </div>
          
          <div>
            <h2 style={{ margin: '0 0 10px 0' }}>{user.name}</h2>
            <p style={{ margin: '0 0 10px 0', color: '#666' }}>📧 {user.email}</p>
            
            {/* STATUS SELECTOR */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span>Status:</span>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                }}
              >
                <option value="online">🟢 Online</option>
                <option value="away">🟡 Away</option>
                <option value="busy">🔴 Busy</option>
                <option value="offline">⚫ Offline</option>
              </select>
            </div>
          </div>
        </div>

        {/* AVATAR UPLOAD COMPONENT */}
        {showAvatarUpload && (
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>📸 Upload Profile Picture</h3>
            <FileUpload
              onUploadSuccess={handleAvatarUploadSuccess}
              onUploadError={handleAvatarUploadError}
              acceptedTypes="image/*"  // Only allow images
              multiple={false}         // Single file only
              maxSize={5}             // 5MB max
              userId={user.id}        // Pass user ID for backend
            />
            <button
              onClick={() => setShowAvatarUpload(false)}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* STATS */}
        {profile && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                {profile.stats?.messagesSent || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Messages Sent</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {profile.daysSinceJoined || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Days Active</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                {profile.isActive ? '✓' : '✗'}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Currently Active</div>
            </div>
          </div>
        )}

        {/* EDIT/VIEW MODE */}
        {!editing ? (
          // VIEW MODE
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>📝 Bio</h3>
              <p style={{ color: '#666' }}>{profile?.bio || 'No bio yet. Click Edit to add one!'}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>📍 Location</h3>
              <p style={{ color: '#666' }}>{profile?.location || 'Not specified'}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>💬 Status Message</h3>
              <p style={{ color: '#666' }}>{profile?.statusMessage || 'No status message'}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>🔗 Social Links</h3>
              <div style={{ display: 'flex', gap: '15px' }}>
                {profile?.socialLinks?.github && (
                  <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
                    GitHub
                  </a>
                )}
                {profile?.socialLinks?.linkedin && (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
                    LinkedIn
                  </a>
                )}
                {profile?.socialLinks?.twitter && (
                  <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
                    Twitter
                  </a>
                )}
                {!profile?.socialLinks?.github && !profile?.socialLinks?.linkedin && !profile?.socialLinks?.twitter && (
                  <span style={{ color: '#999' }}>No social links added</span>
                )}
              </div>
            </div>

            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ✏️ Edit Profile
            </button>
          </div>
        ) : (
          // EDIT MODE
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bio:</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                placeholder="Tell us about yourself..."
              />
              <small style={{ color: '#999' }}>{bio.length}/500 characters</small>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Location:</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={100}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                placeholder="City, Country"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status Message:</label>
              <input
                type="text"
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                maxLength={100}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                placeholder="What's on your mind?"
              />
            </div>

            <h3 style={{ marginBottom: '15px' }}>Social Links</h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>GitHub:</label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
                placeholder="https://github.com/username"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>LinkedIn:</label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Twitter:</label>
              <input
                type="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
                placeholder="https://twitter.com/username"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                {loading ? 'Saving...' : '💾 Save Profile'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  fetchProfile(); // Reset form
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
