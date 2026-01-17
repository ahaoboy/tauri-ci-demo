import { useState, useEffect } from 'react';
import { LocalAudio } from '../types';
import { get_local_audios, delete_local_audio } from '../api';

export const useLocalAudios = () => {
  const [localAudios, setLocalAudios] = useState<LocalAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const loadLocalAudios = async () => {
    try {
      console.log('🔄 Loading local audios...');
      setLoading(true);
      const audios = await get_local_audios();
      console.log('✅ Loaded', audios.length, 'local audios:', audios);
      setLocalAudios(audios);
      setError('');
    } catch (err) {
      console.error('❌ Error loading local audios:', err);
      setError(err instanceof Error ? err.message : 'Failed to load local audios');
    } finally {
      setLoading(false);
    }
  };

  const addLocalAudio = async (_audio: LocalAudio) => {
    // Since we're now updating config in the API, we should reload the list
    await loadLocalAudios();
  };

  const removeLocalAudio = async (audioId: string) => {
    try {
      const success = await delete_local_audio(audioId);
      if (success) {
        // The config is already updated in the API, so just reload
        await loadLocalAudios();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete audio');
      return false;
    }
  };

  useEffect(() => {
    loadLocalAudios();
  }, []);

  return {
    localAudios,
    loading,
    error,
    loadLocalAudios,
    addLocalAudio,
    removeLocalAudio,
  };
};