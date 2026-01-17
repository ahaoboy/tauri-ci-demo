use std::path::PathBuf;

use musicfree::Audio;
use serde::{Deserialize, Serialize};
use tauri::Manager;
mod api;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LocalAudio {
    path: String,
    audio: Audio,
}
#[tauri::command]
async fn app_dir(app_handle: tauri::AppHandle) -> Result<PathBuf, String> {
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
async fn extract_audios(url: &str) -> Result<Vec<Audio>, String> {
    musicfree::extract(url).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn download_audio(
    mut audio: Audio,
    app_handle: tauri::AppHandle,
) -> Result<LocalAudio, String> {
    let dir = app_dir(app_handle).await.map_err(|e| e.to_string())?;


    api::download_audio(&mut audio, dir)
        .await
        .map_err(|e| e.to_string())
}

pub struct FileInfo {}

#[tauri::command]
async fn read_file(path: &str, app_handle: tauri::AppHandle) -> Result<Vec<u8>, String> {
    let dir = app_dir(app_handle).await.map_err(|e| e.to_string())?;
    let path = dir.join(path);
    let bin = std::fs::read(path).map_err(|e| e.to_string())?;
    Ok(bin)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            extract_audios,
            app_dir,
            read_file,
            download_audio
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
