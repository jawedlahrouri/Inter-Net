import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  type UserSettings,
  type VideoInfo,
  fetchUserSettings,
  updateUserSettingsApi,
  fetchCustomVideos,
  uploadCustomVideoApi,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const SETTINGS_STORAGE_KEY = 'dashboard_user_settings';

const DEFAULT_SETTINGS: UserSettings = {
  meditation: {
    video_enabled: true,
    video_url: '/custom_vids/la_peace.mp4',
    sound_enabled: false,
  },
};

interface SettingsContextType {
  settings: UserSettings;
  loading: boolean;
  availableVideos: VideoInfo[];
  refreshVideos: () => Promise<void>;
  updateMeditationSettings: (updates: Partial<UserSettings['meditation']>) => Promise<void>;
  uploadVideo: (file: File) => Promise<VideoInfo>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // ignore json parse error
    }
    return DEFAULT_SETTINGS;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [availableVideos, setAvailableVideos] = useState<VideoInfo[]>([
    {
      id: 'la_peace.mp4',
      name: 'La Peace',
      filename: 'la_peace.mp4',
      url: '/custom_vids/la_peace.mp4',
      size: 1465991,
    },
  ]);

  const refreshVideos = useCallback(async () => {
    try {
      const vids = await fetchCustomVideos();
      if (vids && vids.length > 0) {
        setAvailableVideos(vids);
      }
    } catch {
      // Fallback stays active
    }
  }, []);

  useEffect(() => {
    refreshVideos();
  }, [refreshVideos]);

  // Synchronise les réglages avec le compte connecté
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    async function syncSettings() {
      try {
        setLoading(true);
        const serverSettings = await fetchUserSettings();
        if (isMounted && serverSettings?.meditation) {
          setSettings(serverSettings);
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(serverSettings));
        }
      } catch {
        // En cas d'échec, les réglages locaux restent prioritaires
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    syncSettings();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const updateMeditationSettings = async (updates: Partial<UserSettings['meditation']>) => {
    const newSettings: UserSettings = {
      ...settings,
      meditation: {
        ...settings.meditation,
        ...updates,
      },
    };
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));

    if (user) {
      try {
        await updateUserSettingsApi({ meditation: updates });
      } catch (err) {
        console.error('Erreur lors de la sauvegarde des paramètres côté serveur:', err);
      }
    }
  };

  const uploadVideo = async (file: File): Promise<VideoInfo> => {
    const uploaded = await uploadCustomVideoApi(file);
    await refreshVideos();
    return uploaded;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        availableVideos,
        refreshVideos,
        updateMeditationSettings,
        uploadVideo,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings doit être utilisé au sein d\'un SettingsProvider');
  }
  return ctx;
}
