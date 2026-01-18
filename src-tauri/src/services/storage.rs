use crate::error::{Result, AppError};
use crate::models::audio::LocalAudio;
use crate::models::config::Config;
use std::path::PathBuf;
use std::fs;

pub struct Storage {
    app_dir: PathBuf,
    config_file: PathBuf,
}

impl Storage {
    pub fn new(app_dir: PathBuf) -> Self {
        let config_file = app_dir.join("musicfree.json");
        Self { app_dir, config_file }
    }

    pub fn init(&self) -> Result<()> {
        if !self.app_dir.exists() {
            fs::create_dir_all(&self.app_dir)?;
            log::info!("Created app directory: {:?}", self.app_dir);
        }

        let assets_dir = self.app_dir.join("assets");
        if !assets_dir.exists() {
            fs::create_dir_all(&assets_dir)?;
            log::info!("Created assets directory: {:?}", assets_dir);
        }

        Ok(())
    }

    pub fn load_config(&self) -> Result<Config> {
        if !self.config_file.exists() {
            log::info!("Config file does not exist, creating default config");
            let config = Config::new();
            self.save_config(&config)?;
            return Ok(config);
        }

        let content = fs::read_to_string(&self.config_file)?;
        let config: Config = serde_json::from_str(&content)?;
        log::info!("Loaded config from {:?}", self.config_file);
        Ok(config)
    }

    pub fn save_config(&self, config: &Config) -> Result<()> {
        let content = serde_json::to_string_pretty(config)?;
        fs::write(&self.config_file, content)?;
        log::info!("Saved config to {:?}", self.config_file);
        Ok(())
    }

    pub fn delete_audio_file(&self, local_audio: &LocalAudio) -> Result<()> {
        let full_path = self.app_dir.join(&local_audio.path);
        
        if full_path.exists() {
            fs::remove_file(&full_path)?;
            log::info!("Deleted audio file: {:?}", full_path);
        }

        if let Some(cover_path) = &local_audio.cover_path {
            let full_cover_path = self.app_dir.join(cover_path);
            if full_cover_path.exists() {
                fs::remove_file(&full_cover_path)?;
                log::info!("Deleted cover file: {:?}", full_cover_path);
            }
        }

        Ok(())
    }

    pub fn get_storage_usage(&self) -> Result<StorageUsage> {
        let total_size = self.dir_size(&self.app_dir)?;
        let audio_size = self.dir_size(&self.app_dir.join("assets").join("audios"))?;
        let cover_size = self.dir_size(&self.app_dir.join("assets").join("covers"))?;

        Ok(StorageUsage {
            total_bytes: total_size,
            audio_bytes: audio_size,
            cover_bytes: cover_size,
            audio_count: self.count_files(&self.app_dir.join("assets").join("audios"))?,
        })
    }

    pub fn cleanup_cache(&self, max_size_mb: u64) -> Result<CleanupResult> {
        let max_size_bytes = max_size_mb * 1024 * 1024;
        let usage = self.get_storage_usage()?;
        
        if usage.total_bytes <= max_size_bytes {
            return Ok(CleanupResult::default());
        }

        log::info!("Cache size ({} MB) exceeds limit ({} MB), starting cleanup", 
                   usage.total_bytes / 1024 / 1024, max_size_mb);

        let mut deleted_files = 0;
        let mut freed_bytes = 0u64;
        let mut deleted_audios = Vec::new();

        let config = self.load_config()?;
        let mut audios_by_time = config.audios.clone();
        
        audios_by_time.sort_by(|a, b| a.last_played.cmp(&b.last_played));

        for audio in audios_by_time.iter() {
            if usage.total_bytes - freed_bytes <= max_size_bytes {
                break;
            }

            let full_path = self.app_dir.join(&audio.path);
            if full_path.exists() {
                let metadata = fs::metadata(&full_path)?;
                let size = metadata.len();
                
                fs::remove_file(&full_path)?;
                freed_bytes += size;
                deleted_files += 1;
                deleted_audios.push(audio.audio.id.clone());
                
                log::info!("Deleted old audio: {} ({})", audio.audio.title, size);
            }

            if let Some(cover_path) = &audio.cover_path {
                let full_cover_path = self.app_dir.join(cover_path);
                if full_cover_path.exists() {
                    if let Ok(metadata) = fs::metadata(&full_cover_path) {
                        let size = metadata.len();
                        fs::remove_file(&full_cover_path)?;
                        freed_bytes += size;
                        deleted_files += 1;
                        log::info!("Deleted cover: {}", size);
                    }
                }
            }
        }

        Ok(CleanupResult {
            deleted_files,
            freed_bytes,
            deleted_audios,
        })
    }

    fn dir_size(&self, path: &PathBuf) -> Result<u64> {
        let mut total = 0u64;
        if path.exists() {
            for entry in fs::read_dir(path)? {
                let entry = entry?;
                let metadata = entry.metadata()?;
                if metadata.is_dir() {
                    total += self.dir_size(&entry.path())?;
                } else {
                    total += metadata.len();
                }
            }
        }
        Ok(total)
    }

    fn count_files(&self, path: &PathBuf) -> Result<usize> {
        if !path.exists() {
            return Ok(0);
        }
        let mut count = 0;
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            if entry.metadata()?.is_file() {
                count += 1;
            }
        }
        Ok(count)
    }
}

#[derive(Debug, Clone)]
pub struct StorageUsage {
    pub total_bytes: u64,
    pub audio_bytes: u64,
    pub cover_bytes: u64,
    pub audio_count: usize,
}

#[derive(Debug, Clone, Default)]
pub struct CleanupResult {
    pub deleted_files: usize,
    pub freed_bytes: u64,
    pub deleted_audios: Vec<String>,
}
