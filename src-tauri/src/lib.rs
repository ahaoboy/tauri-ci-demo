use musicfree::Audio;
use serde::{Deserialize, Serialize};
use tauri::Manager;

mod api;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LocalAudio {
    id: String,
    path: String,
    audio: Audio,
}

#[tauri::command]
async fn extract_audio(url: &str, app_handle: tauri::AppHandle) -> Result<Vec<LocalAudio>, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    if std::fs::exists(&app_data_dir).unwrap_or(false) {
        std::fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
    }
    api::extract_audio_info(url, app_data_dir)
        .await
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![extract_audio,])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
