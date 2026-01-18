import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { Audio, LocalAudio, AppState, Playlist } from '../types';
import {
  get_local_audios,
  extract_audios,
  download_audio_and_update_config,
  delete_local_audio,
  get_loacl_url
} from '../api';

interface AppStore extends AppState {
  // UI Actions
  setActiveTab: (tab: 'player' | 'download') => void;

  // Audio Library Actions
  loadLocalAudios: () => Promise<void>;
  addLocalAudio: (audio: LocalAudio) => Promise<void>;
  removeLocalAudio: (audioId: string) => Promise<boolean>;

  // Player Actions
  playAudio: (audio: LocalAudio, playlist?: LocalAudio[]) => Promise<void>;
  pauseAudio: () => void;
  stopAudio: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleLoop: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  updatePlaybackTime: (currentTime: number, duration: number) => void;

  // Download Actions
  extractAudios: (url: string) => Promise<void>;
  downloadAudio: (audio: Audio) => Promise<void>;
  clearExtractedAudios: () => void;
  updateDownloadProgress: (audioId: string, status: 'pending' | 'downloading' | 'completed' | 'error', progress?: number) => void;
}

export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial State
      activeTab: 'player',

      // Audio Library State
      localAudios: [],
      localAudiosLoading: false,
      localAudiosError: '',

      // Player State
      playback: {
        isPlaying: false,
        currentAudio: null,
        currentTime: 0,
        duration: 0,
        volume: 1,
        isLooping: false,
        isShuffling: false,
      },
      playlist: [],
      currentIndex: -1,

      // Download State
      downloadQueue: [],
      extractedAudios: [],
      extractLoading: false,
      extractError: '',

      // UI Actions
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Audio Library Actions
      loadLocalAudios: async () => {
        const state = get();
        if (state.localAudiosLoading) return; // Prevent multiple simultaneous calls

        set({ localAudiosLoading: true, localAudiosError: '' });
        try {
          console.log('🔄 Loading local audios from store...');
          const audios = await get_local_audios();
          console.log('✅ Loaded', audios.length, 'local audios');
          set({
            localAudios: audios,
            localAudiosLoading: false,
            localAudiosError: ''
          });
        } catch (error) {
          console.error('❌ Error loading local audios:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to load local audios';
          set({
            localAudiosLoading: false,
            localAudiosError: errorMessage
          });
        }
      },

      addLocalAudio: async (_audio) => {
        // Reload the entire list to ensure consistency
        const state = get();
        if (!state.localAudiosLoading) {
          await get().loadLocalAudios();
        }
      },

      removeLocalAudio: async (audioId) => {
        try {
          const success = await delete_local_audio(audioId);
          if (success) {
            // Remove from current playlist if it's the current audio
            const { playback } = get();
            if (playback.currentAudio?.audio.id === audioId) {
              get().stopAudio();
            }

            // Reload the list
            await get().loadLocalAudios();
          }
          return success;
        } catch (error) {
          console.error('❌ Error deleting audio:', error);
          return false;
        }
      },

      // Player Actions
      playAudio: async (audio, playlist = []) => {
        try {
          const url = await get_loacl_url(audio.path);
          const audioElement = document.querySelector('audio') as HTMLAudioElement;

          if (audioElement) {
            audioElement.src = url;
            audioElement.volume = get().playback.volume;
            await audioElement.play();

            const currentIndex = playlist.findIndex(item => item.audio.id === audio.audio.id);

            set({
              playback: {
                ...get().playback,
                isPlaying: true,
                currentAudio: audio,
              },
              playlist: playlist.length > 0 ? playlist : [audio],
              currentIndex: currentIndex >= 0 ? currentIndex : 0,
            });
          }
        } catch (error) {
          console.error('❌ Error playing audio:', error);
        }
      },

      pauseAudio: () => {
        const audioElement = document.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.pause();
          set({
            playback: {
              ...get().playback,
              isPlaying: false,
            }
          });
        }
      },

      stopAudio: () => {
        const audioElement = document.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
          set({
            playback: {
              ...get().playback,
              isPlaying: false,
              currentTime: 0,
            }
          });
        }
      },

      seekTo: (time) => {
        const audioElement = document.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.currentTime = time;
          set({
            playback: {
              ...get().playback,
              currentTime: time,
            }
          });
        }
      },

      setVolume: (volume) => {
        const audioElement = document.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.volume = volume;
          set({
            playback: {
              ...get().playback,
              volume,
            }
          });
        }
      },

      toggleLoop: () => {
        set({
          playback: {
            ...get().playback,
            isLooping: !get().playback.isLooping,
          }
        });
      },

      playNext: async () => {
        const { playlist, currentIndex } = get();
        if (playlist.length > 0) {
          const nextIndex = (currentIndex + 1) % playlist.length;
          await get().playAudio(playlist[nextIndex], playlist);
        }
      },

      playPrevious: async () => {
        const { playlist, currentIndex } = get();
        if (playlist.length > 0) {
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
          await get().playAudio(playlist[prevIndex], playlist);
        }
      },

      updatePlaybackTime: (currentTime, duration) => {
        set({
          playback: {
            ...get().playback,
            currentTime,
            duration,
          }
        });
      },

      // Download Actions
      extractAudios: async (url) => {
        set({ extractLoading: true, extractError: '', extractedAudios: [] });
        try {
          console.log('🔄 Extracting audios from:', url);
          const playlist = await extract_audios(url);
          const audios = playlist.audios;
          console.log('✅ Extracted', audios.length, 'audios from playlist:', playlist.title);
          set({
            extractedAudios: audios,
            extractLoading: false,
            extractError: audios.length === 0 ? 'No audio found in the provided URL' : ''
          });
        } catch (error) {
          console.error('❌ Error extracting audios:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to extract audio';
          set({
            extractLoading: false,
            extractError: errorMessage
          });
        }
      },

      downloadAudio: async (audio) => {
        const audioId = audio.id;

        // Add to download queue
        get().updateDownloadProgress(audioId, 'downloading', 0);

        try {
          console.log('🔄 Starting download for:', audio.title);
          const localAudios = await download_audio_and_update_config(audio);

          if (localAudios.length > 0) {
            get().updateDownloadProgress(audioId, 'completed', 100);
            await get().addLocalAudio(localAudios[0]);
            console.log('✅ Download completed for:', audio.title);
          } else {
            get().updateDownloadProgress(audioId, 'error', 0);
          }
        } catch (error) {
          console.error('❌ Download failed for:', audio.title, error);
          get().updateDownloadProgress(audioId, 'error', 0);
          throw error;
        }
      },

      clearExtractedAudios: () => {
        set({ extractedAudios: [], downloadQueue: [] });
      },

      updateDownloadProgress: (audioId, status, progress = 0) => {
        set((state) => {
          const existingIndex = state.downloadQueue.findIndex(item => item.audioId === audioId);
          const newQueue = [...state.downloadQueue];

          if (existingIndex >= 0) {
            newQueue[existingIndex] = { audioId, status, progress };
          } else {
            newQueue.push({ audioId, status, progress });
          }

          return { downloadQueue: newQueue };
        });
      },
    })),
    {
      name: 'music-player-store',
    }
  )
);

