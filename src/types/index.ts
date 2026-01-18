import { LocalAudio, Audio } from '../api';

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

export type { Audio, LocalAudio, Config, Playlist, LocalPlaylist } from '../api';