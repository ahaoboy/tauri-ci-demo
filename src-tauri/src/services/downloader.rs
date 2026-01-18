use crate::error::{Result, AppError};
use crate::models::audio::{Audio, LocalAudio};
use std::path::PathBuf;
use tokio::sync::mpsc;
use musicfree::Platform;

pub struct DownloadProgress {
    pub audio_id: String,
    pub progress: f32, // 0.0 - 1.0
    pub status: DownloadStatus,
}

#[derive(Debug, Clone)]
pub enum DownloadStatus {
    Pending,
    Downloading,
    Completed,
    Failed(String),
}

pub struct Downloader {
    max_concurrent: usize,
    download_dir: PathBuf,
}

impl Downloader {
    pub fn new(download_dir: PathBuf) -> Self {
        Self {
            max_concurrent: 3,
            download_dir,
        }
    }

    pub async fn download_audio(
        &self,
        audio: &Audio,
        platform: Platform,
    ) -> Result<LocalAudio> {
        let id = format!("{:x}", md5::compute(&audio.download_url));
        let extension = audio
            .format
            .as_ref()
            .unwrap_or(&musicfree::core::AudioFormat::Mp3)
            .extension();
        
        let filename = format!("{}{}", id, extension);
        let audio_dir = self.download_dir.join("assets").join(format!("{:?}", platform)).join("audios");
        let file_path = audio_dir.join(&filename);

        if file_path.exists() {
            log::info!("Audio file already exists: {:?}", file_path);
        } else {
            log::info!("Downloading audio: {}", audio.title);
            
            std::fs::create_dir_all(&audio_dir)?;
            
            let audio_data = platform.extractor().download(&audio.download_url).await
                .map_err(|e| AppError::Download(format!("Failed to download audio: {}", e)))?;
            
            std::fs::write(&file_path, audio_data)?;
            log::info!("Successfully downloaded: {:?}", file_path);
        }

        let cover_path = if let Some(cover_url) = &audio.cover {
            self.download_cover(cover_url, platform).await?
        } else {
            None
        };

        let relative_path = file_path
            .strip_prefix(&self.download_dir)?
            .to_string_lossy()
            .to_string();

        let mut local_audio = LocalAudio::new(relative_path, cover_path, audio.clone());
        
        if let Ok(size) = local_audio.get_file_size(&self.download_dir) {
            log::info!("Audio file size: {} bytes", size);
        }

        Ok(local_audio)
    }

    pub async fn download_cover(
        &self,
        cover_url: &str,
        platform: Platform,
    ) -> Result<Option<String>> {
        let filename = cover_url.split("/").last().ok_or_else(|| {
            AppError::InvalidUrl("Could not extract filename from cover URL".to_string())
        })?;

        let cover_dir = self.download_dir.join("assets").join(format!("{:?}", platform)).join("covers");
        let file_path = cover_dir.join(filename);

        if file_path.exists() {
            log::info!("Cover already exists: {:?}", file_path);
            let relative_path = file_path.strip_prefix(&self.download_dir)?.to_string_lossy().to_string();
            return Ok(Some(relative_path));
        }

        log::info!("Downloading cover from: {}", cover_url);
        
        std::fs::create_dir_all(&cover_dir)?;
        
        let cover_data = platform.extractor().download_cover(cover_url).await
            .map_err(|e| AppError::Download(format!("Failed to download cover: {}", e)))?;
        
        std::fs::write(&file_path, cover_data)?;
        
        let relative_path = file_path.strip_prefix(&self.download_dir)?.to_string_lossy().to_string();
        log::info!("Successfully downloaded cover: {:?}", file_path);
        
        Ok(Some(relative_path))
    }

    pub async fn batch_download(
        &self,
        audios: Vec<Audio>,
        progress_sender: Option<mpsc::UnboundedSender<DownloadProgress>>,
    ) -> Vec<Result<LocalAudio>> {
        let mut results = Vec::new();
        let semaphore = std::sync::Arc::new(tokio::sync::Semaphore::new(self.max_concurrent));

        let mut tasks = Vec::new();
        for audio in audios {
            let semaphore = semaphore.clone();
            let download_dir = self.download_dir.clone();
            let audio_clone = audio.clone();
            
            let task = tokio::spawn(async move {
                let _permit = semaphore.acquire().await.unwrap();
                
                if let Some(ref sender) = progress_sender {
                    let _ = sender.send(DownloadProgress {
                        audio_id: audio_clone.id.clone(),
                        progress: 0.0,
                        status: DownloadStatus::Downloading,
                    });
                }

                let result = self.download_audio(&audio_clone, audio_clone.platform.clone()).await;
                
                if let Some(ref sender) = progress_sender {
                    let status = match &result {
                        Ok(_) => DownloadStatus::Completed,
                        Err(e) => DownloadStatus::Failed(e.to_string()),
                    };
                    let _ = sender.send(DownloadProgress {
                        audio_id: audio_clone.id,
                        progress: 1.0,
                        status,
                    });
                }
                
                result
            });
            
            tasks.push(task);
        }

        for task in tasks {
            results.push(task.await.unwrap());
        }

        results
    }
}
