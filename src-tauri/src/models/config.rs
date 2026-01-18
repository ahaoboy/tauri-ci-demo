use serde::{Deserialize, Serialize};
use crate::models::audio::LocalAudio;
use crate::models::playlist::LocalPlaylist;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Config {
    pub audios: Vec<LocalAudio>,
    pub playlists: Vec<LocalPlaylist>,
    pub settings: AppSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppSettings {
    pub download_path: Option<String>,
    pub max_cache_size: Option<u64>, // MB
    pub auto_download_cover: bool,
    pub default_audio_format: String,
}

impl Config {
    pub fn new() -> Self {
        Self {
            audios: Vec::new(),
            playlists: Vec::new(),
            settings: AppSettings {
                auto_download_cover: true,
                default_audio_format: "mp3".to_string(),
                ..Default::default()
            },
        }
    }

    pub fn add_audio(&mut self, audio: LocalAudio) {
        if !self.audios.iter().any(|a| a.audio.id == audio.audio.id) {
            self.audios.push(audio);
        }
    }

    pub fn remove_audio(&mut self, audio_id: &str) -> bool {
        let original_len = self.audios.len();
        self.audios.retain(|a| a.audio.id != audio_id);
        self.audios.len() != original_len
    }

    pub fn find_audio(&self, audio_id: &str) -> Option<&LocalAudio> {
        self.audios.iter().find(|a| a.audio.id == audio_id)
    }

    pub fn add_playlist(&mut self, playlist: LocalPlaylist) {
        if !self.playlists.iter().any(|p| p.id == playlist.id) {
            self.playlists.push(playlist);
        }
    }

    pub fn remove_playlist(&mut self, playlist_id: &str) -> bool {
        let original_len = self.playlists.len();
        self.playlists.retain(|p| p.id != playlist_id);
        self.playlists.len() != original_len
    }

    pub fn find_playlist(&self, playlist_id: &str) -> Option<&LocalPlaylist> {
        self.playlists.iter().find(|p| p.id == playlist_id)
    }
}
