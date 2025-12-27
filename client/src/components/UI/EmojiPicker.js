import React from 'react';
import './EmojiPicker.css';

const EMOJIS = ['😀','😂','😍','😎','😢','😡','👍','❤️','🔥','✨','🎉','💯','👏','🙏','💪','🤔','😮','😱','🤗','😴'];

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  return (
    <div className="emoji-picker">
      <div className="emoji-grid">
        {EMOJIS.map(emoji => (
          <button key={emoji} onClick={() => onEmojiSelect(emoji)} className="emoji-btn">
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
