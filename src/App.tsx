import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [id, setId] = useState("");
  const [audio, setAudio] = useState('')
  const [error, setError] = useState('')

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    try {
      const data: ArrayBuffer = await invoke("get_audio", { id })

      console.log(data)
      const mimeType = "audio/mp4" // 常见: audio/mpeg, audio/wav, audio/ogg
      const blob = new Blob([new Uint8Array(data)], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setAudio(url)
      console.log(url)
    } catch (e) {
      setError(e as string)
    }

  }

  return (
    <main className="container">
      <input
        onChange={(e) => setId(e.currentTarget.value)}
        placeholder="Enter a bvid..."
      />
      <button type="submit"
        onClick={(e) => {
          e.preventDefault();
          greet();
        }}
      >download</button>
      {!!audio.length && <audio src={audio} controls></audio>}
      {!!error.length && <h2>{error}</h2>}
    </main>
  );
}

export default App;
