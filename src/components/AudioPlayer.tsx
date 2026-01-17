import React from 'react';
import { LocalAudio } from '../types';
import { formatTime } from '../utils';
import './AudioPlayer.css';

interface AudioPlayerProps {
  currentAudio: LocalAudio | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLooping: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleLoop: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
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
}) => {
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    onSeek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value) / 100);
  };

  if (!currentAudio) {
    return (
      <div className="audio-player no-audio">
        <div className="no-audio-message">
          <div className="no-audio-icon">🎵</div>
          <p>No audio selected</p>
        </div>
      </div>
    );
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player">
      <div className="audio-info">
        {currentAudio.audio.cover && (
          <img
            src={currentAudio.audio.cover}
            alt="Album cover"
            className="album-cover"
          />
        )}
        <div className="track-info">
          <h3 className="track-title">{currentAudio.audio.title}</h3>
          <p className="track-artist">{currentAudio.audio.author.join(', ')}</p>
        </div>
      </div>

      <div className="progress-section">
        <div className="time-display">
          <span className="current-time">{formatTime(currentTime)}</span>
          <span className="duration">{formatTime(duration)}</span>
        </div>
        <div className="progress-container">
          <input
            type="range"
            min="0"
            max="100"
            value={progressPercentage}
            onChange={handleSeekChange}
            className="progress-slider"
          />
        </div>
      </div>

      <div className="controls">
        <button onClick={onPrevious} className="control-btn">
          ⏮️
        </button>
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="control-btn play-pause"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button onClick={onNext} className="control-btn">
          ⏭️
        </button>
        <button
          onClick={onToggleLoop}
          className={`control-btn ${isLooping ? 'active' : ''}`}
        >
          🔁
        </button>
      </div>

      <div className="volume-section">
        <span className="volume-icon">🔊</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>
    </div>
  );
};