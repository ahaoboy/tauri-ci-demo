import React, { useState } from 'react';
import { Audio } from '../types';
import { useAppStore, useDownloadState } from '../store';
import { formatDuration, formatDate } from '../utils';
import './DownloadPage.css';

interface DownloadItem extends Audio {
  isDownloading: boolean;
  isDownloaded: boolean;
  downloadError?: string;
}

export const DownloadPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [selectedAudios, setSelectedAudios] = useState<Set<string>>(new Set());

  const { extractedAudios, extractLoading, extractError, downloadQueue } = useDownloadState();
  const { extractAudios, downloadAudio, clearExtractedAudios } = useAppStore();

  // Convert extracted audios to download items with status
  const audios: DownloadItem[] = extractedAudios.map(audio => {
    const downloadStatus = downloadQueue.find(item => item.audioId === audio.id);
    return {
      ...audio,
      isDownloading: downloadStatus?.status === 'downloading',
      isDownloaded: downloadStatus?.status === 'completed',
      downloadError: downloadStatus?.status === 'error' ? 'Download failed' : undefined,
    };
  });

  const handleExtract = async () => {
    if (!url.trim()) {
      return;
    }

    clearExtractedAudios();
    setSelectedAudios(new Set());
    await extractAudios(url);
  };

  const handleDownload = async (audio: DownloadItem) => {
    try {
      await downloadAudio(audio);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleSelectAudio = (audioId: string, selected: boolean) => {
    setSelectedAudios(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(audioId);
      } else {
        newSet.delete(audioId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const availableAudios = audios.filter(audio => !audio.isDownloaded);
    if (selectedAudios.size === availableAudios.length) {
      setSelectedAudios(new Set());
    } else {
      setSelectedAudios(new Set(availableAudios.map(audio => audio.id)));
    }
  };

  const handleDownloadSelected = async () => {
    const selectedAudioItems = audios.filter(audio => selectedAudios.has(audio.id));
    console.log('🔄 Starting batch download for', selectedAudioItems.length, 'items');

    for (const audio of selectedAudioItems) {
      if (!audio.isDownloaded && !audio.isDownloading) {
        await handleDownload(audio);
      }
    }
  };

  const handleResetDownloadStatus = () => {
    console.log('🔄 Resetting download status for all audios');
    clearExtractedAudios();
    setSelectedAudios(new Set());
  };

  const checkDownloadStatus = () => {
    console.log('📊 Current audio states:');
    audios.forEach(audio => {
      console.log(`  ${audio.title}: downloading=${audio.isDownloading}, downloaded=${audio.isDownloaded}, error=${audio.downloadError}`);
    });
  };

  const availableAudios = audios.filter(audio => !audio.isDownloaded);
  const allSelected = availableAudios.length > 0 && selectedAudios.size === availableAudios.length;

  return (
    <div className="download-page">
      <div className="download-header">
        <h1>Download Audio</h1>
        <p>Extract and download audio from various platforms</p>
      </div>

      <div className="url-input-section">
        <div className="input-group">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter video/audio URL..."
            className="url-input"
            onKeyPress={(e) => e.key === 'Enter' && handleExtract()}
          />
          <button
            onClick={handleExtract}
            disabled={extractLoading}
            className="extract-btn"
          >
            {extractLoading ? 'Extracting...' : 'Extract'}
          </button>
        </div>
        {extractError && <div className="error-message">{extractError}</div>}
      </div>

      {audios.length > 0 && (
        <div className="audio-results">
          <div className="results-header">
            <h2>Found Audio ({audios.length})</h2>
            {availableAudios.length > 0 && (
              <div className="batch-actions">
                <label className="select-all">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                  Select All ({availableAudios.length})
                </label>
                <button
                  onClick={handleDownloadSelected}
                  disabled={selectedAudios.size === 0}
                  className="download-selected-btn"
                >
                  Download Selected ({selectedAudios.size})
                </button>
                <button
                  onClick={handleResetDownloadStatus}
                  className="reset-btn"
                  style={{ marginLeft: '8px', padding: '8px 12px', fontSize: '12px' }}
                >
                  Reset Status
                </button>
                <button
                  onClick={checkDownloadStatus}
                  className="debug-btn"
                  style={{ marginLeft: '8px', padding: '8px 12px', fontSize: '12px' }}
                >
                  Check Status
                </button>
              </div>
            )}
          </div>

          <div className="audio-grid">
            {audios.map((audio) => (
              <div key={audio.id} className="audio-card">
                <div className="audio-card-header">
                  {!audio.isDownloaded && (
                    <input
                      type="checkbox"
                      checked={selectedAudios.has(audio.id)}
                      onChange={(e) => handleSelectAudio(audio.id, e.target.checked)}
                      className="audio-checkbox"
                    />
                  )}
                  {audio.isDownloaded && (
                    <div className="downloaded-badge">✅ Downloaded</div>
                  )}
                </div>

                {audio.cover && (
                  <img
                    src={audio.cover}
                    alt="Cover"
                    className="audio-cover"
                  />
                )}

                <div className="audio-info">
                  <h3 className="audio-title">{audio.title}</h3>
                  <p className="audio-artist">{audio.author.join(', ')}</p>

                  <div className="audio-meta">
                    <span className="platform">{audio.platform}</span>
                    <span className="duration">{formatDuration(audio.duration)}</span>
                    <span className="date">{formatDate(audio.date)}</span>
                  </div>

                  {audio.tags.length > 0 && (
                    <div className="audio-tags">
                      {audio.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="tag">#{tag}</span>
                      ))}
                      {audio.tags.length > 2 && (
                        <span className="tag-more">+{audio.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="audio-actions">
                  {audio.isDownloaded ? (
                    <div className="download-status success">
                      Downloaded
                    </div>
                  ) : audio.isDownloading ? (
                    <div className="download-status loading">
                      Downloading...
                    </div>
                  ) : audio.downloadError ? (
                    <div className="download-status error">
                      {audio.downloadError}
                      <button
                        onClick={() => handleDownload(audio)}
                        className="retry-btn"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDownload(audio)}
                      className="download-btn"
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};