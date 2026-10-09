import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AuthCard } from '@/components/auth/AuthCard';
import { MotivationalLoader } from '@/components/auth/MotivationalLoader';
import { WidgetGrid } from '@/components/dashboard/WidgetGrid';
import { BrainrotMode, BRAINROT_DROP_BAT_EVENT } from '@/components/brainrot/BrainrotMode';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { BackgroundMusicPlayer } from '@/components/dashboard/BackgroundMusicPlayer';
import { SettingsView, type SettingsSubpage } from '@/components/settings/SettingsView';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { AdminSupervisionBanner } from '@/components/admin/AdminSupervisionBanner';
import { DashboardContentDialog } from '@/components/admin/DashboardContentDialog';
import { useWidgets, mapApiToWidget, mapWidgetToApiPayload } from '@/hooks/useWidgets';
import {
  fetchAdminDashboardDetail,
  createAdminWidget,
  updateAdminWidget,
  deleteAdminWidget,
  reorderAdminWidgets,
  type AdminDashboardSummary,
  type ApiUserWidget,
} from '@/services/api';
import type { Widget, NewWidgetData } from '@/types/widget';
import { CguDialog } from '@/components/legal/CguDialog';
import { AccessibilityDialog } from '@/components/legal/AccessibilityDialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ExternalLink,
  LayoutDashboard,
  SlidersHorizontal,
  ChevronDown,
  Sun,
  Moon,
  Laptop,
  LogOut,
  Check,
  Plus,
  Sparkles,
  Shield,
} from 'lucide-react';

type NavTab = 'dashboard' | 'settings' | 'admin';

interface SupervisedContext {
  userId: number;
  dashboardId: string;
  userUsername: string;
  userEmail: string;
  dashboardName: string;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  backgroundImage?: string | null;
  widgets: ApiUserWidget[];
}

const BRAINROT_MUSIC_URL = `/api/v1/storage/custom_music/${encodeURIComponent(
  'W&W - Tung Tung Tung Sahur (Italian Brainrot) - W&W.mp3'
)}`;

/**
 * @brief Renders the main application shell handling navigation between dashboard, settings and admin views plus supervised dashboards.
 * @return JSX with the header, the active tab content (dashboard, settings or admin), footer and background music player.
 */
