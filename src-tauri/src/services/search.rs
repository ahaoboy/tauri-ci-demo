use crate::models::audio::LocalAudio;
use crate::error::Result;

#[derive(Debug, Clone)]
pub struct SearchQuery {
    pub keyword: Option<String>,
    pub artist: Option<String>,
    pub title: Option<String>,
    pub tags: Option<Vec<String>>,
    pub platform: Option<String>,
    pub min_duration: Option<u64>,
    pub max_duration: Option<u64>,
}

#[derive(Debug, Clone)]
pub struct SearchResult {
    pub audios: Vec<LocalAudio>,
    pub total_count: usize,
}

pub struct SearchService;

impl SearchService {
    pub fn search(&self, audios: &[LocalAudio], query: &SearchQuery) -> SearchResult {
        let results = audios
            .iter()
            .filter(|audio| self.matches(audio, query))
            .cloned()
            .collect();

        SearchResult {
            total_count: results.len(),
            audios: results,
        }
    }

    fn matches(&self, audio: &LocalAudio, query: &SearchQuery) -> bool {
        if let Some(keyword) = &query.keyword {
            let keyword_lower = keyword.to_lowercase();
            let title_matches = audio.audio.title.to_lowercase().contains(&keyword_lower);
            let artist_matches = audio.audio.author.iter()
                .any(|a| a.to_lowercase().contains(&keyword_lower));
            let tags_matches = audio.audio.tags.iter()
                .any(|t| t.to_lowercase().contains(&keyword_lower));
            
            if !title_matches && !artist_matches && !tags_matches {
                return false;
            }
        }

        if let Some(artist) = &query.artist {
            let artist_lower = artist.to_lowercase();
            if !audio.audio.author.iter().any(|a| a.to_lowercase().contains(&artist_lower)) {
                return false;
            }
        }

        if let Some(title) = &query.title {
            let title_lower = title.to_lowercase();
            if !audio.audio.title.to_lowercase().contains(&title_lower) {
                return false;
            }
        }

        if let Some(tags) = &query.tags {
            let tag_set: std::collections::HashSet<_> = tags.iter().map(|t| t.to_lowercase()).collect();
            if !audio.audio.tags.iter()
                .any(|t| tag_set.contains(&t.to_lowercase())) {
                return false;
            }
        }

        if let Some(platform) = &query.platform {
            if audio.audio.platform != *platform {
                return false;
            }
        }

        if let Some(min_duration) = query.min_duration {
            if let Some(duration) = audio.audio.duration {
                if duration < min_duration {
                    return false;
                }
            } else {
                return false;
            }
        }

        if let Some(max_duration) = query.max_duration {
            if let Some(duration) = audio.audio.duration {
                if duration > max_duration {
                    return false;
                }
            } else {
                return false;
            }
        }

        true
    }

    pub fn suggest(&self, audios: &[LocalAudio], keyword: &str, limit: usize) -> Vec<String> {
        let keyword_lower = keyword.to_lowercase();
        
        let mut suggestions: Vec<_> = audios
            .iter()
            .flat_map(|audio| {
                let mut results = Vec::new();
                
                if audio.audio.title.to_lowercase().starts_with(&keyword_lower) {
                    results.push(audio.audio.title.clone());
                }
                
                for artist in &audio.audio.author {
                    if artist.to_lowercase().starts_with(&keyword_lower) {
                        results.push(artist.clone());
                    }
                }
                
                for tag in &audio.audio.tags {
                    if tag.to_lowercase().starts_with(&keyword_lower) {
                        results.push(format!("#{}", tag));
                    }
                }
                
                results
            })
            .collect();
        
        suggestions.sort();
        suggestions.dedup();
        suggestions.truncate(limit);
        
        suggestions
    }
}
