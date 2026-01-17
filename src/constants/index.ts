// App constants
export const APP_NAME = 'Music Player';
export const APP_VERSION = '1.0.0';

// Audio player constants
export const DEFAULT_VOLUME = 1;
export const SEEK_STEP = 10; // seconds
export const VOLUME_STEP = 0.1;

// UI constants
export const BOTTOM_NAV_HEIGHT = 60;
export const MOBILE_BREAKPOINT = 768;

// File size limits
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Supported audio formats
export const SUPPORTED_AUDIO_FORMATS = [
  'mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'
];

// Platform names
export const PLATFORMS = {
  YOUTUBE: 'YouTube',
  SOUNDCLOUD: 'SoundCloud',
  SPOTIFY: 'Spotify',
  BANDCAMP: 'Bandcamp',
  OTHER: 'Other'
} as const;