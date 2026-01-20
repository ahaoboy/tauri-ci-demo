import { FC, useState } from 'react';
import { LeftOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import { LocalPlaylist, LocalAudio } from '../../api';
import { PlaylistCard, AudioCard } from '../../components';

// Playlists page - shows all downloaded playlists
// Clicking a playlist shows its detail with playable audios
export const PlaylistsPage: FC = () => {
  const { playlists, playAudio } = useAppStore();
  const [selectedPlaylist, setSelectedPlaylist] = useState<LocalPlaylist | null>(null);

  // Handle playlist click - show detail view
  const handlePlaylistClick = (playlist: LocalPlaylist) => {
    setSelectedPlaylist(playlist);
  };

  // Handle back button - return to playlist list
  const handleBack = () => {
    setSelectedPlaylist(null);
  };

  // Handle audio click - play the audio
  const handleAudioClick = (audio: LocalAudio) => {
    playAudio(audio);
  };

  // Render playlist detail view
  if (selectedPlaylist) {
    return (
      <div className="page">
        <div className="detail-header">
          <button className="back-btn" onClick={handleBack}>
            <LeftOutlined />
          </button>
          <span className="detail-title">{selectedPlaylist.id}</span>
        </div>

        {selectedPlaylist.audios.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎵</div>
            <div className="empty-title">No Audio</div>
            <div className="empty-description">
              This playlist has no audio tracks yet.
            </div>
          </div>
        ) : (
          <div className="audio-list">
            <div className="list-header">
              <span className="list-title">
                {selectedPlaylist.audios.length} Tracks
              </span>
            </div>
            {selectedPlaylist.audios.map((audio) => (
              <AudioCard
                key={audio.audio.id}
                audio={audio}
                onClick={() => handleAudioClick(audio)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render playlists grid
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Playlists</h1>
        <p className="page-subtitle">Your downloaded playlists</p>
      </div>

      {playlists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <div className="empty-title">No Playlists</div>
          <div className="empty-description">
            Download playlists from the Search tab to see them here.
          </div>
        </div>
      ) : (
        <div className="playlist-grid">
          {playlists.map((playlist, index) => (
            <PlaylistCard
              key={`${playlist.id}-${index}`}
              playlist={playlist}
              onClick={() => handlePlaylistClick(playlist)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
