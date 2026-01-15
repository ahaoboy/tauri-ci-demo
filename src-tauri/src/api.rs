use std::path::PathBuf;

use tokio::fs;

use crate::LocalAudio;

const ASSETS_DIR: &str = "assets";

pub async fn extract_audio_info(url: &str, app_dir: PathBuf) -> anyhow::Result<Vec<LocalAudio>> {
    let assets_dir = app_dir.join(ASSETS_DIR);
    if !assets_dir.exists() {
        fs::create_dir_all(&assets_dir).await?;
    }
    let audios = musicfree::extract(url).await?;
    let mut v = Vec::with_capacity(audios.len());
    for audio in audios {
        let id = format!("{:x}", md5::compute(&audio.download_url));
        let filename = format!(
            "{}{}",
            id,
            audio
                .format
                .clone()
                .unwrap_or(musicfree::core::AudioFormat::Mp3)
                .extension()
        );
        let file_path = assets_dir.join(&filename);
        if file_path.exists() {
            continue;
        }
        if let Some(bin) = &audio.binary {
            fs::write(&file_path, bin).await?;
        }

        v.push(LocalAudio {
            id,
            path: format!("{}/{}", ASSETS_DIR, filename),
            audio,
        });
    }
    Ok(v)
}