function DashboardContent() {
  const {
    user,
    loading: authLoading,
    showMotivationalTransition,
    setShowMotivationalTransition,
    logout,
  } = useAuth();
  const { theme, setTheme } = useTheme();
  const { activeDashboardId, setActiveDashboardId, customization, brainrotMode } = useSettings();

  const [isMeditating, setIsMeditating] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    if (path.startsWith('/admin') || params.get('tab') === 'admin') {
      return 'admin';
    }
    if (path.startsWith('/settings') || params.get('tab') === 'settings') {
      return 'settings';
    }
    return 'dashboard';
  });

  const [settingsSubpage, setSettingsSubpage] = useState<SettingsSubpage>(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('sub');
    if (sub === 'integrations' || sub === 'ambiance' || sub === 'appearance') {
      return sub;
    }
    return 'account';
  });

  const [adminSubtab, setAdminSubtab] = useState<'users' | 'dashboards'>('users');
  const [supervisedContext, setSupervisedContext] = useState<SupervisedContext | null>(null);
  const [adminDialogSummary, setAdminDialogSummary] = useState<AdminDashboardSummary | null>(null);
  const [adminDialogOpen, setAdminDialogOpen] = useState<boolean>(false);
  const [cguOpen, setCguOpen] = useState<boolean>(false);
  const [a11yOpen, setA11yOpen] = useState<boolean>(false);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  /**
   * @brief Toggles the dashboard edit mode on or off.
   */
  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };
  const { widgets, addWidget, updateWidget, removeWidget, reorderWidgets } = useWidgets();

  const navigateToDashboard = useCallback((pageId?: string) => {
    setSupervisedContext(null);
    setCurrentTab('dashboard');
    const targetPage = pageId || activeDashboardId;
    const url = targetPage && targetPage !== 'default'
      ? `/dashboard?page=${encodeURIComponent(targetPage)}`
      : '/dashboard';
    window.history.pushState({ tab: 'dashboard', page: targetPage }, '', url);
  }, [activeDashboardId]);

  const navigateToSettings = useCallback((subpage: SettingsSubpage = 'account') => {
    setSupervisedContext(null);
    setCurrentTab('settings');
    setSettingsSubpage(subpage);
    const url = subpage && subpage !== 'account'
      ? `/settings?sub=${encodeURIComponent(subpage)}`
      : '/settings';
    window.history.pushState({ tab: 'settings', sub: subpage }, '', url);
  }, []);

  const navigateToAdmin = useCallback((tab: 'users' | 'dashboards' = 'users') => {
    setSupervisedContext(null);
    setCurrentTab('admin');
    setAdminSubtab(tab);
    const url = tab !== 'users' ? `/admin?tab=${encodeURIComponent(tab)}` : '/admin';
    window.history.pushState({ tab: 'admin', adminTab: tab }, '', url);
  }, []);

  const handleDashboardPageChange = useCallback((pageId: string) => {
    const url = pageId && pageId !== 'default'
      ? `/dashboard?page=${encodeURIComponent(pageId)}`
      : '/dashboard';
    window.history.replaceState({ tab: 'dashboard', page: pageId }, '', url);
  }, []);

  const handleOpenVisualDashboard = useCallback(async (userId: number, dashboardId: string) => {
    try {
      const detail = await fetchAdminDashboardDetail(userId, dashboardId);
      setSupervisedContext({
        userId,
        dashboardId,
        userUsername: detail.user_username,
        userEmail: detail.user_email,
        dashboardName: detail.name,
        primaryColor: detail.primary_color,
        secondaryColor: detail.secondary_color,
        tertiaryColor: detail.tertiary_color,
        backgroundImage: detail.background_image,
        widgets: detail.widgets,
      });
      setCurrentTab('dashboard');
      window.history.pushState(
        { tab: 'dashboard', superviseUser: userId, superviseDash: dashboardId },
        '',
        `/dashboard?superviseUser=${userId}&page=${encodeURIComponent(dashboardId)}`
      );
    } catch (err) {
      console.error('Erreur ouverture dashboard supervision:', err);
    }
  }, []);

  /**
   * @brief Creates a widget on the supervised user's dashboard through the admin API and adds it to the local supervised state.
   * @param data The new widget data, to which the supervised dashboard id is added.
   */
  const handleSupervisedAddWidget = async (data: NewWidgetData) => {
    if (!supervisedContext) return;
    try {
      const payload = mapWidgetToApiPayload({
        ...data,
        dashboardId: supervisedContext.dashboardId,
      });
      const created = await createAdminWidget(supervisedContext.userId, payload);
      setSupervisedContext((prev) =>
        prev ? { ...prev, widgets: [...prev.widgets, created] } : null
      );
    } catch (err) {
      console.error('Erreur création widget supervision:', err);
    }
  };

  /**
   * @brief Updates a widget on the supervised user's dashboard through the admin API and replaces it in local state.
   * @param id The id of the widget to update, as a string.
   * @param updatedFields The partial widget fields to merge into the existing widget.
   */
  const handleSupervisedUpdateWidget = async (id: string, updatedFields: Partial<Widget>) => {
    if (!supervisedContext) return;
    try {
      const existing = supervisedContext.widgets.find((w) => String(w.id) === id);
      if (!existing) return;
      const mapped = mapApiToWidget(existing);
      const merged = { ...mapped, ...updatedFields };
      const payload = mapWidgetToApiPayload(merged);
      const updated = await updateAdminWidget(supervisedContext.userId, id, payload);
      setSupervisedContext((prev) =>
        prev
          ? {
              ...prev,
              widgets: prev.widgets.map((w) => (String(w.id) === id ? updated : w)),
            }
          : null
      );
    } catch (err) {
      console.error('Erreur modification widget supervision:', err);
    }
  };

  /**
   * @brief Deletes a widget from the supervised user's dashboard through the admin API and removes it from local state.
   * @param id The id of the widget to delete, as a string.
   */
  const handleSupervisedRemoveWidget = async (id: string) => {
    if (!supervisedContext) return;
    try {
      await deleteAdminWidget(supervisedContext.userId, id);
      setSupervisedContext((prev) =>
        prev
          ? {
              ...prev,
              widgets: prev.widgets.filter((w) => String(w.id) !== id),
            }
          : null
      );
    } catch (err) {
      console.error('Erreur suppression widget supervision:', err);
    }
  };

  /**
   * @brief Reorders widgets on the supervised user's dashboard and synchronizes with the admin API.
   * @param reorderedSubset The new order of widgets for the active dashboard.
   */
  const handleSupervisedReorderWidgets = async (reorderedSubset: Widget[]) => {
    if (!supervisedContext) return;
    try {
      const subsetIds = new Set(reorderedSubset.map((w) => String(w.id)));
      const firstIndex = supervisedContext.widgets.findIndex((w) => subsetIds.has(String(w.id)));

      let nextAllApiWidgets: ApiUserWidget[] = [];
      const subsetApiWidgets = reorderedSubset
        .map((w) => supervisedContext.widgets.find((orig) => String(orig.id) === String(w.id)))
        .filter(Boolean) as ApiUserWidget[];

      if (firstIndex !== -1) {
        const before = supervisedContext.widgets.filter((w, idx) => idx < firstIndex && !subsetIds.has(String(w.id)));
        const after = supervisedContext.widgets.filter((w, idx) => idx >= firstIndex && !subsetIds.has(String(w.id)));
        nextAllApiWidgets = [...before, ...subsetApiWidgets, ...after];
      } else {
        nextAllApiWidgets = [...subsetApiWidgets, ...supervisedContext.widgets.filter((w) => !subsetIds.has(String(w.id)))];
      }

      setSupervisedContext((prev) =>
        prev
          ? {
              ...prev,
              widgets: nextAllApiWidgets,
            }
          : null
      );

      const numericIds = nextAllApiWidgets
        .map((w) => Number(w.id))
        .filter((id) => !isNaN(id));
      await reorderAdminWidgets(supervisedContext.userId, numericIds);
    } catch (err) {
      console.error('Erreur réordonnancement widgets supervision:', err);
    }
  };


  useEffect(() => {
    /**
     * @brief Synchronizes the current tab and sub-pages with the browser URL when the user navigates back or forward.
     */
    const handlePopState = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      if (path.startsWith('/admin') || params.get('tab') === 'admin') {
        if (user?.role === 'admin') {
          setCurrentTab('admin');
          setSupervisedContext(null);
          const at = params.get('adminTab') === 'dashboards' ? 'dashboards' : 'users';
          setAdminSubtab(at);
        } else {
          setCurrentTab('dashboard');
        }
      } else if (path.startsWith('/settings') || params.get('tab') === 'settings') {
        setCurrentTab('settings');
        setSupervisedContext(null);
        const sub = params.get('sub');
        if (sub === 'integrations' || sub === 'ambiance' || sub === 'appearance') {
          setSettingsSubpage(sub);
        } else {
          setSettingsSubpage('account');
        }
      } else {
        setCurrentTab('dashboard');
        const page = params.get('page');
        if (page) {
          setActiveDashboardId(page);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setActiveDashboardId, user]);

  useEffect(() => {
    if (!user) return;
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if ((path.startsWith('/admin') || params.get('tab') === 'admin') && user.role === 'admin') {
      setCurrentTab('admin');
      const at = params.get('adminTab') === 'dashboards' ? 'dashboards' : 'users';
      setAdminSubtab(at);
      const url = at !== 'users' ? `/admin?tab=${encodeURIComponent(at)}` : '/admin';
      window.history.replaceState({ tab: 'admin', adminTab: at }, '', url);
    } else if (path.startsWith('/settings') || params.get('tab') === 'settings') {
      setCurrentTab('settings');
      const sub = params.get('sub') as SettingsSubpage;
      if (sub === 'integrations' || sub === 'ambiance' || sub === 'appearance') {
        setSettingsSubpage(sub);
      }
      const url = sub && sub !== 'account' ? `/settings?sub=${encodeURIComponent(sub)}` : '/settings';
      window.history.replaceState({ tab: 'settings', sub }, '', url);
    } else {
      setCurrentTab('dashboard');
      const page = params.get('page') || activeDashboardId;
      const url = page && page !== 'default' ? `/dashboard?page=${encodeURIComponent(page)}` : '/dashboard';
      window.history.replaceState({ tab: 'dashboard', page }, '', url);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-mono">Chargement de la session...</p>
        </div>
      </div>
    );
  }

  if (showMotivationalTransition) {
    return (
      <MotivationalLoader
        mode="login"
        onComplete={() => setShowMotivationalTransition(false)}
      />
    );
  }

  if (isMeditating) {
    return (
      <MotivationalLoader
        mode="meditate"
        onComplete={() => setIsMeditating(false)}
      />
    );
  }

  const displayedWidgets = supervisedContext
    ? supervisedContext.widgets.map(mapApiToWidget)
    : widgets.filter((w) => (w.dashboardId || 'default') === activeDashboardId);

  const isDashboardTab = currentTab === 'dashboard';

  const activePrimaryColor = supervisedContext
    ? (supervisedContext.primaryColor || '#0b0f19')
    : (customization?.primary_color || '#0b0f19');
  const activeSecondaryColor = supervisedContext
    ? (supervisedContext.secondaryColor || '#131b2e')
    : (customization?.secondary_color || '#131b2e');
  const activeTertiaryColor = supervisedContext
    ? (supervisedContext.tertiaryColor || '#38bdf8')
    : (customization?.tertiary_color || '#38bdf8');
  const activeBgImage = supervisedContext
    ? supervisedContext.backgroundImage
    : customization?.background_image;

  const hasBgImage = Boolean(activeBgImage);

  const containerStyle: React.CSSProperties = user && isDashboardTab ? {
    backgroundColor: hasBgImage ? undefined : activePrimaryColor,
    backgroundImage: hasBgImage
      ? `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url("${activeBgImage}")`
      : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    ['--card' as string]: activeSecondaryColor,
    ['--card-foreground' as string]: '#f8fafc',
    ['--secondary' as string]: activeSecondaryColor,
    ['--primary' as string]: activeTertiaryColor,
    ['--ring' as string]: activeTertiaryColor,
    ['--border' as string]: `${activeTertiaryColor}33`,
    ['--user-primary' as string]: activePrimaryColor,
    ['--user-secondary' as string]: activeSecondaryColor,
    ['--user-tertiary' as string]: activeTertiaryColor,
  } : {};

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col antialiased w-full transition-colors duration-200"
      style={containerStyle}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring font-medium text-xs"
      >
        Passer au contenu principal
      </a>

      <header role="banner" className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="w-full px-3 sm:px-6 lg:px-10 h-14 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <button
              type="button"
              onClick={() => navigateToDashboard()}
              className="font-bold text-sm tracking-wider text-foreground uppercase select-none cursor-pointer hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm shrink-0"
            >
              INTER-NET
            </button>

            {user && (
              <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => navigateToDashboard()}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                    currentTab === 'dashboard'
                      ? 'bg-muted text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                  title="Tableau de bord"
                >
                  <LayoutDashboard className="size-3.5 shrink-0" />
                  <span className="hidden md:inline">Dashboard</span>
                </button>

                {user.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => navigateToAdmin()}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                      currentTab === 'admin'
                        ? 'bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/40'
                        : 'text-violet-400/80 hover:text-violet-300 hover:bg-violet-500/10'
                    }`}
                    title="Panel d'administration"
                  >
                    <Shield className="size-3.5 text-violet-400 shrink-0" />
                    <span className="hidden md:inline">Administration</span>
                  </button>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {user ? (
              <>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setIsMeditating(true)}
                  className="h-9 sm:h-10 text-xs gap-1.5 px-2.5 sm:px-3.5 cursor-pointer font-medium border-border/80 hover:bg-muted/60"
                  title="Pause méditation"
                >
                  <Sparkles className="size-3.5 text-primary shrink-0" />
                  <span className="hidden sm:inline">Méditer</span>
                </Button>

                {brainrotMode && !supervisedContext && (
                  <Button
                    id="tung-header-button"
                    variant="outline"
                    size="default"
                    onClick={() => window.dispatchEvent(new Event(BRAINROT_DROP_BAT_EVENT))}
                    className="h-9 sm:h-10 text-xs gap-1.5 px-2.5 sm:px-3.5 cursor-pointer font-medium border-border/80 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                    title="Tung (Faire tomber la batte)"
                  >
                    <span className="text-xs shrink-0 select-none">🏏</span>
                    <span className="hidden sm:inline">Tung</span>
                  </Button>
                )}

                {currentTab === 'dashboard' && (
                  <Button
                    variant={isEditing ? 'default' : 'outline'}
                    size="default"
                    onClick={toggleEditMode}
                    className="h-9 sm:h-10 text-xs gap-1.5 px-2.5 sm:px-3.5 cursor-pointer font-medium"
                    title={isEditing ? 'Terminer l\'édition' : 'Éditer les widgets'}
                  >
                    {isEditing ? (
                      'Terminer'
                    ) : (
                      <>
                        <Plus className="size-3.5 shrink-0" />
                        <span className="hidden sm:inline">Éditer</span>
                      </>
                    )}
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className="h-10 px-2.5 sm:px-3 gap-2 border-border/80 hover:bg-muted/60 data-state-open:bg-muted/80 cursor-pointer select-none"
                    >
                      <div className="size-6 rounded-md bg-muted border border-border/80 flex items-center justify-center font-mono text-[11px] font-semibold text-foreground shrink-0">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="hidden sm:inline text-xs font-medium text-foreground tracking-tight max-w-[120px] truncate">
                        {user.username}
                      </span>
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-60 p-1.5 shadow-lg border border-border">
                    <div className="px-2.5 py-2">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-foreground truncate">{user.username}</p>
                        {user.role === 'admin' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">{user.email}</p>
                    </div>

                    <DropdownMenuSeparator />

                    {user.role === 'admin' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => navigateToAdmin()}
                          className="cursor-pointer gap-2 text-xs py-2 text-violet-400 focus:text-violet-300 focus:bg-violet-500/10"
                        >
                          <Shield className="size-4 text-violet-400" />
                          <span>Panel d'Administration</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem
                      onClick={() => navigateToSettings('account')}
                      className="cursor-pointer gap-2 text-xs py-2"
                    >
                      <SlidersHorizontal className="size-4 text-muted-foreground" />
                      <span>Paramètres & Intégrations</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuLabel className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground/80 px-2.5 pt-1">
                      Thème
                    </DropdownMenuLabel>

                    <DropdownMenuItem
                      onClick={() => setTheme('light')}
                      className="cursor-pointer gap-2 text-xs py-2 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Sun className="size-4 text-muted-foreground" />
                        <span>Thème Clair</span>
                      </div>
                      {theme === 'light' && <Check className="size-3.5 text-foreground" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setTheme('dark')}
                      className="cursor-pointer gap-2 text-xs py-2 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Moon className="size-4 text-muted-foreground" />
                        <span>Thème Sombre</span>
                      </div>
                      {theme === 'dark' && <Check className="size-3.5 text-foreground" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setTheme('system')}
                      className="cursor-pointer gap-2 text-xs py-2 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Laptop className="size-4 text-muted-foreground" />
                        <span>Système</span>
                      </div>
                      {theme === 'system' && <Check className="size-3.5 text-foreground" />}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      variant="destructive"
                      onClick={logout}
                      className="cursor-pointer gap-2 text-xs py-2 text-rose-500 focus:text-rose-500"
                    >
                      <LogOut className="size-4" />
                      <span>Se déconnecter</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <ThemeToggle />
            )}
          </div>
        </div>
      </header>

      {user && supervisedContext && (
        <AdminSupervisionBanner
          targetUsername={supervisedContext.userUsername}
          targetEmail={supervisedContext.userEmail}
          targetDashboardName={supervisedContext.dashboardName}
          onExitSupervision={() => {
            setSupervisedContext(null);
            setCurrentTab('admin');
          }}
          onOpenDashboardSettings={() => {
            setAdminDialogSummary({
              dashboard_id: supervisedContext.dashboardId,
              user_id: supervisedContext.userId,
              user_username: supervisedContext.userUsername,
              user_email: supervisedContext.userEmail,
              name: supervisedContext.dashboardName,
              primary_color: supervisedContext.primaryColor,
              secondary_color: supervisedContext.secondaryColor,
              tertiary_color: supervisedContext.tertiaryColor,
              background_image: supervisedContext.backgroundImage,
              widgets_count: supervisedContext.widgets.length,
            });
            setAdminDialogOpen(true);
          }}
        />
      )}

      <main id="main-content" role="main" tabIndex={-1} className="flex-1 w-full px-3 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 focus:outline-none">
        {!user ? (
          <div className="space-y-8 max-w-md mx-auto py-12">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                INTER-NET
              </h1>
              <p className="text-xs text-muted-foreground">
                Connectez vos APIs et surveillez vos flux en direct.
              </p>
            </div>

            <AuthCard />
          </div>
        ) : currentTab === 'admin' && user.role === 'admin' ? (
          <AdminPanel
            initialTab={adminSubtab}
            onNavigateToVisualDashboard={handleOpenVisualDashboard}
          />
        ) : currentTab === 'settings' ? (
          <SettingsView
            initialSubpage={settingsSubpage}
            onSubpageChange={(sub) => {
              setSettingsSubpage(sub);
              const url = sub !== 'account' ? `/settings?sub=${encodeURIComponent(sub)}` : '/settings';
              window.history.replaceState({ tab: 'settings', sub }, '', url);
            }}
            onLaunchMeditation={() => setIsMeditating(true)}
          />
        ) : (
          <div className="space-y-6 w-full">
            {!supervisedContext && (
              <DashboardTabs
                widgets={widgets}
                isEditing={isEditing}
                onDashboardChange={handleDashboardPageChange}
              />
            )}

            <div className="space-y-4 w-full">
              <WidgetGrid
                widgets={displayedWidgets}
                isEditing={isEditing}
                onAddWidget={
                  supervisedContext
                    ? handleSupervisedAddWidget
                    : (data) => addWidget({ ...data, dashboardId: activeDashboardId })
                }
                onUpdateWidget={
                  supervisedContext ? handleSupervisedUpdateWidget : updateWidget
                }
                onRemoveWidget={
                  supervisedContext ? handleSupervisedRemoveWidget : removeWidget
                }
                onReorderWidgets={
                  supervisedContext ? handleSupervisedReorderWidgets : reorderWidgets
                }
                onToggleEdit={() => setIsEditing(true)}
              />
            </div>
          </div>
        )}
      </main>

      {adminDialogSummary && (
        <DashboardContentDialog
          open={adminDialogOpen}
          onOpenChange={setAdminDialogOpen}
          dashboardSummary={adminDialogSummary}
          onSuccess={async () => {
            if (supervisedContext) {
              const detail = await fetchAdminDashboardDetail(
                supervisedContext.userId,
                supervisedContext.dashboardId
              );
              setSupervisedContext({
                ...supervisedContext,
                dashboardName: detail.name,
                primaryColor: detail.primary_color,
                secondaryColor: detail.secondary_color,
                tertiaryColor: detail.tertiary_color,
                backgroundImage: detail.background_image,
                widgets: detail.widgets,
              });
            }
          }}
        />
      )}

      <footer role="contentinfo" className="w-full border-t border-border py-4 sm:py-6 text-xs text-muted-foreground mt-auto">
        <div className="w-full px-3 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <p className="font-medium text-foreground/80">CrabeCorp • INTER-NET</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => setA11yOpen(true)}
              className="hover:text-foreground transition-colors cursor-pointer text-xs underline-offset-4 hover:underline"
            >
              Accessibilité : Totalement conforme
            </button>
            <button
              type="button"
              onClick={() => setCguOpen(true)}
              className="hover:text-foreground transition-colors cursor-pointer text-xs underline-offset-4 hover:underline"
            >
              CGU
            </button>
            <a
              href="http://localhost:8080/about.json"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-mono text-xs"
            >
              /about.json
              <ExternalLink className="size-3.5" />
            </a>
            <a
              href="http://localhost:8080/api/v1/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-mono text-xs"
            >
              Swagger Docs
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </footer>

      <CguDialog open={cguOpen} onOpenChange={setCguOpen} />
      <AccessibilityDialog open={a11yOpen} onOpenChange={setA11yOpen} />

      {user && isDashboardTab && !(brainrotMode && !supervisedContext) && <BackgroundMusicPlayer />}
      {user && brainrotMode && !supervisedContext && (
        <BrainrotMode musicUrl={BRAINROT_MUSIC_URL} />
      )}
    </div>
  );
}

/**
 * @brief Renders the root component wrapping the application in theme, authentication and settings providers.
 * @return JSX with ThemeProvider, AuthProvider and SettingsProvider nesting the DashboardContent component.
 */
export function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="internet-theme">
      <AuthProvider>
        <SettingsProvider>
          <TooltipProvider delayDuration={150}>
            <DashboardContent />
          </TooltipProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
