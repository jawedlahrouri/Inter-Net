import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
export type { UserSettings, VideoInfo, DashboardPageInfo } from '@/services/api';
import {
  type UserSettings,
  type VideoInfo,
  type DashboardPageInfo,
  fetchUserSettings,
  updateUserSettingsApi,
  fetchCustomVideos,
  uploadCustomVideoApi,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const SETTINGS_STORAGE_KEY = 'dashboard_user_settings';
const ACTIVE_DASHBOARD_STORAGE_KEY = 'dashboard_active_page_id';

const DEFAULT_SETTINGS: UserSettings = {
  meditation: {
    video_enabled: true,
    video_url: '/custom_vids/la_peace.mp4',
    sound_enabled: false,
  },
  dashboards: [{ id: 'default', name: 'Général' }],
};

interface SettingsContextType {
  settings: UserSettings;
  loading: boolean;
  availableVideos: VideoInfo[];
  dashboards: DashboardPageInfo[];
  activeDashboardId: string;
  setActiveDashboardId: (id: string) => void;
  createDashboard: (name: string) => Promise<string>;
  renameDashboard: (id: string, newName: string) => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
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
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          dashboards: parsed.dashboards?.length ? parsed.dashboards : DEFAULT_SETTINGS.dashboards,
        };
      }
    } catch {
      // ignore json parse error
    }
    return DEFAULT_SETTINGS;
  });

  const [activeDashboardId, setActiveDashboardIdState] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageFromUrl = urlParams.get('page');
    if (pageFromUrl) return pageFromUrl;
    return localStorage.getItem(ACTIVE_DASHBOARD_STORAGE_KEY) || 'default';
  });

  const setActiveDashboardId = useCallback((id: string) => {
    setActiveDashboardIdState(id);
    localStorage.setItem(ACTIVE_DASHBOARD_STORAGE_KEY, id);
  }, []);

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
        if (isMounted && serverSettings) {
          const merged: UserSettings = {
            ...serverSettings,
            dashboards: serverSettings.dashboards?.length
              ? serverSettings.dashboards
              : (settings.dashboards?.length ? settings.dashboards : DEFAULT_SETTINGS.dashboards),
          };
          setSettings(merged);
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
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

  const dashboards = settings.dashboards && settings.dashboards.length > 0
    ? settings.dashboards
    : [{ id: 'default', name: 'Général' }];

  const saveDashboards = async (newDashboards: DashboardPageInfo[]) => {
    const newSettings: UserSettings = {
      ...settings,
      dashboards: newDashboards,
    };
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));

    if (user) {
      try {
        await updateUserSettingsApi({ dashboards: newDashboards });
      } catch (err) {
        console.error('Erreur lors de la sauvegarde des dashboards côté serveur:', err);
      }
    }
  };

  const createDashboard = async (name: string): Promise<string> => {
    const trimmed = name.trim();
    if (!trimmed) return activeDashboardId;
    const newId = `dash-${Date.now()}`;
    const newDashboards = [...dashboards, { id: newId, name: trimmed }];
    await saveDashboards(newDashboards);
    setActiveDashboardId(newId);
    return newId;
  };

  const renameDashboard = async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const newDashboards = dashboards.map((d) => (d.id === id ? { ...d, name: trimmed } : d));
    await saveDashboards(newDashboards);
  };

  const deleteDashboard = async (id: string) => {
    if (dashboards.length <= 1) return;
    const newDashboards = dashboards.filter((d) => d.id !== id);
    await saveDashboards(newDashboards);
    if (activeDashboardId === id) {
      setActiveDashboardId(newDashboards[0]?.id || 'default');
    }
  };

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
        dashboards,
        activeDashboardId,
        setActiveDashboardId,
        createDashboard,
        renameDashboard,
        deleteDashboard,
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
