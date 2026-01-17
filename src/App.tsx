import { useEffect } from 'react';
import { BottomNavigation, DownloadPage } from './components';
import { PlayerPage } from './pages';
import { useAppStore, useActiveTab, useLocalAudios, usePlayback } from './store';
import './App.css';

function App() {
  const activeTab = useActiveTab();
  const { audios: localAudios, loading, error } = useLocalAudios();
  const playback = usePlayback();

  const {
    setActiveTab,
    playAudio,
    pauseAudio,
    seekTo,
    setVolume,
    toggleLoop,
    playNext,
    playPrevious,
    updatePlaybackTime,
    removeLocalAudio,
  } = useAppStore();

  // Load local audios on app start - use getState to avoid dependency issues
  useEffect(() => {
    useAppStore.getState().loadLocalAudios();
  }, []);

  // Setup audio element event listeners
  useEffect(() => {
    const audioElement = document.querySelector('audio') as HTMLAudioElement;
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      updatePlaybackTime(audioElement.currentTime, audioElement.duration || 0);
    };

    const handleLoadedMetadata = () => {
      updatePlaybackTime(audioElement.currentTime, audioElement.duration || 0);
    };

    const handleEnded = () => {
      if (playback.isLooping) {
        audioElement.currentTime = 0;
        audioElement.play();
      } else {
        playNext();
      }
    };

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [playback.isLooping, playNext, updatePlaybackTime]);

  const handleDeleteAudio = async (audioId: string) => {
    await removeLocalAudio(audioId);
  };

  const handlePlay = (audio: any, playlist: any[]) => {
    playAudio(audio, playlist);
  };

  const handleRefresh = () => {
    useAppStore.getState().loadLocalAudios();
  };

  return (
    <div className="app">
      {/* Hidden audio element for playback */}
      <audio />

      <main className="main-content">
        {activeTab === 'player' ? (
          <PlayerPage
            localAudios={localAudios}
            loading={loading}
            error={error}
            onRefresh={handleRefresh}
            currentAudio={playback.currentAudio}
            isPlaying={playback.isPlaying}
            currentTime={playback.currentTime}
            duration={playback.duration}
            volume={playback.volume}
            isLooping={playback.isLooping}
            onPlay={handlePlay}
            onPause={pauseAudio}
            onSeek={seekTo}
            onVolumeChange={setVolume}
            onToggleLoop={toggleLoop}
            onNext={playNext}
            onPrevious={playPrevious}
            onDelete={handleDeleteAudio}
          />
        ) : (
          <DownloadPage />
        )}
      </main>

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}

export default App;