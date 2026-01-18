import React, { useState } from 'react';
import { SearchQuery } from '../api';
import { get_audio_suggestions } from '../api';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: SearchQuery) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = '搜索音乐、艺术家、标签...',
}) => {
  const [keyword, setKeyword] = useState('');
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleKeywordChange = async (value: string) => {
    setKeyword(value);
    
    if (value.length > 0) {
      try {
        const results = await get_audio_suggestions(value, 8);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Failed to get suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setKeyword(suggestion);
    setShowSuggestions(false);
    handleSearch();
  };

  const handleSearch = () => {
    const query: SearchQuery = {};
    
    if (keyword) query.keyword = keyword;
    if (artist) query.artist = artist;
    if (title) query.title = title;
    
    onSearch(query);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setKeyword('');
    setArtist('');
    setTitle('');
    setShowSuggestions(false);
    onSearch({});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="advanced-toggle">
          {showAdvanced ? '收起' : '高级'}
        </button>
        
        <button onClick={handleSearch} className="search-btn">
          🔍 搜索
        </button>
        
        {(keyword || artist || title) && (
          <button onClick={handleClear} className="clear-btn">
            ✕ 清除
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="advanced-search">
          <div className="advanced-field">
            <label>艺术家:</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入艺术家名称"
            />
          </div>
          <div className="advanced-field">
            <label>歌名:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入歌名"
            />
          </div>
        </div>
      )}
    </div>
  );
};
