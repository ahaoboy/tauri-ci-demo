import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";

export type Audio = {
  id: string;
  title: string;
  download_url: string;
  local_url?: string;
  author: string[];
  cover?: string;
  tags: string[];
  duration?: number;
  platform: string;
  date: number;
};

export type LocalAudio = {
  audio: Audio;
  path: string;
  cover_path: string
}

export type Config = {
  audios: LocalAudio[];
}

export function extract_audios(url: string): Promise<Audio[]> {
  return invoke("extract_audios", { url })
}

export async function download_audio_and_update_config(audio: Audio): Promise<LocalAudio[]> {
  try {
    console.log('🔄 Starting download for:', audio.title);
    const result = await invoke("download_audio", { audio });
    console.log('📦 Raw download result:', result);

    // Handle both single object and array responses
    let localAudios: LocalAudio[];
    if (Array.isArray(result)) {
      localAudios = result;
    } else if (result && typeof result === 'object') {
      // Backend returned a single LocalAudio object
      localAudios = [result as LocalAudio];
    } else {
      localAudios = [];
    }

    console.log('📦 Processed local audios:', localAudios);

    if (localAudios.length > 0) {
      console.log('✅ Download successful, updating config...');
      // Update config with new audio
      const config = await get_config();
      const updatedAudios = [...config.audios];

      // Add new audios if they don't already exist
      for (const localAudio of localAudios) {
        const exists = updatedAudios.find(existing => existing.audio.id === localAudio.audio.id);
        if (!exists) {
          updatedAudios.push(localAudio);
          console.log('➕ Added to config:', localAudio.audio.title);
        } else {
          console.log('⚠️ Audio already exists in config:', localAudio.audio.title);
        }
      }

      await save_config({ audios: updatedAudios });
      console.log('💾 Config updated successfully');
    } else {
      console.warn('⚠️ No local audios processed');
    }

    console.log('📦 Returning result:', localAudios);
    return localAudios;
  } catch (error) {
    console.error('❌ Download failed:', error);
    throw error;
  }
}

export async function download_audio(audio: Audio): Promise<LocalAudio[]> {
  const result = await invoke("download_audio", { audio });

  // Handle both single object and array responses
  if (Array.isArray(result)) {
    return result;
  } else if (result && typeof result === 'object') {
    // Backend returned a single LocalAudio object
    return [result as LocalAudio];
  } else {
    return [];
  }
}

export function app_dir(): Promise<string> {
  return invoke("app_dir");
}

export function download_cover(audio: Audio): Promise<string | null> {
  return invoke("download_cover", { audio });
}

export async function get_loacl_url(path: string): Promise<string> {
  const appDataDirPath: string = await invoke("app_dir");
  const localPath = await join(appDataDirPath, path);
  const assetUrl = convertFileSrc(localPath);
  return assetUrl
}

export function get_config(): Promise<Config> {
  return invoke("get_config").then((result: any) => {
    console.log('📦 Raw config result:', result);

    // Handle Rust Result type (Ok/Err)
    let config: any;
    if (result && typeof result === 'object') {
      if ('Ok' in result) {
        config = result.Ok;
        console.log('✅ Config loaded successfully:', config);
      } else if ('Err' in result) {
        console.error('❌ Config error:', result.Err);
        return { audios: [] };
      } else {
        // Direct config object
        config = result;
      }
    } else {
      console.warn('⚠️ Invalid config result, using default');
      return { audios: [] };
    }

    // Ensure config has audios array
    if (!config || typeof config !== 'object') {
      console.warn('⚠️ Invalid config object, using default');
      return { audios: [] };
    }
    if (!Array.isArray(config.audios)) {
      console.warn('⚠️ Config missing audios array, initializing');
      return { ...config, audios: [] };
    }

    return config as Config;
  }).catch(error => {
    console.error('❌ Failed to get config:', error);
    return { audios: [] };
  });
}

export function save_config(config: Config): Promise<Config> {
  return invoke("save_config", { config }).then((result: any) => {
    console.log('📦 Raw save config result:', result);

    // Handle Rust Result type (Ok/Err)
    if (result && typeof result === 'object') {
      if ('Ok' in result) {
        console.log('✅ Config saved successfully');
        return config; // save_config returns (), so return the original config
      } else if ('Err' in result) {
        console.error('❌ Save config error:', result.Err);
        throw new Error(result.Err);
      }
    }

    // Fallback: return the original config
    return config;
  }).catch(error => {
    console.error('❌ Failed to save config:', error);
    throw error;
  });
}


// Get all downloaded local audios
export async function get_local_audios(): Promise<LocalAudio[]> {
  try {
    console.log('📂 Loading local audios from config...');
    const config = await get_config();
    console.log('📂 Config loaded:', config);
    console.log('📂 Found', config.audios?.length || 0, 'local audios');
    return config.audios || [];
  } catch (error) {
    console.error('❌ Failed to load local audios:', error);
    return [];
  }
}

// Delete a local audio file and update config
export async function delete_local_audio(audioId: string): Promise<boolean> {
  const success = await invoke<boolean>("delete_local_audio", { audioId });

  if (success) {
    // Update config by removing the deleted audio
    const config = await get_config();
    const updatedAudios = config.audios.filter(audio => audio.audio.id !== audioId);
    await save_config({ audios: updatedAudios });
  }

  return success;
}