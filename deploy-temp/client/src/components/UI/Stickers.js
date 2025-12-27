import React, { useState } from 'react';
import './Stickers.css';

const STICKERS = [
  '😀', '😂', '🤣', '😍', '😎', '🤔', '😱', '🥳', '😴', '🤗',
  '👍', '👎', '👏', '🙏', '💪', '🔥', '✨', '💯', '❤️', '💔'
];

const GIFS = [
  { url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', name: 'thumbs up' },
  { url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif', name: 'clapping' },
  { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', name: 'dancing' }
];

const Stickers = ({ onSelect, onClose }) => {
  const [tab, setTab] = useState('stickers');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="stickers-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stickers-tabs">
          <button onClick={() => setTab('stickers')} className={tab === 'stickers' ? 'active' : ''}>Stickers</button>
          <button onClick={() => setTab('gifs')} className={tab === 'gifs' ? 'active' : ''}>GIFs</button>
        </div>
        <div className="stickers-content">
          {tab === 'stickers' ? (
            <div className="stickers-grid">
              {STICKERS.map((sticker, idx) => (
                <button key={idx} onClick={() => { onSelect(sticker, 'sticker'); onClose(); }} className="sticker-btn">
                  {sticker}
                </button>
              ))}
            </div>
          ) : (
            <div className="gifs-grid">
              {GIFS.map((gif, idx) => (
                <img key={idx} src={gif.url} alt={gif.name} onClick={() => { onSelect(gif.url, 'gif'); onClose(); }} className="gif-item" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stickers;
