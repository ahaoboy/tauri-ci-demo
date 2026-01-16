import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import "./App.css";
import { join } from "@tauri-apps/api/path";
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

type Audio = {
  title: string;
  download_url: string;
  local_url?: string;
  author: string[];
  cover?: string;
  tags: string[];
  duration?: number;
  platform: string;
  date: number;
};

type LocalAudio = {
  id: string;
  audio: Audio;
  path: string;
}

const TEST_AUDIO = '/a.wav';

function getBlob(bin: Uint8Array, audioType: string) {
  const blob = new Blob([new Uint8Array(bin)], {
    type: audioType,
  });
  const link = URL.createObjectURL(blob);
  return link
}

function bufferToBase64(buffer: Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([new Uint8Array(buffer)]);
    const reader = new FileReader();
    reader.onload = () => {
      // 结果格式为 "data:application/octet-stream;base64,xxxx"
      // @ts-ignore
      const base64 = reader.result!.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function App() {
  const [url, setUrl] = useState("");
  const [test, setTest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audioList, setAudioList] = useState<LocalAudio[]>([]);
  const [currentTitle, setCurrentTitle] = useState("");
  const [dir, setDir] = useState('');
  const [audioType, setAudioType] = useState("audio/mp4");
  const [currentAudioPath, setCurrentAudioPath] = useState("");
  const [bin1, setBin1] = useState(new Uint8Array());
  const [bin2, setBin2] = useState(new Uint8Array());
  const [a1, setA1] = useState('')
  const [a2, setA2] = useState('')
  useEffect(() => {
    invoke("app_dir").then(s => {
      console.log("app_dir", s);
      setDir(s as string);
    });
    (async () => {
      try {
        const resp = await fetch(TEST_AUDIO)
        const v = await resp.arrayBuffer()
        const blob = new Blob([new Uint8Array(v)], { type: "audio/wav" });
        const link = URL.createObjectURL(blob);
        setTest(link);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    })()
  }, []);

  async function copyBase64(bin: Uint8Array) {
    if (!currentAudioPath) {
      setError("没有可复制的数据");
      return;
    }

    try {
      const base64 = await bufferToBase64(bin);
      await writeText(base64);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
      a.target = "_blank"
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

      const firstAudio = audios[0];
      const appDataDirPath: string = await invoke("app_dir");
      const localPath = await join(appDataDirPath, firstAudio.path);
      setDir(appDataDirPath);

      try {
        const assetUrl = convertFileSrc(localPath);
        console.log("Generated asset URL:", assetUrl);
        console.log("Local path:", localPath);
        const resp = await fetch(assetUrl, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
          }
        });
        console.log("Fetch response:", resp.status, resp.statusText);
        if (!resp.ok) {
          throw new Error(`fetch failed: ${resp.status} ${resp.statusText}`);
        }
        const buf = await resp.arrayBuffer();
        setBin1(new Uint8Array(buf));
        setA1(assetUrl);
        setCurrentTitle(firstAudio.audio.title);
        setCurrentAudioPath(firstAudio.path);
      }
      catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }

      const bin: Uint8Array = await invoke("read_file", { path: firstAudio.path });
      setBin2(new Uint8Array(bin));
      setCurrentAudioPath(firstAudio.path);
      setCurrentTitle(firstAudio.audio.title);
      setA2(getBlob(bin, audioType));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <audio src={TEST_AUDIO} controls></audio>
      {test && <audio src={test} controls></audio>}
      <div className="input-section">
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
            <div className="download-section">
              <h3>下载音频文件</h3>
              <button
                onClick={handleDownload}
                className="download-file-btn"
              >
                下载音频文件 ({audioType})
              </button>

            </div>

            <div className="download-section">
              <h3>复制 Base64 数据</h3>
              <button
                onClick={() => copyBase64(bin1)}
                className="download-file-btn"
              >
                复制 read_file 的 base64
              </button>
              <button
                onClick={() => copyBase64(bin2)}
                className="download-file-btn"
              >
                复制 extract_audio 的 base64
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
              <p>平台: {audio.platform}</p>
              <p>path: {path}</p>
              <p>bin1: {bin1.length}</p>
              <p>bin2: {bin2.length}</p>
              <p>a1: {a1}</p>
              <p>a2: {a2}</p>
            </div>
          ))}
        </div>
      )}
      <div className="player-section">
        {a1 && (
          <div>
            <audio
              src={a1}
              controls
              className="audio-player"
            >
            </audio>
          </div>
        )}

        {a2 && (
          <div>
            <audio
              src={a2}
              controls
              className="audio-player"
            >
            </audio>
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
