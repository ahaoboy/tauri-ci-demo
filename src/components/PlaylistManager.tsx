import React, { useState, useEffect } from 'react';
import { LocalPlaylist } from '../types';
import { 
  delete_playlist, 
  shuffle_playlist, 
  duplicate_playlist 
} from '../api';
import './PlaylistManager.css';

interface PlaylistManagerProps {
  playlists: LocalPlaylist[];
  onPlaylistSelect: (playlist: LocalPlaylist) => void;
  onPlaylistCreate: () => void;
  selectedPlaylistId: string | null;
  onUpdate: () => void;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  onPlaylistSelect,
  onPlaylistCreate,
  selectedPlaylistId,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个播放列表吗？')) return;

    setLoading(true);
    try {
      await delete_playlist(playlistId);
      console.log('✅ Playlist deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('❌ Failed to delete playlist:', error);
      alert('删除播放列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleShuffle = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await shuffle_playlist(playlistId);
      console.log('✅ Playlist shuffled successfully');
      onUpdate();
    } catch (error) {
      console.error('❌ Failed to shuffle playlist:', error);
      alert('随机播放失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await duplicate_playlist(playlistId);
      console.log('✅ Playlist duplicated successfully');
      onUpdate();
    } catch (error) {
      console.error('❌ Failed to duplicate playlist:', error);
      alert('复制播放列表失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="playlist-manager">
      <div className="playlist-header">
        <h2>我的播放列表 ({playlists.length})</h2>
        <button onClick={onPlaylistCreate} className="create-btn" disabled={loading}>
          ➕ 新建播放列表
        </button>
      </div>

      <div className="playlist-grid">
        {playlists.map(playlist => (
          <div
            key={playlist.id}
            className={`playlist-card ${selectedPlaylistId === playlist.id ? 'selected' : ''}`}
            onClick={() => onPlaylistSelect(playlist)}
          >
            <div className="playlist-cover">
              {playlist.cover_path ? (
                <img src={playlist.cover_path} alt={playlist.name} />
              ) : playlist.cover ? (
                <img src={playlist.cover} alt={playlist.name} style={{ opacity: 0.6 }} />
              ) : (
                <div className="playlist-cover-placeholder">
                  <div className="playlist-icon">📋</div>
                </div>
              )}
            </div>

            <div className="playlist-info">
              <h3 className="playlist-name">{playlist.name}</h3>
              <p className="playlist-meta">
                {playlist.audios.length} 首歌曲
              </p>
              {playlist.description && (
                <p className="playlist-description">{playlist.description}</p>
              )}
            </div>

            <div className="playlist-actions">
              <button
                onClick={(e) => handleShuffle(playlist.id, e)}
                className="action-btn"
                title="随机播放"
                disabled={loading}
              >
                🔀
              </button>
              <button
                onClick={(e) => handleDuplicate(playlist.id, e)}
                className="action-btn"
                title="复制"
                disabled={loading}
              >
                📋
              </button>
              <button
                onClick={(e) => handleDelete(playlist.id, e)}
                className="action-btn delete"
                title="删除"
                disabled={loading}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {playlists.length === 0 && (
        <div className="empty-playlists">
          <div className="empty-icon">📋</div>
          <p>还没有播放列表</p>
          <p className="empty-subtitle">点击上方按钮创建新的播放列表</p>
        </div>
      )}
    </div>
  );
};
