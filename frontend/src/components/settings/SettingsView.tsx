import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useTheme } from '@/context/ThemeContext'
import {
  getStoredToken,
  fetchSteamStatus,
  disconnectSteam,
  fetchGithubStatus,
  disconnectGithub,
} from '@/services/api'
import { GithubConnectDialog } from './GithubConnectDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { BRAINROT_START_CONCERT_EVENT } from '@/components/brainrot/BrainrotMode'
import {
  User,
  Layers,
  Gamepad2,
  GitBranch,
  Sparkles,
  Palette,
  PanelLeftClose,
  PanelLeft,
  SlidersHorizontal,
  Video,
  CloudSun,
  Radio,
  Music,
  PartyPopper,
} from 'lucide-react'
import { AccountSettingsTab } from './tabs/AccountSettingsTab'
import { IntegrationsSettingsTab, type IntegrationItem } from './tabs/IntegrationsSettingsTab'
import { AmbianceSettingsTab } from './tabs/AmbianceSettingsTab'
import { AppearanceSettingsTab } from './tabs/AppearanceSettingsTab'

export type SettingsSubpage = 'account' | 'integrations' | 'ambiance' | 'appearance'

const INTEGRATIONS: IntegrationItem[] = [
  {
    id: 'steam',
    name: 'Steam',
    category: 'Gaming',
    description: 'Suivi de la Wishlist, temps de jeu et statistiques de bibliothèque.',
    icon: Gamepad2,
    status: 'disconnected',
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Développement',
    description: 'Statistiques de commits, pull requests, revues de code, dépôts et organisations.',
    icon: GitBranch,
    status: 'disconnected',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'Médias',
    description: 'Abonnements récents, compteurs de vues et dernières vidéos publiées.',
    icon: Video,
    status: 'coming_soon',
  },
  {
    id: 'openmeteo',
    name: 'Open-Meteo',
    category: 'Météo',
    description: 'Prévisions horaires, alertes météo et qualité de l’air en temps réel.',
    icon: CloudSun,
    status: 'connected',
    account: 'Service Libre (Open-Meteo)',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'Musique',
    description: 'Titre en cours de lecture, playlists favorites et historique d’écoute.',
    icon: Music,
    status: 'coming_soon',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    category: 'Streaming',
    description: 'Statut des chaînes suivies en live et notifications de stream.',
    icon: Radio,
    status: 'coming_soon',
  },
]

export interface SettingsViewProps {
  initialSubpage?: SettingsSubpage
  onSubpageChange?: (subpage: SettingsSubpage) => void
  onLaunchMeditation?: () => void
}

/**
 * @brief Renders the settings page with a collapsible sidebar and the account, integrations, ambiance and appearance tabs.
 * @param initialSubpage Settings subpage shown first and synced when it changes; defaults to account.
 * @param onSubpageChange Optional callback notified when the user switches to another settings subpage.
 * @param onLaunchMeditation Optional callback passed to the ambiance tab to start the meditation session.
 * @return The settings layout with header, navigation sidebar, active tab content and GitHub connect dialog, or null when logged out.
 */
