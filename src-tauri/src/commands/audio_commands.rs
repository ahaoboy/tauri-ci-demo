use crate::error::Result;
use crate::models::audio::{Audio, LocalAudio};
use crate::services::{Downloader, Storage, SearchService, MetadataExtractor};
use crate::commands::system_commands::get_app_dir;
use tauri::AppHandle;
use musicfree::Playlist;

#[tauri::command]
pub async fn extract_audios(url: &str) -> Result<Playlist> {
    log::info!("Extracting audios from URL: {}", url);
    musicfree::extract(url).await.map_err(|e| crate::error::AppError::Download(e.to_string()))
}

#[tauri::command]
pub async fn download_audio(audio: Audio, app_handle: AppHandle) -> Result<LocalAudio> {
    let app_dir = get_app_dir(app_handle)?;
    let downloader = Downloader::new(app_dir.clone());
    
    log::info!("Downloading audio: {}", audio.title);
    let local_audio = downloader.download_audio(&audio, audio.platform.clone()).await?;
    
    let storage = Storage::new(app_dir);
    let mut config = storage.load_config()?;
    config.add_audio(local_audio.clone());
    storage.save_config(&config)?;
    
    Ok(local_audio)
}

#[tauri::command]
pub async fn download_cover(
    url: String,
    platform: String,
    app_handle: AppHandle,
) -> Result<Option<String>> {
    let app_dir = get_app_dir(app_handle)?;
    let downloader = Downloader::new(app_dir);
    
    let platform_enum = platform.parse::<musicfree::Platform>()
        .map_err(|_| crate::error::AppError::InvalidFormat(platform))?;
    
    let cover_path = downloader.download_cover(&url, platform_enum).await?;
    Ok(cover_path)
}

#[tauri::command]
pub async fn delete_audio(audio_id: String, app_handle: AppHandle) -> Result<bool> {
    let app_dir = get_app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    let mut config = storage.load_config()?;
    
    if let Some(audio) = config.find_audio(&audio_id) {
        storage.delete_audio_file(audio)?;
    }
    
    let removed = config.remove_audio(&audio_id);
    storage.save_config(&config)?;
    
    Ok(removed)
}

#[tauri::command]
pub async fn update_play_count(audio_id: String, app_handle: AppHandle) -> Result<()> {
    let app_dir = get_app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    let mut config = storage.load_config()?;
    
    if let Some(audio) = config.audios.iter_mut().find(|a| a.audio.id == audio_id) {
        audio.increment_play_count();
    }
    
    storage.save_config(&config)?;
    Ok(())
}

#[tauri::command]
pub async fn search_audios(
    keyword: Option<String>,
    artist: Option<String>,
    title: Option<String>,
    tags: Option<Vec<String>>,
    platform: Option<String>,
    min_duration: Option<u64>,
    max_duration: Option<u64>,
    app_handle: AppHandle,
) -> Result<Vec<LocalAudio>> {
    use crate::services::search::SearchQuery;
    
    let app_dir = get_app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    let config = storage.load_config()?;
    
    let query = SearchQuery {
        keyword,
        artist,
        title,
        tags,
        platform,
        min_duration,
        max_duration,
    };
    
    let search_service = SearchService;
    let result = search_service.search(&config.audios, &query);
    
    Ok(result.audios)
}

#[tauri::command]
pub async fn get_audio_suggestions(
    keyword: String,
    limit: Option<usize>,
    app_handle: AppHandle,
) -> Result<Vec<String>> {
    let app_dir = get_app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    let config = storage.load_config()?;
    
    let search_service = SearchService;
    let suggestions = search_service.suggest(&config.audios, &keyword, limit.unwrap_or(10));
    
    Ok(suggestions)
}

#[tauri::command]
pub async fn extract_audio_metadata(file_path: String) -> Result<crate::services::metadata::AudioMetadata> {
    let extractor = MetadataExtractor;
    let metadata = extractor.extract_from_file(&file_path)?;
    Ok(metadata)
}
