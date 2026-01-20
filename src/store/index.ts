import { create } from 'zustand';
import {
  LocalAudio,
  LocalPlaylist,
  Config,
  get_config,
  save_config,
  get_loacl_url,
} from '../api';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'auto';

// App state interface
interface AppState {
  // Config data
  config: Config | null;
  playlists: LocalPlaylist[];
  audios: LocalAudio[];

  // Current playback state
  currentAudio: LocalAudio | null;
  audioUrl: string | null;
  isPlaying: boolean;
  playbackRate: number; // Added playbackRate

  // Theme
  themeMode: ThemeMode;

  // Loading states
  isConfigLoading: boolean;

  // Audio element reference (managed externally)
  audioElement: HTMLAudioElement | null;

  // Actions
  loadConfig: () => Promise<void>;
  saveConfig: (config: Config) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
  playAudio: (audio: LocalAudio) => Promise<void>;
  pauseAudio: () => void;
  resumeAudio: () => void;
  togglePlay: () => void;
  setAudioElement: (element: HTMLAudioElement | null) => void;
  addAudiosToConfig: (audios: LocalAudio[]) => Promise<void>;
  addPlaylistToConfig: (playlist: LocalPlaylist) => Promise<void>;
  setLastAudio: (audio: LocalAudio) => Promise<void>;
  setPlaybackRate: (rate: number) => void; // Added action
  toggleFavorite: (audio: LocalAudio) => Promise<void>; // Added action (placeholder logic for now)
}

// Helper to get system theme
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
};

// Helper to apply theme to document
const applyTheme = (mode: ThemeMode) => {
  if (typeof document !== 'undefined') {
    const actualTheme = mode === 'auto' ? getSystemTheme() : mode;
    document.documentElement.setAttribute(
      'data-prefers-color-scheme',
      actualTheme
    );
  }
};

