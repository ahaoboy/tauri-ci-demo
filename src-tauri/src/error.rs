use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Download error: {0}")]
    Download(String),

    #[error("Network error: {0}")]
    Network(String),

    #[error("Config error: {0}")]
    Config(String),

    #[error("File not found: {0}")]
    NotFound(String),

    #[error("Invalid URL: {0}")]
    InvalidUrl(String),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("Playlist not found: {0}")]
    PlaylistNotFound(String),

    #[error("Audio not found: {0}")]
    AudioNotFound(String),

    #[error("Invalid audio format: {0}")]
    InvalidFormat(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Storage quota exceeded")]
    StorageQuotaExceeded,

    #[error("Operation cancelled")]
    Cancelled,

    #[error("Unknown error: {0}")]
    Unknown(String),
}

pub type Result<T> = std::result::Result<T, AppError>;

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        if err.is_timeout() {
            AppError::Network("Request timeout".to_string())
        } else if err.is_connect() {
            AppError::Network("Connection failed".to_string())
        } else {
            AppError::Network(err.to_string())
        }
    }
}

impl From<md5::Error> for AppError {
    fn from(err: md5::Error) -> Self {
        AppError::Unknown(format!("MD5 error: {}", err))
    }
}

pub trait IntoAppError<T> {
    fn into_app_error(self, message: impl Into<String>) -> Result<T>;
}

impl<T, E> IntoAppError<T> for std::result::Result<T, E>
where
    E: std::error::Error + Send + Sync + 'static,
{
    fn into_app_error(self, message: impl Into<String>) -> Result<T> {
        self.map_err(|e| AppError::Unknown(format!("{}: {}", message.into(), e)))
    }
}
