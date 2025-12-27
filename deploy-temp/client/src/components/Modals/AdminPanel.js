import React from 'react';

const AdminPanel = ({
  showAdminPanel,
  setShowAdminPanel,
  activeRoom,
  currentUser,
  updateGroupName,
  users,
  promoteToAdmin,
  demoteAdmin,
  removeMember,
  addMember
}) => {
  if (!showAdminPanel || activeRoom?.type !== 'group' || !activeRoom.admins?.includes(currentUser._id)) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={() => setShowAdminPanel(false)}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <h3>Group Admin Controls</h3>

        <div className="admin-section">
          <h4>Group Name</h4>
          <input
            type="text"
            defaultValue={activeRoom.name}
            onBlur={(e) => e.target.value !== activeRoom.name && updateGroupName(e.target.value)}
            placeholder="Group name"
          />
        </div>

        <div className="admin-section">
          <h4>Members ({activeRoom.participants?.length || 0})</h4>
          <div className="members-list">
            {activeRoom.participants?.map(participantId => {
              const user = users.find(u => u._id === participantId);
              if (!user) return null;
              const isAdmin = activeRoom.admins?.includes(participantId);
              const isCreator = activeRoom.createdBy === participantId;
              return (
                <div key={participantId} className="member-item">
                  <span>{user.name} {isCreator && '👑'} {isAdmin && '⭐'}</span>
                  {!isCreator && participantId !== currentUser._id && (
                    <div className="member-actions">
                      {!isAdmin && (
                        <button onClick={() => promoteToAdmin(participantId)} title="Promote to admin">⭐</button>
                      )}
                      {isAdmin && activeRoom.createdBy === currentUser._id && (
                        <button onClick={() => demoteAdmin(participantId)} title="Demote admin">⭐</button>
                      )}
                      <button onClick={() => removeMember(participantId)} title="Remove">❌</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-section">
          <h4>Add Member</h4>
          <select onChange={(e) => e.target.value && addMember(e.target.value)} defaultValue="">
            <option value="">Select user...</option>
            {users.filter(u => !activeRoom.participants?.includes(u._id)).map(user => (
              <option key={user._id} value={user._id}>{user.name}</option>
            ))}
          </select>
        </div>

        <button onClick={() => setShowAdminPanel(false)} className="btn-close">Close</button>
      </div>
    </div>
  );
};

export default AdminPanel;
