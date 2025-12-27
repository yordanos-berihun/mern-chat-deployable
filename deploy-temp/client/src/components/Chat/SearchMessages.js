import React, { useState, useEffect, useRef } from 'react';
import './SearchMessages.css';

const SearchMessages = ({ activeRoom, apiCall, onMessageClick, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(searchTimeoutRef.current);
  }, []);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim() || !activeRoom) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await apiCall(
        `/api/messages/search?roomId=${activeRoom._id}&query=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.success ? data.data : []);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i}>{part}</mark> : part
    );
  };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-panel" onClick={(e) => e.stopPropagation()}>
        <div className="search-header">
          <h3>Search Messages</h3>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>

        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder="Search in this chat..."
            autoFocus
          />
          {searching && <span className="search-spinner">🔍</span>}
        </div>

        <div className="search-results">
          {query.trim() && !searching && results.length === 0 && (
            <div className="no-results">No messages found</div>
          )}
          
          {results.map(msg => (
            <div
              key={msg._id}
              className="search-result-item"
              onClick={() => {
                onMessageClick(msg._id);
                onClose();
              }}
            >
              <div className="result-sender">{msg.sender?.name || 'Unknown'}</div>
              <div className="result-content">
                {highlightText(msg.content, query)}
              </div>
              <div className="result-date">
                {new Date(msg.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchMessages;
