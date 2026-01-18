use crate::error::Result;
use crate::models::playlist::LocalPlaylist;
use crate::models::audio::LocalAudio;

pub struct PlaylistManager;

impl PlaylistManager {
    pub fn create_playlist(&self, name: &str, platform: &str) -> Result<LocalPlaylist> {
        log::info!("Creating playlist: {}", name);
        Ok(LocalPlaylist::new(name.to_string(), platform.to_string()))
    }

    pub fn rename_playlist(playlist: &mut LocalPlaylist, new_name: String) {
        log::info!("Renaming playlist {} to {}", playlist.name, new_name);
        playlist.name = new_name;
        playlist.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
    }

    pub fn add_audio_to_playlist(playlist: &mut LocalPlaylist, audio: LocalAudio) -> Result<()> {
        log::info!("Adding audio {} to playlist {}", audio.audio.title, playlist.name);
        
        if playlist.audios.iter().any(|a| a.audio.id == audio.audio.id) {
            log::warn!("Audio already exists in playlist");
            return Ok(());
        }
        
        playlist.add_audio(audio);
        Ok(())
    }

    pub fn remove_audio_from_playlist(playlist: &mut LocalPlaylist, audio_id: &str) -> Result<bool> {
        log::info!("Removing audio {} from playlist {}", audio_id, playlist.name);
        Ok(playlist.remove_audio(audio_id))
    }

    pub fn reorder_playlist(
        playlist: &mut LocalPlaylist,
        audio_id: &str,
        new_position: usize,
    ) -> Result<()> {
        let current_index = playlist
            .audios
            .iter()
            .position(|a| a.audio.id == audio_id)
            .ok_or_else(|| crate::error::AppError::AudioNotFound(audio_id.to_string()))?;

        if current_index == new_position {
            return Ok(());
        }

        let audio = playlist.audios.remove(current_index);
        let actual_position = new_position.min(playlist.audios.len());
        playlist.audios.insert(actual_position, audio);
        
        playlist.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        log::info!("Reordered audio {} to position {}", audio_id, actual_position);
        Ok(())
    }

    pub fn duplicate_playlist(&self, playlist: &LocalPlaylist) -> Result<LocalPlaylist> {
        log::info!("Duplicating playlist: {}", playlist.name);
        
        let mut new_playlist = LocalPlaylist::new(
            format!("{} (Copy)", playlist.name),
            playlist.platform.clone(),
        );
        
        new_playlist.description = playlist.description.clone();
        new_playlist.cover = playlist.cover.clone();
        new_playlist.audios = playlist.audios.clone();
        new_playlist.cover_path = playlist.cover_path.clone();
        
        Ok(new_playlist)
    }

    pub fn merge_playlists(
        self: &PlaylistManager,
        target: &mut LocalPlaylist,
        source: &LocalPlaylist,
    ) -> Result<()> {
        log::info!("Merging playlist {} into {}", source.name, target.name);
        
        for audio in &source.audios {
            if !target.audios.iter().any(|a| a.audio.id == audio.audio.id) {
                target.audios.push(audio.clone());
            }
        }
        
        target.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        Ok(())
    }

    pub fn shuffle_playlist(playlist: &mut LocalPlaylist) {
        log::info!("Shuffling playlist: {}", playlist.name);
        use rand::seq::SliceRandom;
        playlist.audios.shuffle(&mut rand::thread_rng());
        
        playlist.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
    }
}
