import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
export type { UserSettings, VideoInfo, DashboardPageInfo, ThemeCustomization, BackgroundInfo, MusicInfo } from '@/services/api';
import {
  type UserSettings,
  type VideoInfo,
  type DashboardPageInfo,
  type ThemeCustomization,
  type BackgroundInfo,
  type MusicInfo,
  fetchUserSettings,
  updateUserSettingsApi,
  fetchCustomVideos,
  uploadCustomVideoApi,
  fetchCustomBackgrounds,
  uploadCustomBackgroundApi,
  fetchCustomMusic,
  uploadCustomMusicApi,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const SETTINGS_STORAGE_KEY = 'dashboard_user_settings';
const ACTIVE_DASHBOARD_STORAGE_KEY = 'dashboard_active_page_id';
const BRAINROT_MODE_STORAGE_KEY = 'brainrot_mode';

export const DEFAULT_CUSTOMIZATION: ThemeCustomization = {
  primary_color: '#0b0f19',
  secondary_color: '#131b2e',
  tertiary_color: '#38bdf8',
  background_image: null,
  background_music: null,
  background_music_name: null,
};

const DEFAULT_SETTINGS: UserSettings = {
  meditation: {
    video_enabled: true,
    video_url: '/custom_vids/la_peace.mp4',
    sound_enabled: false,
  },
  dashboards: [
    {
      id: 'default',
      name: 'Général',
      primary_color: DEFAULT_CUSTOMIZATION.primary_color,
      secondary_color: DEFAULT_CUSTOMIZATION.secondary_color,
      tertiary_color: DEFAULT_CUSTOMIZATION.tertiary_color,
      background_image: null,
      background_music: null,
      background_music_name: null,
    },
  ],
  customization: DEFAULT_CUSTOMIZATION,
};

interface SettingsContextType {
  settings: UserSettings;
  loading: boolean;
  availableVideos: VideoInfo[];
  availableBackgrounds: BackgroundInfo[];
  availableMusic: MusicInfo[];
  dashboards: DashboardPageInfo[];
  activeDashboardId: string;
  activeDashboard: DashboardPageInfo;
  customization: ThemeCustomization;
  brainrotMode: boolean;
  setBrainrotMode: (enabled: boolean) => void;
  setActiveDashboardId: (id: string) => void;
  createDashboard: (name: string) => Promise<string>;
  renameDashboard: (id: string, newName: string) => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
  refreshVideos: () => Promise<void>;
  refreshBackgrounds: () => Promise<void>;
  refreshMusic: () => Promise<void>;
  updateMeditationSettings: (updates: Partial<UserSettings['meditation']>) => Promise<void>;
  updateCustomization: (updates: Partial<ThemeCustomization>) => Promise<void>;
  updateDashboardCustomization: (dashboardId: string, updates: Partial<ThemeCustomization>) => Promise<void>;
  removeBackgroundImage: () => Promise<void>;
  removeDashboardBackgroundImage: (dashboardId: string) => Promise<void>;
  removeDashboardBackgroundMusic: (dashboardId: string) => Promise<void>;
  uploadVideo: (file: File) => Promise<VideoInfo>;
  uploadBackground: (file: File) => Promise<BackgroundInfo>;
  uploadBackgroundForDashboard: (dashboardId: string, file: File) => Promise<BackgroundInfo>;
  uploadMusicForDashboard: (dashboardId: string, file: File) => Promise<MusicInfo>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * @brief Provides user settings, dashboard pages and customization state (with localStorage and server sync) to its descendants.
 * @param children React nodes rendered inside the settings context provider.
 * @return A SettingsContext provider element exposing settings, dashboards, uploads and update actions around the children.
 */
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

  const [brainrotMode, setBrainrotModeState] = useState<boolean>(
    () => localStorage.getItem(BRAINROT_MODE_STORAGE_KEY) === 'true'
  );

  const setBrainrotMode = useCallback((enabled: boolean) => {
    setBrainrotModeState(enabled);
    localStorage.setItem(BRAINROT_MODE_STORAGE_KEY, String(enabled));
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
  const [availableMusic, setAvailableMusic] = useState<MusicInfo[]>([]);

  const refreshVideos = useCallback(async () => {
    try {
      const vids = await fetchCustomVideos();
      if (vids && vids.length > 0) {
        setAvailableVideos(vids);
      }
    } catch {
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

  const refreshMusic = useCallback(async () => {
    try {
      const musics = await fetchCustomMusic();
      if (musics) {
        setAvailableMusic(musics);
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    refreshVideos();
    refreshBackgrounds();
    refreshMusic();
  }, [refreshVideos, refreshBackgrounds, refreshMusic]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    /**
     * @brief Fetches the user's settings from the server and merges them with local settings and defaults, then persists the result.
     */
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
    : DEFAULT_SETTINGS.dashboards!;

  /**
   * @brief Stores the given dashboards list in state and localStorage and pushes it to the server when a user is logged in.
   * @param newDashboards The complete updated list of dashboard pages to save.
   */
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

  /**
   * @brief Creates a new dashboard page with default colors, saves it and makes it the active dashboard.
   * @param name The display name for the new dashboard, which is trimmed before use.
   * @return A promise resolving to the id of the new dashboard, or the current active id when the name is empty.
   */
  const createDashboard = async (name: string): Promise<string> => {
    const trimmed = name.trim();
    if (!trimmed) return activeDashboardId;
    const newId = `dash-${Date.now()}`;
    const newDashboards = [
      ...dashboards,
      {
        id: newId,
        name: trimmed,
        primary_color: DEFAULT_CUSTOMIZATION.primary_color,
        secondary_color: DEFAULT_CUSTOMIZATION.secondary_color,
        tertiary_color: DEFAULT_CUSTOMIZATION.tertiary_color,
        background_image: null,
        background_music: null,
        background_music_name: null,
      },
    ];
    await saveDashboards(newDashboards);
    setActiveDashboardId(newId);
    return newId;
  };

  /**
   * @brief Renames the dashboard with the given id and saves the updated list.
   * @param id The id of the dashboard to rename.
   * @param newName The new dashboard name, ignored if empty after trimming.
   */
  const renameDashboard = async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const newDashboards = dashboards.map((d) => (d.id === id ? { ...d, name: trimmed } : d));
    await saveDashboards(newDashboards);
  };

  /**
   * @brief Removes a dashboard (never the last one) and switches the active dashboard if the deleted one was active.
   * @param id The id of the dashboard to delete.
   */
  const deleteDashboard = async (id: string) => {
    if (dashboards.length <= 1) return;
    const newDashboards = dashboards.filter((d) => d.id !== id);
    await saveDashboards(newDashboards);
    if (activeDashboardId === id) {
      setActiveDashboardId(newDashboards[0]?.id || 'default');
    }
  };

  /**
   * @brief Applies the defined theme fields (colors, background image, music) to one dashboard and saves the list.
   * @param dashboardId The id of the dashboard to update.
   * @param updates Partial theme customization values; only fields that are not undefined are applied.
   */
  const updateDashboardCustomization = async (dashboardId: string, updates: Partial<ThemeCustomization>) => {
    const newDashboards = dashboards.map((d) => {
      if (d.id === dashboardId) {
        return {
          ...d,
          ...(updates.primary_color !== undefined ? { primary_color: updates.primary_color } : {}),
          ...(updates.secondary_color !== undefined ? { secondary_color: updates.secondary_color } : {}),
          ...(updates.tertiary_color !== undefined ? { tertiary_color: updates.tertiary_color } : {}),
          ...(updates.background_image !== undefined ? { background_image: updates.background_image } : {}),
          ...(updates.background_music !== undefined ? { background_music: updates.background_music } : {}),
          ...(updates.background_music_name !== undefined ? { background_music_name: updates.background_music_name } : {}),
        };
      }
      return d;
    });
    await saveDashboards(newDashboards);
  };

  /**
   * @brief Merges meditation setting changes into local settings and localStorage and syncs them to the server when logged in.
   * @param updates Partial meditation settings such as video and sound options to apply.
   */
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

  /**
   * @brief Applies theme customization updates to the currently active dashboard.
   * @param updates Partial theme customization values to apply.
   */
  const updateCustomization = async (updates: Partial<ThemeCustomization>) => {
    await updateDashboardCustomization(activeDashboardId, updates);
  };

  /**
   * @brief Clears the background image of the currently active dashboard.
   */
  const removeBackgroundImage = async () => {
    await updateDashboardCustomization(activeDashboardId, { background_image: null });
  };

  /**
   * @brief Clears the background image of the specified dashboard.
   * @param dashboardId The id of the dashboard whose background image is removed.
   */
  const removeDashboardBackgroundImage = async (dashboardId: string) => {
    await updateDashboardCustomization(dashboardId, { background_image: null });
  };

  /**
   * @brief Clears the background music URL and name of the specified dashboard.
   * @param dashboardId The id of the dashboard whose background music is removed.
   */
  const removeDashboardBackgroundMusic = async (dashboardId: string) => {
    await updateDashboardCustomization(dashboardId, {
      background_music: null,
      background_music_name: null,
    });
  };

  /**
   * @brief Uploads a custom meditation video to the server and refreshes the available videos list.
   * @param file The video file to upload.
   * @return A promise resolving to the uploaded video's info.
   */
  const uploadVideo = async (file: File): Promise<VideoInfo> => {
    const uploaded = await uploadCustomVideoApi(file);
    await refreshVideos();
    return uploaded;
  };

  /**
   * @brief Uploads a background image and applies it to the currently active dashboard.
   * @param file The image file to upload.
   * @return A promise resolving to the uploaded background's info.
   */
  const uploadBackground = async (file: File): Promise<BackgroundInfo> => {
    return uploadBackgroundForDashboard(activeDashboardId, file);
  };

  /**
   * @brief Uploads a background image, refreshes the list and sets it as the background of the given dashboard.
   * @param dashboardId The id of the dashboard that receives the new background.
   * @param file The image file to upload.
   * @return A promise resolving to the uploaded background's info.
   */
  const uploadBackgroundForDashboard = async (dashboardId: string, file: File): Promise<BackgroundInfo> => {
    const uploaded = await uploadCustomBackgroundApi(file);
    await refreshBackgrounds();
    await updateDashboardCustomization(dashboardId, { background_image: uploaded.url });
    return uploaded;
  };

  /**
   * @brief Uploads a music file, refreshes the list and sets it as the background music of the given dashboard.
   * @param dashboardId The id of the dashboard that receives the new music.
   * @param file The audio file to upload.
   * @return A promise resolving to the uploaded music's info.
   */
  const uploadMusicForDashboard = async (dashboardId: string, file: File): Promise<MusicInfo> => {
    const uploaded = await uploadCustomMusicApi(file);
    await refreshMusic();
    await updateDashboardCustomization(dashboardId, {
      background_music: uploaded.url,
      background_music_name: uploaded.name,
    });
    return uploaded;
  };

  const activeDashboard = dashboards.find((d) => d.id === activeDashboardId) || dashboards[0];

  const customization: ThemeCustomization = {
    primary_color: activeDashboard?.primary_color || DEFAULT_CUSTOMIZATION.primary_color,
    secondary_color: activeDashboard?.secondary_color || DEFAULT_CUSTOMIZATION.secondary_color,
    tertiary_color: activeDashboard?.tertiary_color || DEFAULT_CUSTOMIZATION.tertiary_color,
    background_image: activeDashboard?.background_image !== undefined ? activeDashboard.background_image : DEFAULT_CUSTOMIZATION.background_image,
    background_music: activeDashboard?.background_music !== undefined ? activeDashboard.background_music : DEFAULT_CUSTOMIZATION.background_music,
    background_music_name: activeDashboard?.background_music_name !== undefined ? activeDashboard.background_music_name : DEFAULT_CUSTOMIZATION.background_music_name,
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        availableVideos,
        availableBackgrounds,
        availableMusic,
        dashboards,
        activeDashboardId,
        activeDashboard,
        customization,
        brainrotMode,
        setBrainrotMode,
        setActiveDashboardId,
        createDashboard,
        renameDashboard,
        deleteDashboard,
        refreshVideos,
        refreshBackgrounds,
        refreshMusic,
        updateMeditationSettings,
        updateCustomization,
        updateDashboardCustomization,
        removeBackgroundImage,
        removeDashboardBackgroundImage,
        removeDashboardBackgroundMusic,
        uploadVideo,
        uploadBackground,
        uploadBackgroundForDashboard,
        uploadMusicForDashboard,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * @brief Returns the settings context value and throws if used outside a SettingsProvider.
 * @return The settings context object with settings, dashboards, customization and their update and upload actions.
 */
export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings doit être utilisé au sein d\'un SettingsProvider');
  }
  return ctx;
}

