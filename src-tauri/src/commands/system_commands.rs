use crate::error::Result;
use crate::models::config::Config;
use crate::services::{Storage, StorageUsage, CleanupResult};
use tauri::AppHandle;
use std::path::PathBuf;

#[tauri::command]
pub fn app_dir(app_handle: AppHandle) -> Result<PathBuf> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| crate::error::AppError::Io(e))?;
    
    if !std::fs::exists(&app_data_dir).unwrap_or(false) {
        std::fs::create_dir_all(&app_data_dir)
            .map_err(|e| crate::error::AppError::Io(e))?;
    }
    
    Ok(app_data_dir)
}

#[tauri::command]
pub fn get_config(app_handle: AppHandle) -> Result<Config> {
    let app_dir = app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    storage.load_config()
}

#[tauri::command]
pub fn save_config(config: Config, app_handle: AppHandle) -> Result<()> {
    let app_dir = app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    storage.save_config(&config)
}

#[tauri::command]
pub fn read_file(path: String, app_handle: AppHandle) -> Result<Vec<u8>> {
    let app_dir = app_dir(app_handle)?;
    
    let full_path = app_dir.join(&path);
    
    if !full_path.starts_with(&app_dir) {
        return Err(crate::error::AppError::InvalidPath(
            "Path traversal detected".to_string(),
        ));
    }
    
    let bin = std::fs::read(&full_path).map_err(|e| crate::error::AppError::Io(e))?;
    Ok(bin)
}

#[tauri::command]
pub fn get_storage_usage(app_handle: AppHandle) -> Result<StorageUsage> {
    let app_dir = app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    storage.get_storage_usage()
}

#[tauri::command]
pub fn cleanup_cache(max_size_mb: u64, app_handle: AppHandle) -> Result<CleanupResult> {
    let app_dir = app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    storage.cleanup_cache(max_size_mb)
}

#[tauri::command]
pub async fn import_local_audios(
    file_paths: Vec<String>,
    app_handle: AppHandle,
) -> Result<usize> {
    let app_dir = app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    let metadata_extractor = crate::services::MetadataExtractor;
    
    let mut imported_count = 0;
    let mut config = storage.load_config()?;
    
    for file_path in file_paths {
        let path = PathBuf::from(&file_path);
        
        if !path.exists() {
            log::warn!("File does not exist: {}", file_path);
            continue;
        }
        
        if !path.is_file() {
            continue;
        }
        
        let extension = path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");
        
        let is_audio = matches!(extension.to_lowercase().as_str(), 
            "mp3" | "m4a" | "flac" | "wav" | "ogg" | "aac" | "wma");
        
        if !is_audio {
            continue;
        }
        
        log::info!("Importing audio file: {}", file_path);
        
        let metadata = metadata_extractor.extract_from_file(&file_path)?;
        
        let id = format!("{:x}", md5::compute(&file_path));
        let title = metadata.title.unwrap_or_else(|| {
            path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("Unknown")
                .to_string()
        });
        
        let author = if let Some(artist) = metadata.artist {
            vec![artist]
        } else {
            vec!["Unknown Artist".to_string()]
        };
        
        let relative_path = path.strip_prefix(&app_dir)
            .ok()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| file_path.clone());
        
        use crate::models::audio::Audio;
        let audio = Audio {
            id,
            title,
            download_url: String::new(),
            local_url: Some(file_path.clone()),
            author,
            cover: None,
            tags: vec![],
            duration: metadata.duration.map(|d| d as u64),
            platform: "local".to_string(),
            date: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            format: None,
        };
        
        let mut local_audio = crate::models::audio::LocalAudio::new(
            relative_path,
            None,
            audio,
        );
        
        if let Ok(size) = local_audio.get_file_size(&app_dir) {
            log::info!("Imported audio file size: {} bytes", size);
        }
        
        config.add_audio(local_audio);
        imported_count += 1;
    }
    
    storage.save_config(&config)?;
    log::info!("Imported {} audio files", imported_count);
    
    Ok(imported_count)
}
