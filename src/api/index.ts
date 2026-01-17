import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";

export type Audio = {
  id: string;
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

export type LocalAudio = {
  audio: Audio;
  path: string;
}

export function extract_audios(url: string): Promise<Audio[]> {
  return invoke("extract_audios", { url })
}

export function download_audio(audio: Audio): Promise<LocalAudio[]> {
  return invoke("download_audio", { audio })
}

export function app_dir(): Promise<string> {
  return invoke("app_dir");
}

export async function get_play_url(audio: LocalAudio): Promise<string> {
  const appDataDirPath: string = await invoke("app_dir");
  const localPath = await join(appDataDirPath, audio.path);
  const assetUrl = convertFileSrc(localPath);
  return assetUrl
}