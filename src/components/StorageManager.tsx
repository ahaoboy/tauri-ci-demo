import React, { useState } from 'react';
import { StorageUsage, CleanupResult, cleanup_cache, get_storage_usage } from '../api';
import './StorageManager.css';

export const StorageManager: React.FC = () => {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [cleaning, setCleaning] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const loadUsage = async () => {
    try {
      const data = await get_storage_usage();
      setUsage(data);
    } catch (error) {
      console.error('Failed to load storage usage:', error);
    }
  };

  const handleCleanup = async () => {
    if (!usage) return;
    
    const maxSize = Math.max(usage.total_bytes * 0.8 / 1024 / 1024, 100); // 清理到 80% 或至少 100MB
    
    if (!confirm(`确定要清理缓存吗？将删除最旧的文件以释放空间。`)) {
      return;
    }

    setCleaning(true);
    setCleanupResult(null);
    
    try {
      const result = await cleanup_cache(Math.round(maxSize));
      setCleanupResult(result);
      await loadUsage();
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
      alert('清理缓存失败');
    } finally {
      setCleaning(false);
    }
  };

  useState(() => {
    loadUsage();
  });

  return (
    <div className="storage-manager">
      <div className="storage-header">
        <h2>存储管理</h2>
      </div>

      {usage && (
        <div className="storage-info">
          <div className="storage-overview">
            <div className="storage-item">
              <div className="storage-label">总存储</div>
              <div className="storage-value">{formatBytes(usage.total_bytes)}</div>
            </div>
            <div className="storage-item">
              <div className="storage-label">音频文件</div>
              <div className="storage-value">{formatBytes(usage.audio_bytes)}</div>
              <div className="storage-detail">{usage.audio_count} 个文件</div>
            </div>
            <div className="storage-item">
              <div className="storage-label">封面图片</div>
              <div className="storage-value">{formatBytes(usage.cover_bytes)}</div>
            </div>
          </div>

          <div className="storage-actions">
            <button
              onClick={handleCleanup}
              className="cleanup-btn"
              disabled={cleaning || usage.total_bytes === 0}
            >
              {cleaning ? '清理中...' : '🧹 清理缓存'}
            </button>
            <button onClick={loadUsage} className="refresh-btn">
              🔄 刷新
            </button>
          </div>
        </div>
      )}

      {cleanupResult && (
        <div className="cleanup-result">
          <div className="result-header">
            <h3>清理结果</h3>
          </div>
          <div className="result-details">
            <div className="result-item">
              <span className="result-label">删除文件:</span>
              <span className="result-value">{cleanupResult.deleted_files} 个</span>
            </div>
            <div className="result-item">
              <span className="result-label">释放空间:</span>
              <span className="result-value">{formatBytes(cleanupResult.freed_bytes)}</span>
            </div>
            {cleanupResult.deleted_audios.length > 0 && (
              <div className="result-item">
                <span className="result-label">删除音频:</span>
                <span className="result-value">{cleanupResult.deleted_audios.length} 首</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCleanupResult(null)}
            className="close-result-btn"
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
};