export function SettingsView({
  initialSubpage = 'account',
  onSubpageChange,
  onLaunchMeditation,
}: SettingsViewProps) {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const {
    settings,
    availableVideos,
    updateMeditationSettings,
    uploadVideo,
    brainrotMode,
    setBrainrotMode,
  } = useSettings()

  const [activeSubpage, setActiveSubpage] = useState<SettingsSubpage>(initialSubpage)
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(INTEGRATIONS)
  const [isGithubDialogOpen, setIsGithubDialogOpen] = useState<boolean>(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return localStorage.getItem('settings_sidebar_open') !== 'false'
  })

  /**
   * @brief Toggles the settings sidebar open or closed and persists the choice in localStorage.
   */
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev
      localStorage.setItem('settings_sidebar_open', String(next))
      return next
    })
  }

  const isVideoEnabled = settings.meditation.video_enabled
  const isSoundEnabled = settings.meditation.sound_enabled
  const currentVideoUrl = settings.meditation.video_url

  useEffect(() => {
    if (initialSubpage) {
      setActiveSubpage(initialSubpage)
    }
  }, [initialSubpage])

  /**
   * @brief Switches the active settings subpage and notifies the parent through onSubpageChange.
   * @param subpage Settings subpage to display.
   */
  const handleSubpageChange = (subpage: SettingsSubpage) => {
    setActiveSubpage(subpage)
    if (onSubpageChange) {
      onSubpageChange(subpage)
    }
  }

  /**
   * @brief Fetches Steam and GitHub connection status and updates the matching integration items.
   */
  const refreshIntegrations = async () => {
    if (!user && !getStoredToken()) return

    try {
      const steam = await fetchSteamStatus()
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === 'steam'
            ? {
                ...item,
                status: steam.connected ? 'connected' : 'disconnected',
                account: steam.profile?.username,
              }
            : item
        )
      )
    } catch {
    }

    try {
      const github = await fetchGithubStatus()
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === 'github'
            ? {
                ...item,
                status: github.connected ? 'connected' : 'disconnected',
                account: github.profile?.login || github.profile?.username,
              }
            : item
        )
      )
    } catch {
    }
  }

  useEffect(() => {
    refreshIntegrations()
  }, [user])

  /**
   * @brief Starts connecting an integration by redirecting to Steam auth or opening the GitHub connect dialog.
   * @param id Identifier of the integration to connect.
   */
  const handleConnect = (id: string) => {
    if (id === 'steam') {
      window.location.href = '/api/v1/auth/steam'
    } else if (id === 'github') {
      setIsGithubDialogOpen(true)
    }
  }

  /**
   * @brief Disconnects the Steam or GitHub integration and marks it as disconnected in local state.
   * @param id Identifier of the integration to disconnect.
   */
  const handleDisconnect = async (id: string) => {
    try {
      if (id === 'steam') {
        await disconnectSteam()
      } else if (id === 'github') {
        await disconnectGithub()
      }
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: 'disconnected', account: undefined } : item
        )
      )
    } catch (err) {
      console.error(`Erreur lors de la déconnexion de ${id}:`, err)
    }
  }

  if (!user) return null

  const connectedCount = integrations.filter((i) => i.status === 'connected').length

  return (
    <div className="w-full space-y-6">
      <div className="border-b border-border/60 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Paramètres
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Gérez votre profil, vos intégrations de services, l'ambiance et vos préférences d'affichage.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-6 w-full">
        {isSidebarOpen ? (
          <aside className="w-full md:w-64 shrink-0 rounded-2xl border border-border/80 bg-card/90 p-3.5 shadow-md backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between px-2 py-1 border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Navigation
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Masquer la barre latérale"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </div>

            <nav className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleSubpageChange('account')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeSubpage === 'account'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <User className="size-4" />
                  <span>Compte & Profil</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSubpageChange('integrations')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeSubpage === 'integrations'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="size-4" />
                  <span>Intégrations</span>
                </div>
                {connectedCount > 0 && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      activeSubpage === 'integrations'
                        ? 'border-white/30 text-white bg-white/20'
                        : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                    }`}
                  >
                    {connectedCount}
                  </Badge>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSubpageChange('ambiance')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeSubpage === 'ambiance'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="size-4" />
                  <span>Ambiance</span>
                </div>
                {isVideoEnabled && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      activeSubpage === 'ambiance'
                        ? 'border-white/30 text-white bg-white/20'
                        : 'border-amber-500/30 text-amber-500 bg-amber-500/10'
                    }`}
                  >
                    Actif
                  </Badge>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSubpageChange('appearance')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeSubpage === 'appearance'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Palette className="size-4" />
                  <span>Apparence</span>
                </div>
              </button>
            </nav>
          </aside>
        ) : null}

        <section className="flex-1 min-w-0 w-full space-y-6">
          {!isSidebarOpen && (
            <div className="flex items-center gap-2 pb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="h-8 gap-2 px-3 text-xs rounded-lg border-border/80 bg-card hover:bg-muted cursor-pointer shadow-2xs"
              >
                <PanelLeft className="size-3.5 text-primary" />
                <span>Afficher le menu des paramètres</span>
              </Button>
            </div>
          )}

          {activeSubpage === 'account' && (
            <AccountSettingsTab user={user} onLogout={logout} />
          )}

          {activeSubpage === 'integrations' && (
            <IntegrationsSettingsTab
              integrations={integrations}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          )}

          {activeSubpage === 'ambiance' && (
            <AmbianceSettingsTab
              isVideoEnabled={isVideoEnabled}
              isSoundEnabled={isSoundEnabled}
              currentVideoUrl={currentVideoUrl}
              availableVideos={availableVideos}
              onUpdateMeditationSettings={updateMeditationSettings}
              onUploadVideo={uploadVideo}
              onLaunchMeditation={onLaunchMeditation}
            />
          )}

          {activeSubpage === 'appearance' && (
            <AppearanceSettingsTab theme={theme} onSetTheme={setTheme} />
          )}

          <div className="max-w-3xl flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-card p-4 mt-8">
            <div className="flex items-start gap-3">
              <PartyPopper className="size-5 text-pink-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Brainrot mode</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Un concert surprise des 8 brainrots peut démarrer à tout moment (1 chance sur 100 par seconde), avec musique et lumières. Le reste du temps, Tung Tung Tung Sahur frappe votre curseur avec sa batte.
                </p>
                {brainrotMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 cursor-pointer text-xs"
                    onClick={() => window.dispatchEvent(new Event(BRAINROT_START_CONCERT_EVENT))}
                  >
                    Lancer le concert maintenant
                  </Button>
                )}
              </div>
            </div>
            <Switch checked={brainrotMode} onCheckedChange={setBrainrotMode} aria-label="Brainrot mode" />
          </div>
        </section>
      </div>

      <GithubConnectDialog
        open={isGithubDialogOpen}
        onOpenChange={setIsGithubDialogOpen}
        onSuccess={(profile) => {
          setIntegrations((prev) =>
            prev.map((item) =>
              item.id === 'github'
                ? {
                    ...item,
                    status: 'connected' as const,
                    account: profile.username || profile.login || 'GitHub lié',
                  }
                : item
            )
          )
        }}
      />
    </div>
  )
}

export default SettingsView
