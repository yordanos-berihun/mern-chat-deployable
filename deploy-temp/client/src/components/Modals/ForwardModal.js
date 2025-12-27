import React from 'react';

const ForwardModal = ({ showForwardModal, setShowForwardModal, forwardingMessage, rooms, activeRoom, forwardMessage }) => {
  if (!showForwardModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowForwardModal(false)}>
      <div className="forward-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Forward Message</h3>
        <p className="forward-preview">{forwardingMessage?.content}</p>
        <div className="forward-rooms-list">
          {rooms.filter(r => r._id !== activeRoom?._id).map(room => (
            <label key={room._id} className="forward-room-item">
              <input
                type="checkbox"
                value={room._id}
                onChange={(e) => {
                  const checkbox = e.target;
                  const roomId = checkbox.value;
                  if (checkbox.checked) {
                    checkbox.dataset.selected = 'true';
                  } else {
                    delete checkbox.dataset.selected;
                  }
                }}
              />
              <span>{room.name || 'Chat'}</span>
            </label>
          ))}
        </div>
        <div className="forward-actions">
          <button onClick={() => setShowForwardModal(false)} className="btn-cancel">
            Cancel
          </button>
          <button
            onClick={() => {
              const selected = Array.from(
                document.querySelectorAll('.forward-room-item input[data-selected="true"]')
              ).map(input => input.value);
              forwardMessage(selected);
            }}
            className="btn-forward"
          >
            Forward
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
