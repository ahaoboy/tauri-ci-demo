use serde::{Deserialize, Serialize};
use crate::error::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Audio {
    pub id: String,
    pub title: String,
    pub download_url: String,
    pub local_url: Option<String>,
    pub author: Vec<String>,
    pub cover: Option<String>,
    pub tags: Vec<String>,
    pub duration: Option<u64>,
    pub platform: String,
    pub date: u64,
    pub format: Option<AudioFormat>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AudioFormat {
    Mp3,
    M4a,
    Flac,
    Wav,
    Ogg,
}

impl AudioFormat {
    pub fn extension(&self) -> &str {
        match self {
            AudioFormat::Mp3 => ".mp3",
            AudioFormat::M4a => ".m4a",
            AudioFormat::Flac => ".flac",
            AudioFormat::Wav => ".wav",
            AudioFormat::Ogg => ".ogg",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalAudio {
    pub path: String,
    pub cover_path: Option<String>,
    pub audio: Audio,
    pub file_size: Option<u64>, // 文件大小（字节）
    pub created_at: u64, // 创建时间戳
    pub last_played: Option<u64>, // 最后播放时间戳
    pub play_count: u32, // 播放次数
}

impl LocalAudio {
    pub fn new(path: String, cover_path: Option<String>, audio: Audio) -> Self {
        Self {
            path,
            cover_path,
            audio,
            file_size: None,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            last_played: None,
            play_count: 0,
        }
    }

    pub fn increment_play_count(&mut self) {
        self.play_count += 1;
        self.last_played = Some(
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        );
    }

    pub fn get_file_size(&mut self, app_dir: &std::path::PathBuf) -> Result<u64> {
        let full_path = app_dir.join(&self.path);
        let metadata = std::fs::metadata(&full_path)?;
        let size = metadata.len();
        self.file_size = Some(size);
        Ok(size)
    }
}
