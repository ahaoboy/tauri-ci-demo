import React from 'react';
import { LocalAudio } from '../types';
import { AudioPlayer } from '../components/AudioPlayer';
import { AudioList } from '../components/AudioList';
import './PlayerPage.css';

interface PlayerPageProps {
  localAudios: LocalAudio[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  currentAudio: LocalAudio | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLooping: boolean;
  onPlay: (audio: LocalAudio, playlist: LocalAudio[]) => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleLoop: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onDelete?: (audioId: string) => void;
}

export const PlayerPage: React.FC<PlayerPageProps> = ({
  localAudios,
  loading,
  error,
  currentAudio,
  isPlaying,
  currentTime,
  duration,
  volume,
  isLooping,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onToggleLoop,
  onNext,
  onPrevious,
  onDelete,
}) => {
  const handlePlay = () => {
    if (currentAudio) {
      onPlay(currentAudio, localAudios);
    }
  };

  if (loading) {
    return (
      <div className="player-page">
        <div className="loading-message">
          <div className="loading-icon">🔄</div>
          <p>Loading your music library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="player-page">
        <div className="error-message">
          <div className="error-icon">❌</div>
          <p>Error loading music library: {error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-page">
      <AudioPlayer
        currentAudio={currentAudio}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isLooping={isLooping}
        onPlay={handlePlay}
        onPause={onPause}
        onSeek={onSeek}
        onVolumeChange={onVolumeChange}
        onToggleLoop={onToggleLoop}
        onNext={onNext}
        onPrevious={onPrevious}
      />

      <AudioList
        audios={localAudios}
        currentAudio={currentAudio}
        isPlaying={isPlaying}
        onPlay={onPlay}
        onDelete={onDelete}
      />
    </div>
  );
};