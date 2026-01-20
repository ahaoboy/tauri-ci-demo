import { invoke } from "@tauri-apps/api/core";

export interface PlaybackState {
  isPlaying: boolean;
  currentAudio: LocalAudio | null;
  currentTime: number;
  duration: number;
  volume: number;
  isLooping: boolean;
  isShuffling: boolean;
}

export interface DownloadProgress {
  audioId: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
}

export interface AppState {
  // UI State
  activeTab: 'player' | 'download';

  // Audio Library State
  localAudios: LocalAudio[];
  localAudiosLoading: boolean;
  localAudiosError: string;

  // Player State
  playback: PlaybackState;
  playlist: LocalAudio[];
  currentIndex: number;

  // Download State
  downloadQueue: DownloadProgress[];
  extractedAudios: Audio[];
  extractLoading: boolean;
  extractError: string;
}


export type Audio = {
  id: string;
  title: string;
  download_url: string;
  cover?: string;
  platform: string;
};

export type LocalAudio = {
  audio: Audio;
  path: string;
  cover_path: string | null;
}

export type Playlist = {
  title?: string;
  cover?: string;
  audios: Audio[];
  platform: string;
}

export type LocalPlaylist = {
  id: string;
  cover_path: string | null;
  cover?: string;
  audios: LocalAudio[];
  platform: string;
}

export type Config = {
  audios: LocalAudio[];
  playlists: LocalPlaylist[];
}

export type CleanupResult = {
  deleted_files: number;
  freed_bytes: number;
  deleted_audios: string[];
}

export function extract_audios(url: string): Promise<Playlist> {
  return invoke("extract_audios", { url })
}

export async function download_audio(audio: Audio): Promise<LocalAudio[]> {
  const result = await invoke("download_audio", { audio });

  // Handle both single object and array responses
  if (Array.isArray(result)) {
    return result;
  } else if (result && typeof result === 'object') {
    // Backend returned a single LocalAudio object
    return [result as LocalAudio];
  } else {
    return [];
  }
}

export function app_dir(): Promise<string> {
  return invoke("app_dir");
}

export function read_file(path: string): Promise<Uint8Array> {
  return invoke("read_file", { path });
}

export function download_cover(url: string, platform: string): Promise<string | null> {
  return invoke("download_cover", { url, platform });
}

// export async function get_loacl_url(path: string): Promise<string> {
//   const appDataDirPath: string = await invoke("app_dir");
//   const localPath = await join(appDataDirPath, path);
//   const assetUrl = convertFileSrc(localPath);
//   return assetUrl
// }

export async function get_loacl_url(path: string): Promise<string> {
  const bin = await read_file(path);
  const blob = new Blob([new Uint8Array(bin)]);
  const assetUrl = URL.createObjectURL(blob)
  return assetUrl
}

export function get_config(): Promise<Config> {
  return invoke("get_config").then((result: any) => {
    console.log('📦 Raw config result:', result);

    // Handle Rust Result type (Ok/Err)
    let config: any;
    if (result && typeof result === 'object') {
      if ('Ok' in result) {
        config = result.Ok;
        console.log('✅ Config loaded successfully:', config);
      } else if ('Err' in result) {
        console.error('❌ Config error:', result.Err);
        return { audios: [], playlists: [], settings: { auto_download_cover: true, default_audio_format: 'mp3' } };
      } else {
        // Direct config object
        config = result;
      }
    } else {
      console.warn('⚠️ Invalid config result, using default');
      return { audios: [], playlists: [], settings: { auto_download_cover: true, default_audio_format: 'mp3' } };
    }

    // Ensure config has required fields
    if (!config || typeof config !== 'object') {
      console.warn('⚠️ Invalid config object, using default');
      return { audios: [], playlists: [], settings: { auto_download_cover: true, default_audio_format: 'mp3' } };
    }
    if (!Array.isArray(config.audios)) {
      console.warn('⚠️ Config missing audios array, initializing');
      return { ...config, audios: [], playlists: config.playlists || [], settings: config.settings || { auto_download_cover: true, default_audio_format: 'mp3' } };
    }
    if (!Array.isArray(config.playlists)) {
      console.warn('⚠️ Config missing playlists array, initializing');
      config.playlists = [];
    }
    if (!config.settings) {
      console.warn('⚠️ Config missing settings, initializing');
      config.settings = { auto_download_cover: true, default_audio_format: 'mp3' };
    }

    return config as Config;
  }).catch(error => {
    console.error('❌ Failed to get config:', error);
    return { audios: [], playlists: [], settings: { auto_download_cover: true, default_audio_format: 'mp3' } };
  });
}

