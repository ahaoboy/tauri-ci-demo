import { useState, useRef, useEffect, useCallback } from 'react';
import { LocalAudio } from '../types';
import { get_loacl_url } from '../api';

export interface AudioPlayerState {
  isPlaying: boolean;
  currentAudio: LocalAudio | null;
  currentTime: number;
  duration: number;
  volume: number;
  isLooping: boolean;
  playlist: LocalAudio[];
  currentIndex: number;
}

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentAudio: null,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isLooping: false,
    playlist: [],
    currentIndex: -1,
  });

  const updateCurrentTime = useCallback(() => {
    if (audioRef.current) {
      setState(prev => ({
        ...prev,
        currentTime: audioRef.current?.currentTime || 0,
        duration: audioRef.current?.duration || 0,
      }));
    }
  }, []);

  const play = useCallback(async (audio: LocalAudio, playlist: LocalAudio[] = []) => {
    try {
      const url = await get_loacl_url(audio.path);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.volume = state.volume;
        await audioRef.current.play();

        const currentIndex = playlist.findIndex(item => item.audio.id === audio.audio.id);
        setState(prev => ({
          ...prev,
          isPlaying: true,
          currentAudio: audio,
          playlist: playlist.length > 0 ? playlist : [audio],
          currentIndex: currentIndex >= 0 ? currentIndex : 0,
        }));
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }, [state.volume]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setState(prev => ({ ...prev, volume }));
    }
  }, []);

  const toggleLoop = useCallback(() => {
    setState(prev => ({ ...prev, isLooping: !prev.isLooping }));
  }, []);

  const playNext = useCallback(async () => {
    const { playlist, currentIndex } = state;
    if (playlist.length > 0) {
      const nextIndex = (currentIndex + 1) % playlist.length;
      await play(playlist[nextIndex], playlist);
    }
  }, [state, play]);

  const playPrevious = useCallback(async () => {
    const { playlist, currentIndex } = state;
    if (playlist.length > 0) {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
      await play(playlist[prevIndex], playlist);
    }
  }, [state, play]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => updateCurrentTime();
    const handleLoadedMetadata = () => updateCurrentTime();
    const handleEnded = () => {
      if (state.isLooping) {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNext();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [updateCurrentTime, state.isLooping, playNext]);

  return {
    audioRef,
    state,
    play,
    pause,
    stop,
    seekTo,
    setVolume,
    toggleLoop,
    playNext,
    playPrevious,
  };
};