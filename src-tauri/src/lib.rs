use musicfree::{Audio, Platform, Playlist};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

use crate::api::{Config, get_config_path};
mod api;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalAudio {
    pub path: String,
    pub cover_path: Option<String>,
    pub audio: Audio,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalPlaylist {
    pub cover_path: Option<String>,
    pub cover: Option<String>,
    pub audios: Vec<LocalAudio>,
    pub platform: Platform,
}

#[tauri::command]
fn app_dir(app_handle: tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        // .public_dir()
        // .resource_dir()
        // .app_data_dir()
        .map_err(|e| e.to_string())?;
    if !std::fs::exists(&app_data_dir).unwrap_or(false) {
        std::fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
    }
    Ok(app_data_dir)
}

#[tauri::command]
async fn extract_audios(url: &str) -> Result<Playlist, String> {
    musicfree::extract(url).await.map_err(|e| e.to_string())
}

#[tauri::command]
fn get_config(app_handle: tauri::AppHandle) -> Result<Config, String> {
    let dir = app_dir(app_handle)?;
    let p = get_config_path(dir);
    if !p.exists() {
        return Ok(Config::default());
    }
    let s = std::fs::read_to_string(p).map_err(|e| e.to_string())?;
    let config: Config = serde_json::from_str(&s).map_err(|e| e.to_string())?;
    Ok(config)
}

#[tauri::command]
fn save_config(config: Config, app_handle: tauri::AppHandle) -> Result<(), String> {
    let dir = app_dir(app_handle)?;
    let s = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    std::fs::write(get_config_path(dir), s).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn download_audio(
    mut audio: Audio,
    app_handle: tauri::AppHandle,
) -> Result<LocalAudio, String> {
    let dir = app_dir(app_handle).map_err(|e| e.to_string())?;

    api::download_audio(&mut audio, dir)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn download_cover(
    url: &str,
    platform: Platform,
    app_handle: tauri::AppHandle,
) -> Result<Option<String>, String> {
    let dir = app_dir(app_handle).map_err(|e| e.to_string())?;

    Ok(api::download_cover(url, platform, dir).await)
}

pub struct FileInfo {}

#[tauri::command]
async fn read_file(path: &str, app_handle: tauri::AppHandle) -> Result<Vec<u8>, String> {
    let dir = app_dir(app_handle).map_err(|e| e.to_string())?;
    let path = dir.join(path);
    let bin = std::fs::read(path).map_err(|e| e.to_string())?;
    Ok(bin)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init());

    // Only include these plugins on desktop platforms
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let builder = builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}));

    #[cfg(target_os = "windows")]
    let builder = builder
        .plugin(tauri_plugin_media::init());

    builder
        .invoke_handler(tauri::generate_handler![
            extract_audios,
            app_dir,
            read_file,
            download_audio,
            download_cover,
            get_config,
            save_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
