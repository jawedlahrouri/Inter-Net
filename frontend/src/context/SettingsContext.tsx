import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
export type { UserSettings, VideoInfo, DashboardPageInfo, ThemeCustomization, BackgroundInfo } from '@/services/api';
import {
  type UserSettings,
  type VideoInfo,
  type DashboardPageInfo,
  type ThemeCustomization,
  type BackgroundInfo,
  fetchUserSettings,
  updateUserSettingsApi,
  fetchCustomVideos,
  uploadCustomVideoApi,
  fetchCustomBackgrounds,
  uploadCustomBackgroundApi,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const SETTINGS_STORAGE_KEY = 'dashboard_user_settings';
const ACTIVE_DASHBOARD_STORAGE_KEY = 'dashboard_active_page_id';

export const DEFAULT_CUSTOMIZATION: ThemeCustomization = {
  primary_color: '#0b0f19',
  secondary_color: '#131b2e',
  tertiary_color: '#38bdf8',
  background_image: null,
};

const DEFAULT_SETTINGS: UserSettings = {
  meditation: {
    video_enabled: true,
    video_url: '/custom_vids/la_peace.mp4',
    sound_enabled: false,
  },
  dashboards: [{ id: 'default', name: 'Général' }],
  customization: DEFAULT_CUSTOMIZATION,
};

interface SettingsContextType {
  settings: UserSettings;
  loading: boolean;
  availableVideos: VideoInfo[];
  availableBackgrounds: BackgroundInfo[];
  dashboards: DashboardPageInfo[];
  activeDashboardId: string;
  customization: ThemeCustomization;
  setActiveDashboardId: (id: string) => void;
  createDashboard: (name: string) => Promise<string>;
  renameDashboard: (id: string, newName: string) => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
  refreshVideos: () => Promise<void>;
  refreshBackgrounds: () => Promise<void>;
  updateMeditationSettings: (updates: Partial<UserSettings['meditation']>) => Promise<void>;
  updateCustomization: (updates: Partial<ThemeCustomization>) => Promise<void>;
  removeBackgroundImage: () => Promise<void>;
  uploadVideo: (file: File) => Promise<VideoInfo>;
  uploadBackground: (file: File) => Promise<BackgroundInfo>;
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
          customization: {
            ...DEFAULT_CUSTOMIZATION,
            ...(parsed.customization || {}),
          },
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
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundInfo[]>([]);

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

  const refreshBackgrounds = useCallback(async () => {
    try {
      const bgs = await fetchCustomBackgrounds();
      if (bgs) {
        setAvailableBackgrounds(bgs);
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    refreshVideos();
    refreshBackgrounds();
  }, [refreshVideos, refreshBackgrounds]);

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
            customization: {
              ...DEFAULT_CUSTOMIZATION,
              ...(settings.customization || {}),
              ...(serverSettings.customization || {}),
            },
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

  const updateCustomization = async (updates: Partial<ThemeCustomization>) => {
    const currentCustom = settings.customization || DEFAULT_CUSTOMIZATION;
    const newCustom: ThemeCustomization = {
      ...currentCustom,
      ...updates,
    };
    const newSettings: UserSettings = {
      ...settings,
      customization: newCustom,
    };
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));

    if (user) {
      try {
        await updateUserSettingsApi({ customization: updates });
      } catch (err) {
        console.error('Erreur lors de la sauvegarde du thème côté serveur:', err);
      }
    }
  };

  const removeBackgroundImage = async () => {
    await updateCustomization({ background_image: null });
  };

  const uploadVideo = async (file: File): Promise<VideoInfo> => {
    const uploaded = await uploadCustomVideoApi(file);
    await refreshVideos();
    return uploaded;
  };

  const uploadBackground = async (file: File): Promise<BackgroundInfo> => {
    const uploaded = await uploadCustomBackgroundApi(file);
    await refreshBackgrounds();
    await updateCustomization({ background_image: uploaded.url });
    return uploaded;
  };

  const customization = settings.customization || DEFAULT_CUSTOMIZATION;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        availableVideos,
        availableBackgrounds,
        dashboards,
        activeDashboardId,
        customization,
        setActiveDashboardId,
        createDashboard,
        renameDashboard,
        deleteDashboard,
        refreshVideos,
        refreshBackgrounds,
        updateMeditationSettings,
        updateCustomization,
        removeBackgroundImage,
        uploadVideo,
        uploadBackground,
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
