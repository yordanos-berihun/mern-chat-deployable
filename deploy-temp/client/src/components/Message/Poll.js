import React, { useState } from 'react';
import './Poll.css';

const Poll = ({ onSend, onClose }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const addOption = () => setOptions([...options, '']);
  
  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (question.trim() && options.filter(o => o.trim()).length >= 2) {
      onSend({ question, options: options.filter(o => o.trim()), votes: {} });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="poll-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Create Poll</h3>
        <input
          type="text"
          placeholder="Poll question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="poll-question"
        />
        <div className="poll-options">
          {options.map((option, index) => (
            <div key={index} className="poll-option-input">
              <input
                type="text"
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
              />
              {options.length > 2 && (
                <button onClick={() => removeOption(index)} className="remove-option">✕</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addOption} className="add-option">+ Add Option</button>
        <div className="poll-actions">
          <button onClick={handleSend} disabled={!question.trim() || options.filter(o => o.trim()).length < 2}>
            Send Poll
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default Poll;