// Create the store
export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  config: null,
  playlists: [],
  audios: [],
  currentAudio: null,
  audioUrl: null,
  isPlaying: false,
  playbackRate: 1,
  themeMode: 'auto',
  isConfigLoading: false,
  audioElement: null,

  // Load config from backend
  loadConfig: async () => {
    set({ isConfigLoading: true });
    try {
      const config = await get_config();
      const savedTheme = localStorage.getItem('themeMode') as ThemeMode | null;
      const themeMode = savedTheme || config.theme as ThemeMode || 'auto';

      applyTheme(themeMode);

      set({
        config,
        playlists: config.playlists || [],
        audios: config.audios || [],
        themeMode,
        currentAudio: config.last_audio || null,
        isConfigLoading: false,
      });
    } catch (error) {
      console.error('Failed to load config:', error);
      set({ isConfigLoading: false });
    }
  },

  // Save config to backend
  saveConfig: async (config: Config) => {
    try {
      await save_config(config);
      set({
        config,
        playlists: config.playlists || [],
        audios: config.audios || [],
      });
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  },

  // Set theme mode
  setThemeMode: (mode: ThemeMode) => {
    localStorage.setItem('themeMode', mode);
    applyTheme(mode);
    set({ themeMode: mode });

    // Also save to config
    const { config } = get();
    if (config) {
      const updatedConfig = { ...config, theme: mode };
      save_config(updatedConfig).catch((error) => {
        console.error('Failed to save theme to config:', error);
      });
    }
  },

  // Set audio element
  setAudioElement: (element: HTMLAudioElement | null) => {
    set({ audioElement: element });
  },

  // Play audio
  playAudio: async (audio: LocalAudio) => {
    const { audioElement } = get();
    try {
      const url = await get_loacl_url(audio.path);
      set({
        currentAudio: audio,
        audioUrl: url,
        isPlaying: true,
      });

      if (audioElement) {
        audioElement.src = url;
        await audioElement.play();
      }

      // Save as last played audio
      get().setLastAudio(audio);
    } catch (error) {
      console.error('Failed to play audio:', error);
      set({ isPlaying: false });
    }
  },

  // Pause audio
  pauseAudio: () => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.pause();
    }
    set({ isPlaying: false });
  },

  // Resume audio
  resumeAudio: () => {
    const { audioElement, audioUrl } = get();
    if (audioElement && audioUrl) {
      audioElement.play().catch((error) => {
        console.error('Failed to resume audio:', error);
      });
      set({ isPlaying: true });
    }
  },

  // Toggle play/pause
  togglePlay: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pauseAudio();
    } else {
      get().resumeAudio();
    }
  },

  // Add audios to config
  addAudiosToConfig: async (newAudios: LocalAudio[]) => {
    const { config } = get();
    if (!config) return;

    const existingIds = new Set(config.audios.map((a) => a.audio.id));
    const uniqueNewAudios = newAudios.filter(
      (a) => !existingIds.has(a.audio.id)
    );

    if (uniqueNewAudios.length === 0) return;

    const updatedConfig: Config = {
      ...config,
      audios: [...config.audios, ...uniqueNewAudios],
    };

    await get().saveConfig(updatedConfig);
  },

  // Add playlist to config
  addPlaylistToConfig: async (playlist: LocalPlaylist) => {
    const { config } = get();
    if (!config) return;

    const existingIndex = config.playlists.findIndex(
      (p) => p.id === playlist.id
    );
    let updatedPlaylists: LocalPlaylist[];

    if (existingIndex >= 0) {
      // Update existing playlist
      updatedPlaylists = [...config.playlists];
      updatedPlaylists[existingIndex] = playlist;
    } else {
      // Add new playlist
      updatedPlaylists = [...config.playlists, playlist];
    }

    const updatedConfig: Config = {
      ...config,
      playlists: updatedPlaylists,
    };

    await get().saveConfig(updatedConfig);
  },

  // Set last played audio
  setLastAudio: async (audio: LocalAudio) => {
    const { config } = get();
    if (!config) return;

    const updatedConfig: Config = {
      ...config,
      last_audio: audio,
    };

    try {
      await save_config(updatedConfig);
      set({ config: updatedConfig });
    } catch (error) {
      console.error('Failed to save last audio:', error);
    }
  },

  // Set playback rate
  setPlaybackRate: (rate: number) => {
    const { audioElement } = get();
    set({ playbackRate: rate });
    if (audioElement) {
      audioElement.playbackRate = rate;
    }
  },

  // Toggle favorite
  toggleFavorite: async (audio: LocalAudio) => {
    const { config } = get();
    if (!config) return;

    const favId = "我喜欢的";
    let playlists = [...config.playlists];
    let favPlaylist = playlists.find(p => p.id === favId);

    if (!favPlaylist) {
      favPlaylist = {
        id: favId,
        cover_path: null,
        audios: [],
        platform: 'local',
      };
      playlists.push(favPlaylist);
    }

    // Check if audio exists
    const exists = favPlaylist.audios.some(a => a.audio.id === audio.audio.id);

    let updatedFavPlaylist = { ...favPlaylist };
    if (exists) {
      updatedFavPlaylist.audios = favPlaylist.audios.filter(a => a.audio.id !== audio.audio.id);
      console.log("Removed from favorites");
    } else {
      updatedFavPlaylist.audios = [...favPlaylist.audios, audio];
      console.log("Added to favorites");
    }

    // Update playlists array
    playlists = playlists.map(p => p.id === favId ? updatedFavPlaylist : p);

    const updatedConfig: Config = {
      ...config,
      playlists,
    };

    await get().saveConfig(updatedConfig);
  }
}));

// Export convenience hooks
export const useConfig = () => useAppStore((state) => state.config);
export const usePlaylists = () => useAppStore((state) => state.playlists);
export const useAudios = () => useAppStore((state) => state.audios);
export const useCurrentAudio = () => useAppStore((state) => state.currentAudio);
export const useIsPlaying = () => useAppStore((state) => state.isPlaying);
export const usePlaybackRate = () => useAppStore((state) => state.playbackRate);
export const useThemeMode = () => useAppStore((state) => state.themeMode);