export function save_config(config: Config): Promise<Config> {
  return invoke("save_config", { config }).then((result: any) => {
    console.log('📦 Raw save config result:', result);

    // Handle Rust Result type (Ok/Err)
    if (result && typeof result === 'object') {
      if ('Ok' in result) {
        console.log('✅ Config saved successfully');
        return config;
      } else if ('Err' in result) {
        console.error('❌ Save config error:', result.Err);
        throw new Error(result.Err);
      }
    }

    return config;
  }).catch(error => {
    console.error('❌ Failed to save config:', error);
    throw error;
  });
}


// Get all downloaded local audios
export async function get_local_audios(): Promise<LocalAudio[]> {
  try {
    console.log('📂 Loading local audios from config...');
    const config = await get_config();
    console.log('📂 Config loaded:', config);
    console.log('📂 Found', config.audios?.length || 0, 'local audios');
    return config.audios || [];
  } catch (error) {
    console.error('❌ Failed to load local audios:', error);
    return [];
  }
}

export async function get_audio_suggestions(keyword: string, limit?: number): Promise<string[]> {
  return invoke("get_audio_suggestions", { keyword, limit });
}

export async function update_play_count(audioId: string): Promise<void> {
  return invoke("update_play_count", { audioId });
}

export async function create_playlist(name: string, platform: string): Promise<LocalPlaylist> {
  const playlist = await invoke<LocalPlaylist>("create_playlist", { name, platform });

  const config = await get_config();
  config.playlists.push(playlist);
  await save_config(config);

  return playlist;
}

export async function delete_playlist(playlistId: string): Promise<boolean> {
  const success = await invoke<boolean>("delete_playlist", { playlistId });

  if (success) {
    const config = await get_config();
    config.playlists = config.playlists.filter(p => p.id !== playlistId);
    await save_config(config);
  }

  return success;
}

export async function add_audio_to_playlist(playlistId: string, audioId: string): Promise<void> {
  await invoke("add_audio_to_playlist", { playlistId, audioId });

  const config = await get_config();
  const playlist = config.playlists.find(p => p.id === playlistId);
  const audio = config.audios.find(a => a.audio.id === audioId);

  if (playlist && audio && !playlist.audios.some(a => a.audio.id === audioId)) {
    playlist.audios.push(audio);
    await save_config(config);
  }
}

export async function remove_audio_from_playlist(playlistId: string, audioId: string): Promise<boolean> {
  const success = await invoke<boolean>("remove_audio_from_playlist", { playlistId, audioId });

  if (success) {
    const config = await get_config();
    const playlist = config.playlists.find(p => p.id === playlistId);
    if (playlist) {
      playlist.audios = playlist.audios.filter(a => a.audio.id !== audioId);
      await save_config(config);
    }
  }

  return success;
}

export async function reorder_playlist(playlistId: string, audioId: string, newPosition: number): Promise<void> {
  await invoke("reorder_playlist", { playlistId, audioId, new_position: newPosition });

  const config = await get_config();
  const playlist = config.playlists.find(p => p.id === playlistId);
  if (playlist) {
    const currentIndex = playlist.audios.findIndex(a => a.audio.id === audioId);
    if (currentIndex !== -1) {
      const [audio] = playlist.audios.splice(currentIndex, 1);
      const actualPosition = Math.min(newPosition, playlist.audios.length);
      playlist.audios.splice(actualPosition, 0, audio);
      await save_config(config);
    }
  }
}

export async function duplicate_playlist(playlistId: string): Promise<LocalPlaylist> {
  const newPlaylist = await invoke<LocalPlaylist>("duplicate_playlist", { playlistId });

  const config = await get_config();
  config.playlists.push(newPlaylist);
  await save_config(config);

  return newPlaylist;
}

export async function merge_playlists(targetId: string, sourceId: string): Promise<void> {
  await invoke("merge_playlists", { target_id: targetId, source_id: sourceId });

  const config = await get_config();
  const target = config.playlists.find(p => p.id === targetId);
  const source = config.playlists.find(p => p.id === sourceId);

  if (target && source) {
    for (const audio of source.audios) {
      if (!target.audios.some(a => a.audio.id === audio.audio.id)) {
        target.audios.push(audio);
      }
    }
    await save_config(config);
  }
}

export async function shuffle_playlist(playlistId: string): Promise<void> {
  await invoke("shuffle_playlist", { playlistId });

  const config = await get_config();
  const playlist = config.playlists.find(p => p.id === playlistId);
  if (playlist) {
    const shuffled = [...playlist.audios];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    playlist.audios = shuffled;
    await save_config(config);
  }
}

export async function cleanup_cache(maxSizeMb: number): Promise<CleanupResult> {
  return invoke("cleanup_cache", { max_size_mb: maxSizeMb });
}

export async function import_local_audios(filePaths: string[]): Promise<number> {
  const importedCount = await invoke<number>("import_local_audios", { file_paths: filePaths });

  if (importedCount > 0) {
    console.log(`✅ Imported ${importedCount} local audio files`);
  }

  return importedCount;
}