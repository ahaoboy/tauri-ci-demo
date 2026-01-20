pub mod api;
pub mod core;
pub mod cmd;
pub mod error;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init());

    // Only include these plugins on desktop platforms
    // #[cfg(not(any(target_os = "android", target_os = "ios")))]
    // let builder = builder
    //     .plugin(tauri_plugin_updater::Builder::new().build())
    //     .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}));

    // #[cfg(target_os = "windows")]
    // let builder = builder
    //     .plugin(tauri_plugin_media::init());

    builder
        .invoke_handler(tauri::generate_handler![
            cmd::extract_audios,
            cmd::app_dir,
            cmd::read_file,
            cmd::download_audio,
            cmd::download_cover,
            cmd::get_config,
            cmd::save_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