// Simple selectors to avoid object recreation issues
export const useActiveTab = () => useAppStore((state) => state.activeTab);
export const useLocalAudiosData = () => useAppStore((state) => state.localAudios);
export const useLocalAudiosLoading = () => useAppStore((state) => state.localAudiosLoading);
export const useLocalAudiosError = () => useAppStore((state) => state.localAudiosError);
export const usePlayback = () => useAppStore((state) => state.playback);
export const usePlaylistData = () => useAppStore((state) => state.playlist);
export const useCurrentIndex = () => useAppStore((state) => state.currentIndex);
export const useExtractedAudios = () => useAppStore((state) => state.extractedAudios);
export const useExtractLoading = () => useAppStore((state) => state.extractLoading);
export const useExtractError = () => useAppStore((state) => state.extractError);
export const useDownloadQueue = () => useAppStore((state) => state.downloadQueue);

// Combined selectors (these might cause re-renders but are more convenient)
export const useLocalAudios = () => {
  const audios = useLocalAudiosData();
  const loading = useLocalAudiosLoading();
  const error = useLocalAudiosError();
  return { audios, loading, error };
};

export const usePlaylist = () => {
  const playlist = usePlaylistData();
  const currentIndex = useCurrentIndex();
  return { playlist, currentIndex };
};

export const useDownloadState = () => {
  const extractedAudios = useExtractedAudios();
  const extractLoading = useExtractLoading();
  const extractError = useExtractError();
  const downloadQueue = useDownloadQueue();
  return { extractedAudios, extractLoading, extractError, downloadQueue };
};