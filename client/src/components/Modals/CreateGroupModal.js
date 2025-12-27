import React, { useState } from 'react';
import './CreateGroupModal.css';

const CreateGroupModal = ({ users, currentUser, onClose, onSuccess, apiCall }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [creating, setCreating] = useState(false);

  const toggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      alert('Enter group name and select at least one member');
      return;
    }

    setCreating(true);
    try {
      const response = await apiCall('/api/rooms/group', {
        method: 'POST',
        body: JSON.stringify({
          name: groupName,
          participants: [currentUser._id, ...selectedUsers]
        })
      });
      if (response.ok) {
        onSuccess();
      } else {
        throw new Error('Failed to create group');
      }
    } catch (error) {
      alert(error.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-group-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Create Group</h2>

        <div className="form-group">
          <label>Group Name</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label>Add Members ({selectedUsers.length} selected)</label>
          <div className="users-list">
            {users.filter(u => u._id !== currentUser._id).map(user => (
              <label key={user._id} className="user-checkbox">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => toggleUser(user._id)}
                />
                <span>{user.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={creating || !groupName.trim() || selectedUsers.length === 0}
            className="btn-create"
          >
            {creating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
