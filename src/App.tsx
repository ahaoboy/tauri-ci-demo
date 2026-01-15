import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import "./App.css";
import { join } from "@tauri-apps/api/path";

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
  const [dir, setDir] = useState('')
  const [ass, setAss] = useState('')
  const [meta, setMeta] = useState('')
  const [audioType, setAudioType] = useState("audio/mp4")
  const [currentAudioPath, setCurrentAudioPath] = useState("")
  const [b1, setB1] = useState(0)
  const [b2, setB2] = useState(0)
  const [dataSource, setDataSource] = useState("read_file")
  const [videoMeta, setVideoMeta] = useState("")
  const [v1, setV1] = useState(0)
  useEffect(() => {
    invoke("app_dir").then(s => {
      console.log("app_dir", s)
      setDir(s as string)
    })
  }, [])

  async function generateAudioLink(audioPath: string) {
    try {
      let bin: Uint8Array;
      
      if (dataSource === "read_file") {
        bin = await invoke("read_file", { path: audioPath });
        setB2(bin.length);
      } else {
        bin = await invoke("extract_file_bin", { url, path: audioPath });
        setB2(bin.length);
      }
      
      // 生成 Blob URL
      const blob = new Blob([new Uint8Array(bin)], {
        type: audioType,
      });
      const link = URL.createObjectURL(blob);
      setMeta(link);
      
      // 为 video 生成对应的 URL
      const videoMimeType = audioType === "audio/mp4" ? "video/mp4" : `video/${audioType.split('/')[1]}`;
      const videoBlob = new Blob([new Uint8Array(bin)], {
        type: videoMimeType,
      });
      const videoLink = URL.createObjectURL(videoBlob);
      setVideoMeta(videoLink);
      setV1(bin.length);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleDataSourceChange(source: "read_file" | "extract_audio") {
    setDataSource(source);
    if (currentAudioPath) {
      generateAudioLink(currentAudioPath);
    }
  }

  async function handleDownload() {
    if (!currentAudioPath) {
      setError("没有可下载的音频文件");
      return;
    }

    try {
      // 从 read_file 获取二进制数据
      const bin: Uint8Array = await invoke("read_file", { path: currentAudioPath });
      
      // 根据音频格式确定文件扩展名
      let extension = 'm4a';
      if (audioType === 'audio/mpeg') extension = 'mp3';
      else if (audioType === 'audio/wav') extension = 'wav';
      else if (audioType === 'audio/ogg') extension = 'ogg';
      else if (audioType === 'audio/webm') extension = 'webm';
      
      // 创建 Blob
      const blob = new Blob([new Uint8Array(bin)], {
        type: audioType,
      });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTitle || 'audio'}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`下载完成: ${bin.length} bytes`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    if (currentAudioPath) {
      generateAudioLink(currentAudioPath);
    }
  }, [audioType, dataSource, currentAudioPath]);

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
      const appDataDirPath: string = await invoke("app_dir");
      const localPath = await join(appDataDirPath, firstAudio.path);
      setDir(appDataDirPath)
      // 转换本地文件路径为可用的URL

      const assetUrl = convertFileSrc(localPath);

      const resp = await fetch(assetUrl);

      if (!resp.ok) {
        throw new Error(`fetch failed: ${resp.status} ${resp.statusText}`);
      }

      const buf = await resp.arrayBuffer();
      setB1(new Uint8Array(buf).length);
      setCurrentAudioUrl(assetUrl);
      setCurrentTitle(firstAudio.audio.title);
      setCurrentCover(firstAudio.audio.cover || "");
      setAss(assetUrl)
      setCurrentAudioPath(firstAudio.path);

      await generateAudioLink(firstAudio.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <audio src='/a.m4a' controls></audio>

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
          <select
            value={audioType}
            onChange={(e) => setAudioType(e.target.value)}
            className="audio-type-select"
          >
            <option value="audio/mp4">MP4</option>
            <option value="audio/mpeg">MP3</option>
            <option value="audio/wav">WAV</option>
            <option value="audio/ogg">OGG</option>
            <option value="audio/webm">WebM</option>
            <option value='audio/mp4; codecs="mp4a.40.5"'>mp4a</option>
          </select>
          <button
            onClick={extractAndDownload}
            disabled={loading}
            className="download-btn"
          >
            {loading ? "处理中..." : "提取并播放"}
          </button>
        </div>
        
        {currentAudioPath && (
          <div className="data-source-buttons">
            <h3>数据源选择</h3>
            <div className="button-group">
              <button
                onClick={() => handleDataSourceChange("read_file")}
                className={`data-btn ${dataSource === "read_file" ? "active" : ""}`}
              >
                使用 read_file
              </button>
              <button
                onClick={() => handleDataSourceChange("extract_audio")}
                className={`data-btn ${dataSource === "extract_audio" ? "active" : ""}`}
              >
                使用 extract_audio
              </button>
            </div>
            <p>当前使用: {dataSource === "read_file" ? "read_file" : "extract_audio"}</p>
            
            <div className="download-section">
              <h3>下载音频文件</h3>
              <button
                onClick={handleDownload}
                className="download-file-btn"
              >
                下载音频文件 ({audioType})
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      <p>dir: {dir}</p>
      {audioList.length > 0 && (
        <div className="audio-list">
          <h3>找到的音频 ({audioList.length})</h3>
          {audioList.map(({ audio, path }, index) => (
            <div key={index} className="audio-item">
              <h4>{audio.title}</h4>
              <p>作者: {audio.author.join(", ")}</p>
              <p>平台: {audio.platform}</p>
              <p>path: {path}</p>
              <p>ass: {ass}</p>
              <p>meta: {meta}</p>
              <p>b1: {b1}</p>
              <p>b2: {b2}</p>
              <p>v1: {v1}</p>
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
          {currentAudioUrl && (
            <div>
              <h4>convertFileSrc 方式</h4>
              <audio
                src={currentAudioUrl}
                controls
                // autoPlay
                className="audio-player"
              >
                您的浏览器不支持音频播放。
              </audio>
            </div>
          )}

          {meta && (
            <div>
              <h4>Blob URL 方式 ({dataSource})</h4>
              <audio
                src={meta}
                controls
                // autoPlay
                className="audio-player"
              >
                您的浏览器不支持音频播放。
              </audio>
            </div>
          )}



        </div>
      )}

      {currentAudioUrl && (
        <div className="video-section">
          <h2>Video 播放测试 (音频数据作为视频源)</h2>
          
          {currentAudioUrl && (
            <div>
              <h4>Video - convertFileSrc 方式</h4>
              <video
                src={currentAudioUrl}
                controls
                className="video-player"
                width="400"
                height="200"
              >
                您的浏览器不支持视频播放。
              </video>
            </div>
          )}

          {videoMeta && (
            <div>
              <h4>Video - Blob URL 方式 ({dataSource})</h4>
              <video
                src={videoMeta}
                controls
                className="video-player"
                width="400"
                height="200"
              >
                您的浏览器不支持视频播放。
              </video>
            </div>
          )}


        </div>
      )}
    </main>
  );
}

export default App;
