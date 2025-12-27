import React from 'react';
import EmojiPicker from '../../EmojiPicker';

const MessageInput = ({
  filePreview,
  uploadFile,
  uploadingFile,
  setFilePreview,
  editingMessage,
  cancelEdit,
  handleFileSelect,
  showEmojiPicker,
  setShowEmojiPicker,
  newMessage,
  setNewMessage,
  sendMessage,
  sending,
  handleEmojiSelect
}) => {
  return (
    <div className="message-input-container">
      {filePreview && (
        <div className="file-preview-bar">
          <div className="file-preview-content">
            {filePreview.type.startsWith('image/') && (
              <img src={filePreview.url} alt="Preview" className="file-preview-img" />
            )}
            <span className="file-preview-name">{filePreview.name}</span>
          </div>
          <div className="file-preview-actions">
            <button onClick={uploadFile} disabled={uploadingFile} className="btn-upload">
              {uploadingFile ? 'Uploading...' : 'Send'}
            </button>
            <button onClick={() => setFilePreview(null)} className="btn-cancel">✕</button>
          </div>
        </div>
      )}
      {editingMessage && (
        <div className="editing-banner">
          <span>✏️ Editing message</span>
          <button onClick={cancelEdit} className="cancel-edit-btn">Cancel</button>
        </div>
      )}
      <div className="input-row">
        <input
          type="file"
          id="file-input"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />
        <button onClick={() => document.getElementById('file-input').click()} title="Attach file">
          📎
        </button>
        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji">
          😀
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
          disabled={sending}
        />
        <button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
          {sending ? 'Sending...' : editingMessage ? 'Save' : 'Send'}
        </button>
      </div>
      {showEmojiPicker && (
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};

export default MessageInput;
