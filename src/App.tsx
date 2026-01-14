import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
type Audio = {
  title: string,
  data: ArrayBuffer
}
function App() {
  const [url, setUrl] = useState("");
  const [audio, setAudio] = useState('')
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')

  async function greet() {
    try {
      const data: Audio = await invoke("download", { url })
      console.log(data)
      const mimeType = "audio/mp4" // 常见: audio/mpeg, audio/wav, audio/ogg
      const blob = new Blob([new Uint8Array(data.data)], { type: mimeType });
      const link = URL.createObjectURL(blob);
      setAudio(link)
      setTitle(data.title)
      console.log(link)
    } catch (e) {
      setError(e as string)
    }

  }

  return (
    <main className="container">
      <input
        onChange={(e) => setUrl(e.currentTarget.value)}
        placeholder="Enter a url..."
      />
      <button type="submit"
        onClick={(e) => {
          e.preventDefault();
          greet();
        }}
      >download</button>
      {!!audio.length && <audio src={audio} controls></audio>}
      {!!title.length && <h2>{title}</h2>}
      {!!error.length && <h3>{error}</h3>}
    </main>
  );
}

export default App;
