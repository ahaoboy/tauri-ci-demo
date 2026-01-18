use serde::{Deserialize, Serialize};
use crate::models::audio::LocalAudio;
use crate::models::audio::Audio;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playlist {
    pub title: Option<String>,
    pub cover: Option<String>,
    pub audios: Vec<Audio>,
    pub platform: String,
    pub total_duration: Option<u64>,
}

impl Playlist {
    pub fn total_audio_count(&self) -> usize {
        self.audios.len()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalPlaylist {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub cover_path: Option<String>,
    pub cover: Option<String>,
    pub audios: Vec<LocalAudio>,
    pub platform: String,
    pub created_at: u64,
    pub updated_at: u64,
}

impl LocalPlaylist {
    pub fn new(name: String, platform: String) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        Self {
            id: format!("{:x}", md5::compute(&name)),
            name,
            description: None,
            cover_path: None,
            cover: None,
            audios: Vec::new(),
            platform,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn add_audio(&mut self, audio: LocalAudio) {
        self.audios.push(audio);
        self.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
    }

    pub fn remove_audio(&mut self, audio_id: &str) -> bool {
        let original_len = self.audios.len();
        self.audios.retain(|a| a.audio.id != audio_id);
        let removed = self.audios.len() != original_len;
        if removed {
            self.updated_at = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
        }
        removed
    }

    pub fn total_duration(&self) -> u64 {
        self.audios
            .iter()
            .filter_map(|a| a.audio.duration)
            .sum()
    }
}
