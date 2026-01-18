import React, { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { import_local_audios } from '../api';
import './ImportDialog.css';

interface ImportDialogProps {
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  onClose,
  onImportComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [imported, setImported] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSelectFiles = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: 'Audio Files',
            extensions: ['mp3', 'm4a', 'flac', 'wav', 'ogg', 'aac', 'wma']
          }
        ]
      });

      if (selected && selected.length > 0) {
        await importFiles(selected);
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      setError('无法打开文件选择对话框');
    }
  };

  const importFiles = async (filePaths: string[]) => {
    setLoading(true);
    setError(null);
    setTotal(filePaths.length);
    setImported(0);
    setProgress(0);

    try {
      const count = await import_local_audios(filePaths);
      setImported(count);
      setProgress(100);
      
      console.log(`✅ Imported ${count} audio files`);
      
      setTimeout(() => {
        onImportComplete();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('❌ Failed to import files:', error);
      setError('导入文件失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-dialog-overlay">
      <div className="import-dialog">
        <div className="import-dialog-header">
          <h2>导入本地音乐</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="import-dialog-body">
          {!loading && (
            <div className="import-instructions">
              <div className="import-icon">📂</div>
              <p>选择要导入的音频文件</p>
              <p className="import-subtitle">支持格式: MP3, M4A, FLAC, WAV, OGG, AAC, WMA</p>
              <button onClick={handleSelectFiles} className="select-files-btn">
                选择文件
              </button>
            </div>
          )}

          {loading && (
            <div className="import-progress">
              <div className="progress-circle">
                <div className="progress-spinner"></div>
                <div className="progress-text">{Math.round(progress)}%</div>
              </div>
              <p>正在导入文件...</p>
              <p className="progress-details">
                {imported} / {total} 个文件
              </p>
            </div>
          )}

          {error && (
            <div className="import-error">
              <div className="error-icon">❌</div>
              <p>{error}</p>
              <button onClick={onClose} className="retry-btn">
                关闭
              </button>
            </div>
          )}

          {progress === 100 && !error && (
            <div className="import-success">
              <div className="success-icon">✅</div>
              <p>导入完成！</p>
              <p className="success-details">
                成功导入 {imported} 个文件
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
