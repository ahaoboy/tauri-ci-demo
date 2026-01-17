use std::path::PathBuf;

use musicfree::Audio;
use tokio::fs;

use crate::LocalAudio;

const ASSETS_DIR: &str = "assets";

pub async fn download_audio(audio: &mut Audio, app_dir: PathBuf) -> anyhow::Result<LocalAudio> {
    let assets_dir = app_dir
        .join(ASSETS_DIR)
        .join(format!("{:?}", audio.platform));

    if !assets_dir.exists() {
        fs::create_dir_all(&assets_dir).await?;
    }
    audio.platform.extractor().download(audio).await?;
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
    if let Some(bin) = &audio.binary
        && !file_path.exists()
    {
        fs::write(&file_path, bin).await?;
    }
    Ok(LocalAudio {
        path: format!("{}/{}", ASSETS_DIR, filename),
        audio: audio.clone(),
    })
}
