use crate::error::Result;
use crate::models::playlist::LocalPlaylist;
use crate::models::audio::LocalAudio;
use crate::services::{PlaylistManager, Storage};
use crate::commands::system_commands::get_app_dir;
use tauri::AppHandle;

#[tauri::command]
pub async fn create_playlist(name: String, platform: String, app_handle: AppHandle) -> Result<LocalPlaylist> {
    let app_dir = get_app_dir(app_handle)?;
    let manager = PlaylistManager;
    let storage = Storage::new(app_dir);
    
    let playlist = manager.create_playlist(&name, &platform)?;
    
    let mut config = storage.load_config()?;
    config.add_playlist(playlist.clone());
    storage.save_config(&config)?;
    
    Ok(playlist)
}

#[tauri::command]
pub async fn rename_playlist(playlist_id: String, new_name: String, app_handle: AppHandle) -> Result<()> {
    let app_dir = get_app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    let mut config = storage.load_config()?;
    
    if let Some(playlist) = config.playlists.iter_mut().find(|p| p.id == playlist_id) {
        PlaylistManager::rename_playlist(playlist, new_name);
        storage.save_config(&config)?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn delete_playlist(playlist_id: String, app_handle: AppHandle) -> Result<bool> {
    let app_dir = get_app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    let mut config = storage.load_config()?;
    
    let removed = config.remove_playlist(&playlist_id);
    if removed {
        storage.save_config(&config)?;
    }
    
    Ok(removed)
}

#[tauri::command]
pub async fn add_audio_to_playlist(
    playlist_id: String,
    audio_id: String,
    app_handle: AppHandle,
) -> Result<()> {
    let app_dir = get_app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    let manager = PlaylistManager;
    let mut config = storage.load_config()?;
    
    let audio = config.find_audio(&audio_id)
        .ok_or_else(|| crate::error::AppError::AudioNotFound(audio_id.clone()))?;
    
    if let Some(playlist) = config.playlists.iter_mut().find(|p| p.id == playlist_id) {
        manager.add_audio_to_playlist(playlist, audio.clone())?;
        storage.save_config(&config)?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn remove_audio_from_playlist(
    playlist_id: String,
    audio_id: String,
    app_handle: AppHandle,
) -> Result<bool> {
    let app_dir = get_app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    let manager = PlaylistManager;
    let mut config = storage.load_config()?;
    
    if let Some(playlist) = config.playlists.iter_mut().find(|p| p.id == playlist_id) {
        let removed = manager.remove_audio_from_playlist(playlist, &audio_id)?;
        storage.save_config(&config)?;
        return Ok(removed);
    }
    
    Ok(false)
}

#[tauri::command]
pub async fn reorder_playlist(
    playlist_id: String,
    audio_id: String,
    new_position: usize,
    app_handle: AppHandle,
) -> Result<()> {
    let app_dir = get_app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    let manager = PlaylistManager;
    let mut config = storage.load_config()?;
    
    if let Some(playlist) = config.playlists.iter_mut().find(|p| p.id == playlist_id) {
        manager.reorder_playlist(playlist, &audio_id, new_position)?;
        storage.save_config(&config)?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn duplicate_playlist(playlist_id: String, app_handle: AppHandle) -> Result<LocalPlaylist> {
    let app_dir = get_app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    let manager = PlaylistManager;
    let mut config = storage.load_config()?;
    
    let playlist = config.find_playlist(&playlist_id)
        .ok_or_else(|| crate::error::AppError::PlaylistNotFound(playlist_id.clone()))?;
    
    let new_playlist = manager.duplicate_playlist(playlist)?;
    config.add_playlist(new_playlist.clone());
    storage.save_config(&config)?;
    
    Ok(new_playlist)
}

#[tauri::command]
pub async fn merge_playlists(
    target_id: String,
    source_id: String,
    app_handle: AppHandle,
) -> Result<()> {
    let app_dir = get_app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    let manager = PlaylistManager;
    let mut config = storage.load_config()?;
    
    let target = config.playlists.iter_mut().find(|p| p.id == target_id)
        .ok_or_else(|| crate::error::AppError::PlaylistNotFound(target_id.clone()))?;
    
    let source = config.find_playlist(&source_id)
        .ok_or_else(|| crate::error::AppError::PlaylistNotFound(source_id.clone()))?;
    
    manager.merge_playlists(target, source)?;
    storage.save_config(&config)?;
    
    Ok(())
}

#[tauri::command]
pub async fn shuffle_playlist(playlist_id: String, app_handle: AppHandle) -> Result<()> {
    let app_dir = get_app_dir(app_handle)?;
    let storage = Storage::new(app_dir);
    let manager = PlaylistManager;
    let mut config = storage.load_config()?;
    
    if let Some(playlist) = config.playlists.iter_mut().find(|p| p.id == playlist_id) {
        manager.shuffle_playlist(playlist);
        storage.save_config(&config)?;
    }
    
    Ok(())
}
