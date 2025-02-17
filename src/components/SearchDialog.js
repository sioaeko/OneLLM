import React, { useState, useEffect } from 'react';
import './SearchDialog.css';
import { BackIcon, SearchIcon } from './icons/OneUIIcons';

function SearchDialog({ isOpen, onClose, messages, onSelectMessage }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const results = messages.filter(message => 
        message.text.toLowerCase().includes(searchTerm.toLowerCase())
      ).map((message, index) => ({
        ...message,
        index
      }));
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, messages]);

  if (!isOpen) return null;

  return (
    <div className="search-overlay">
      <div className="search-container">
        <div className="search-header">
          <button className="close-button" onClick={onClose}>
            <BackIcon />
          </button>
          <div className="search-input-wrapper">
            <SearchIcon />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="대화 내용 검색"
              autoFocus
            />
          </div>
        </div>
        
        <div className="search-content">
          {searchResults.length > 0 ? (
            searchResults.map((result, index) => (
              <div 
                key={index} 
                className="search-item"
                onClick={() => {
                  onSelectMessage(result.index);
                  onClose();
                }}
              >
                <div className="search-item-content">
                  <div className="search-item-header">
                    <span className="search-item-sender">
                      {result.isUser ? '나' : 'AI'}
                    </span>
                    <span className="search-item-time">{result.timestamp}</span>
                  </div>
                  <p className="search-item-text">
                    {highlightText(result.text, searchTerm)}
                  </p>
                </div>
              </div>
            ))
          ) : searchTerm.trim() ? (
            <div className="empty-results">
              <p>검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="empty-results">
              <p>검색어를 입력하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function highlightText(text, searchTerm) {
  if (!searchTerm.trim()) return text;
  
  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  return parts.map((part, index) => 
    part.toLowerCase() === searchTerm.toLowerCase() ? (
      <span key={index} className="highlight">{part}</span>
    ) : part
  );
}

export default SearchDialog; 