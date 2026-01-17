import { useAppStore } from './index';

// UI Selectors
export const useActiveTab = () => useAppStore((state) => state.activeTab);

// Audio Library Selectors
export const useLocalAudios = () => useAppStore((state) => ({
  audios: state.localAudios,
  loading: state.localAudiosLoading,
  error: state.localAudiosError,
}));

export const useLocalAudiosCount = () => useAppStore((state) => state.localAudios.length);

// Player Selectors
export const usePlayback = () => useAppStore((state) => state.playback);
export const useCurrentAudio = () => useAppStore((state) => state.playback.currentAudio);
export const useIsPlaying = () => useAppStore((state) => state.playback.isPlaying);

export const usePlaylist = () => useAppStore((state) => ({
  playlist: state.playlist,
  currentIndex: state.currentIndex,
}));

// Download Selectors
export const useDownloadState = () => useAppStore((state) => ({
  extractedAudios: state.extractedAudios,
  extractLoading: state.extractLoading,
  extractError: state.extractError,
  downloadQueue: state.downloadQueue,
}));

export const useExtractedAudios = () => useAppStore((state) => state.extractedAudios);
export const useDownloadQueue = () => useAppStore((state) => state.downloadQueue);

// Combined Selectors
export const usePlayerData = () => useAppStore((state) => ({
  localAudios: state.localAudios,
  loading: state.localAudiosLoading,
  error: state.localAudiosError,
  playback: state.playback,
  playlist: state.playlist,
  currentIndex: state.currentIndex,
}));