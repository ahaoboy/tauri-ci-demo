import React, { useState } from 'react';
import { PlaylistManager } from '../components/PlaylistManager';
import { SearchBar } from '../components/SearchBar';
import { ImportDialog } from '../components/ImportDialog';
import { StorageManager } from '../components/StorageManager';
import { AudioList } from '../components/AudioList';
import { LocalAudio, LocalPlaylist } from '../types';
import { search_audios, get_local_audios, create_playlist, get_config, SearchQuery, delete_local_audio } from '../api';
import './LibraryPage.css';

type TabType = 'playlists' | 'library' | 'settings';

export const LibraryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('playlists');
  const [selectedPlaylist, setSelectedPlaylist] = useState<LocalPlaylist | null>(null);
  const [audios, setAudios] = useState<LocalAudio[]>([]);
  const [playlists, setPlaylists] = useState<LocalPlaylist[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const data = await get_local_audios();
      setAudios(data);
      console.log('✅ Loaded library:', data.length, 'audios');
    } catch (error) {
      console.error('❌ Failed to load library:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const config = await get_config();
      setPlaylists(config.playlists);
      console.log('✅ Loaded playlists:', config.playlists.length);
    } catch (error) {
      console.error('❌ Failed to load playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: SearchQuery) => {
    setLoading(true);
    try {
      const results = await search_audios(query);
      setAudios(results);
      console.log('✅ Search results:', results.length, 'audios');
    } catch (error) {
      console.error('❌ Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    const name = prompt('请输入播放列表名称:');
    if (name) {
      try {
        const newPlaylist = await create_playlist(name, 'custom');
        setPlaylists([...playlists, newPlaylist]);
        console.log('✅ Created playlist:', newPlaylist.name);
      } catch (error) {
        console.error('❌ Failed to create playlist:', error);
        alert('创建播放列表失败');
      }
    }
  };

  const handlePlaylistSelect = (playlist: LocalPlaylist) => {
    setSelectedPlaylist(playlist);
    setAudios(playlist.audios);
    setActiveTab('library');
  };

  const handleImportComplete = () => {
    loadLibrary();
    loadPlaylists();
  };

  const handleAudioPlay = (audio: LocalAudio, _playlist: LocalAudio[]) => {
    console.log('Playing audio:', audio.audio.title);
  };

  const handleAudioDelete = async (audioId: string) => {
    if (confirm('确定要删除这个音频吗？')) {
      try {
        const success = await delete_local_audio(audioId);
        if (success) {
          loadLibrary();
          if (selectedPlaylist) {
            const updated = { ...selectedPlaylist, audios: selectedPlaylist.audios.filter(a => a.audio.id !== audioId) };
            setSelectedPlaylist(updated);
          }
        }
      } catch (error) {
        console.error('❌ Failed to delete audio:', error);
        alert('删除音频失败');
      }
    }
  };

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>音乐库</h1>
        <button 
          onClick={() => setShowImport(true)} 
          className="import-btn"
        >
          📂 导入本地音乐
        </button>
      </div>

      <div className="library-tabs">
        <button
          className={`tab ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          📋 播放列表
        </button>
        <button
          className={`tab ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('library');
            loadLibrary();
          }}
        >
          🎵 全部音乐
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ 存储管理
        </button>
      </div>

      <div className="library-content">
        {activeTab === 'playlists' && (
          <PlaylistManager
            playlists={playlists}
            onPlaylistSelect={handlePlaylistSelect}
            onPlaylistCreate={handleCreatePlaylist}
            selectedPlaylistId={selectedPlaylist?.id || null}
            onUpdate={loadPlaylists}
          />
        )}

        {activeTab === 'library' && (
          <div className="library-audios">
            <div className="library-actions">
              <div className="selected-info">
                {selectedPlaylist && (
                  <span>📋 {selectedPlaylist.name} ({selectedPlaylist.audios.length})</span>
                )}
              </div>
              {selectedPlaylist && (
                <button 
                  onClick={() => {
                    setSelectedPlaylist(null);
                    loadLibrary();
                  }}
                  className="back-btn"
                >
                  ← 返回全部音乐
                </button>
              )}
            </div>
            
            <SearchBar 
              onSearch={handleSearch}
              placeholder={selectedPlaylist ? `在 ${selectedPlaylist.name} 中搜索...` : '搜索音乐、艺术家、标签...'}
            />

            <AudioList
              audios={audios}
              currentAudio={null}
              isPlaying={false}
              onPlay={handleAudioPlay}
              onDelete={handleAudioDelete}
            />

            {loading && (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>加载中...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <StorageManager />
        )}
      </div>

      {showImport && (
        <ImportDialog
          onClose={() => setShowImport(false)}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
};
