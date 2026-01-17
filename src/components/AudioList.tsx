import React, { useState, useEffect } from 'react';
import { LocalAudio } from '../types';
import { formatDuration, formatDate } from '../utils';
import { get_loacl_url } from '../api';
import './AudioList.css';

interface AudioListProps {
  audios: LocalAudio[];
  currentAudio: LocalAudio | null;
  isPlaying: boolean;
  onPlay: (audio: LocalAudio, playlist: LocalAudio[]) => void;
  onDelete?: (audioId: string) => void;
}

export const AudioList: React.FC<AudioListProps> = ({
  audios,
  currentAudio,
  isPlaying,
  onPlay,
  onDelete,
}) => {
  const [coverUrls, setCoverUrls] = useState<Map<string, string>>(new Map());

  // Load cover URLs when component mounts or audios change
  useEffect(() => {
    const loadCoverUrls = async () => {
      const newCoverUrls = new Map<string, string>();
      
      for (const audio of audios) {
        if (audio.cover_path && !coverUrls.has(audio.audio.id)) {
          try {
            const coverUrl = await get_loacl_url(audio.cover_path);
            newCoverUrls.set(audio.audio.id, coverUrl);
          } catch (error) {
            console.error(`Failed to load cover URL for ${audio.audio.title}:`, error);
          }
        }
      }
      
      if (newCoverUrls.size > 0) {
        setCoverUrls(prev => {
          const updated = new Map(prev);
          newCoverUrls.forEach((url, id) => {
            updated.set(id, url);
          });
          return updated;
        });
      }
    };
    
    if (audios.length > 0) {
      loadCoverUrls();
    }
  }, [audios]);
  const isCurrentlyPlaying = (audio: LocalAudio) => {
    return currentAudio?.audio.id === audio.audio.id && isPlaying;
  };

  if (audios.length === 0) {
    return (
      <div className="audio-list-empty">
        <div className="empty-icon">🎵</div>
        <p>No audio files found</p>
        <p className="empty-subtitle">Download some audio files to get started</p>
      </div>
    );
  }

  return (
    <div className="audio-list">
      <div className="audio-list-header">
        <h2>My Music ({audios.length})</h2>
      </div>
      <div className="audio-items">
        {audios.map((audio) => (
          <div
            key={audio.audio.id}
            className={`audio-item ${isCurrentlyPlaying(audio) ? 'playing' : ''}`}
          >
            <div className="audio-item-main" onClick={() => onPlay(audio, audios)}>
              {(() => {
                const localCoverUrl = coverUrls.get(audio.audio.id);
                
                if (localCoverUrl) {
                  return (
                    <img
                      src={localCoverUrl}
                      alt="Cover"
                      className="audio-cover"
                      key={`${audio.audio.id}-${localCoverUrl}`}
                      onLoad={() => console.log('🖼️ Local cover loaded:', audio.audio.title)}
                      onError={() => console.log('❌ Local cover failed:', audio.audio.title)}
                    />
                  );
                } else if (audio.audio.cover) {
                  return (
                    <img
                      src={audio.audio.cover}
                      alt="Cover"
                      className="audio-cover"
                      style={{ opacity: 0.6 }}
                    />
                  );
                } else {
                  return (
                    <div className="audio-cover-placeholder">🎵</div>
                  );
                }
              })()}

              <div className="audio-details">
                <h3 className="audio-title">{audio.audio.title}</h3>
                <p className="audio-artist">{audio.audio.author.join(', ')}</p>
                <div className="audio-meta">
                  <span className="audio-platform">{audio.audio.platform}</span>
                  <span className="audio-duration">{formatDuration(audio.audio.duration)}</span>
                  <span className="audio-date">{formatDate(audio.audio.date)}</span>
                </div>
                {audio.audio.tags.length > 0 && (
                  <div className="audio-tags">
                    {audio.audio.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="tag">#{tag}</span>
                    ))}
                    {audio.audio.tags.length > 3 && (
                      <span className="tag-more">+{audio.audio.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="audio-actions">
                <button className="play-btn">
                  {isCurrentlyPlaying(audio) ? '⏸️' : '▶️'}
                </button>
              </div>
            </div>

            {onDelete && (
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(audio.audio.id);
                }}
                title="Delete audio"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};