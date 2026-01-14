use musicfree::Audio;

pub async fn download(url: &str) -> anyhow::Result<Audio> {
    let audio = musicfree::download_audio(url).await?;
    Ok(audio)
}
