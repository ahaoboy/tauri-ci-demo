import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import "./App.css";
import { appDataDir, join } from "@tauri-apps/api/path";

type Audio = {
  title: string,
  download_url: string,
  local_url?: string,
  author: string[],
  cover?: string,
  tags: string[],
  duration?: number,
  platform: string,
  date: number,
};

type LocalAudio = {
  id: string,
  audio: Audio
  path: string
}

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audioList, setAudioList] = useState<LocalAudio[]>([]);
  const [currentAudioUrl, setCurrentAudioUrl] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentCover, setCurrentCover] = useState("");

  async function extractAndDownload() {
    if (!url.trim()) {
      setError("请输入有效的URL");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const audios: LocalAudio[] = await invoke("extract_audio", { url });
      setAudioList(audios);

      if (audios.length === 0) {
        setError("未找到音频信息");
        return;
      }

      // 下载第一个音频
      const firstAudio = audios[0];
      const appDataDirPath = await appDataDir();
      const localPath = await join(appDataDirPath, firstAudio.path);

      // 转换本地文件路径为可用的URL
      const assetUrl = convertFileSrc(localPath);
      console.log(assetUrl, localPath)
      setCurrentAudioUrl(assetUrl);
      setCurrentTitle(firstAudio.audio.title);
      setCurrentCover(firstAudio.audio.cover || "");

    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <div className="input-section">
        <h1>音乐播放器</h1>
        <div className="url-input">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.currentTarget.value)}
            placeholder="输入视频链接..."
            className="url-field"
          />
          <button
            onClick={extractAndDownload}
            disabled={loading}
            className="download-btn"
          >
            {loading ? "处理中..." : "提取并播放"}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {audioList.length > 0 && (
        <div className="audio-list">
          <h3>找到的音频 ({audioList.length})</h3>
          {audioList.map(({ audio }, index) => (
            <div key={index} className="audio-item">
              <h4>{audio.title}</h4>
              <p>作者: {audio.author.join(", ")}</p>
              <p>平台: {audio.platform}</p>
              {audio.duration && <p>时长: {audio.duration}秒</p>}
            </div>
          ))}
        </div>
      )}

      {currentAudioUrl && (
        <div className="player-section">
          <h2>正在播放: {currentTitle}</h2>
          {currentCover && (
            <img
              src={currentCover}
              alt="封面"
              className="album-cover"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
          <audio
            src={currentAudioUrl}
            controls
            autoPlay
            className="audio-player"
          >
            您的浏览器不支持音频播放。
          </audio>
        </div>
      )}
    </main>
  );
}

export default App;
