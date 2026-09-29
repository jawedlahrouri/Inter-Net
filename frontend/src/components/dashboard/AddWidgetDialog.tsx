import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { InputField } from '@/components/ui/input-field'
import { RefreshField } from '@/components/ui/refresh-field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  CloudSun,
  Activity,
  Gamepad2,
  Lock,
  RefreshCw,
  PlusCircle,
  Eye,
  SlidersHorizontal,
  GitBranch,
  Layers,
} from 'lucide-react'
import type { NewWidgetData, WidgetType, SteamMetricType, GithubMetricType } from '@/types/widget'
import {
  fetchSteamStatus,
  getSteamAuthRedirectUrl,
  fetchGithubStatus,
} from '@/services/api'
import { SteamWidget } from './widgets/SteamWidget'
import { WeatherWidget } from './widgets/WeatherWidget'
import { CustomApiWidget } from './widgets/CustomApiWidget'
import { GithubWidget } from './widgets/GithubWidget'
import { useGithubStats } from '@/hooks/useGithubStats'
import { useSettings } from '@/context/SettingsContext'
import {
  STEAM_PRESETS,
  GITHUB_PRESETS,
  type SteamPreset,
  type GithubPreset,
  type ApiPreset,
} from '@/config/widgetPresets'
import { GithubPresetCatalog } from './dialogs/GithubPresetCatalog'
import { SteamPresetCatalog } from './dialogs/SteamPresetCatalog'
import { GithubParamsForm } from './dialogs/GithubParamsForm'
import { CustomApiParamsForm } from './dialogs/CustomApiParamsForm'
import { GithubPatForm } from './dialogs/GithubPatForm'
import { WidgetDimensionSelector } from './WidgetDimensionSelector'

export interface AddWidgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddWidget: (data: NewWidgetData) => void
}

/**
 * @brief Renders the full-screen dialog used to configure, preview and add a new dashboard widget.
 * @param open Whether the dialog is currently visible.
 * @param onOpenChange Callback invoked with the new open state when the dialog is opened or closed.
 * @param onAddWidget Callback receiving the configured new widget data when the user confirms the addition.
 * @return A Dialog element with the widget type selector, preset catalogs, parameter forms and a live preview.
 */
export function AddWidgetDialog({
  open,
  onOpenChange,
  onAddWidget,
}: AddWidgetDialogProps) {
  const { activeDashboardId } = useSettings()
  const [selectedType, setSelectedType] = useState<WidgetType>('github')
  const [title, setTitle] = useState('Commits (total)')
  const [city, setCity] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [jsonPath, setJsonPath] = useState('')
  const [displayMode, setDisplayMode] = useState<'kpi' | 'gauge'>('kpi')
  const [unit, setUnit] = useState('')
  const [refreshInterval, setRefreshInterval] = useState<number>(300)
  const [width, setWidth] = useState<number>(1)
  const [height, setHeight] = useState<number>(1)

  const [steamConnected, setSteamConnected] = useState<boolean>(false)
  const [steamLoading, setSteamLoading] = useState<boolean>(true)
  const [steamProfile, setSteamProfile] = useState<{
    steam_id: string
    username: string
    avatar: string
    profile_url: string
  } | null>(null)
  const [selectedSteamPreset, setSelectedSteamPreset] = useState<SteamMetricType>('last_played')
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [githubConnected, setGithubConnected] = useState<boolean>(false)
  const [githubLoading, setGithubLoading] = useState<boolean>(true)
  const [githubProfile, setGithubProfile] = useState<{
    login?: string
    name?: string
    username?: string
    avatar?: string
    avatar_url?: string
    profile_url?: string
    html_url?: string
  } | null>(null)
  const [selectedGithubPreset, setSelectedGithubPreset] = useState<GithubMetricType>('total_commits')
  const [selectedGithubCategory, setSelectedGithubCategory] = useState<string>('Tous')
  const [githubSearchQuery, setGithubSearchQuery] = useState<string>('')
  const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>('')
  const [selectedOrgName, setSelectedOrgName] = useState<string>('')
  const { stats: githubStats } = useGithubStats()

  useEffect(() => {
    if (githubStats?.recent_repos?.length && !selectedRepoFullName) {
      setSelectedRepoFullName(githubStats.recent_repos[0].full_name || githubStats.recent_repos[0].name)
    }
    if (githubStats?.organisations?.length && !selectedOrgName) {
      setSelectedOrgName(githubStats.organisations[0].login)
    }
  }, [githubStats, selectedRepoFullName, selectedOrgName])

  /**
   * @brief Reloads the Steam and GitHub connection statuses and profiles into local state.
   */
  const refreshStatuses = () => {
    setSteamLoading(true)
    fetchSteamStatus()
      .then((res) => {
        setSteamConnected(res.connected)
        setSteamProfile(res.profile || null)
      })
      .catch(() => {
        setSteamConnected(false)
        setSteamProfile(null)
      })
      .finally(() => setSteamLoading(false))

    setGithubLoading(true)
    fetchGithubStatus()
      .then((res) => {
        setGithubConnected(res.connected)
        setGithubProfile(res.profile || null)
      })
      .catch(() => {
        setGithubConnected(false)
        setGithubProfile(null)
      })
      .finally(() => setGithubLoading(false))
  }

  useEffect(() => {
    if (open) {
      refreshStatuses()
    }
  }, [open])

  const currentGithubPreset = useMemo<GithubPreset>(() => {
    return (
      GITHUB_PRESETS.find((p) => p.id === selectedGithubPreset) ||
      GITHUB_PRESETS[0]
    )
  }, [selectedGithubPreset])

  const currentSteamPreset = useMemo<SteamPreset>(() => {
    return (
      STEAM_PRESETS.find((p) => p.id === selectedSteamPreset) ||
      STEAM_PRESETS[0]
    )
  }, [selectedSteamPreset])

  /**
   * @brief Selects a GitHub preset and applies its title and default refresh interval to the form.
   * @param preset GitHub preset chosen in the catalog.
   */
  const handleSelectGithubPreset = (preset: GithubPreset) => {
    setSelectedGithubPreset(preset.id)
    setTitle(preset.title)
    if (preset.defaultInterval) {
      setRefreshInterval(preset.defaultInterval)
    }
  }

  /**
   * @brief Selects a Steam preset and applies its title and default refresh interval to the form.
   * @param preset Steam preset chosen in the catalog.
   */
  const handleSelectSteamPreset = (preset: SteamPreset) => {
    setSelectedSteamPreset(preset.id)
    setTitle(preset.title)
    if (preset.defaultInterval) {
      setRefreshInterval(preset.defaultInterval)
    }
  }

  /**
   * @brief Switches the selected widget type and resets the title and refresh interval to that type's defaults.
   * @param type Widget type to select (github, steam, weather or custom_api).
   */
  const handleSelectType = (type: WidgetType) => {
    setSelectedType(type)
    if (type === 'github') {
      setTitle(currentGithubPreset.title)
      setRefreshInterval(currentGithubPreset.defaultInterval || 300)
    } else if (type === 'steam') {
      setTitle(currentSteamPreset.title)
      setRefreshInterval(currentSteamPreset.defaultInterval || 300)
    } else if (type === 'weather') {
      setTitle('Météo locale')
      setRefreshInterval(60)
    } else if (type === 'custom_api') {
      setTitle('API REST JSON')
      setRefreshInterval(30)
    }
  }

  /**
   * @brief Fills the custom API form fields with the values of the chosen API preset.
   * @param preset Custom API preset providing title, URL, JSON path, display mode, unit and refresh rate.
   */
  const handleApplyApiPreset = (preset: ApiPreset) => {
    setTitle(preset.title)
    setApiUrl(preset.apiUrl)
    setJsonPath(preset.jsonPath)
    setDisplayMode(preset.displayMode)
    setUnit(preset.unit || '')
    setRefreshInterval(preset.refresh || 30)
  }

  /**
   * @brief Stores the JSON path picked by the user and switches to KPI display when the sample value is numeric.
   * @param path JSON path selected in the API response explorer.
   * @param sampleValue Optional sample value found at that path.
   */
  const handleSelectPath = (path: string, sampleValue?: any) => {
    setJsonPath(path)
    if (typeof sampleValue === 'number') {
      setDisplayMode('kpi')
    }
  }

  /**
   * @brief Resets every widget form field and selection to its initial default value.
   */
  const resetForm = () => {
    setTitle('Commits (total)')
    setCity('')
    setApiUrl('')
    setJsonPath('')
    setDisplayMode('kpi')
    setUnit('')
    setRefreshInterval(300)
    setSelectedSteamPreset('last_played')
    setSelectedCategory('Tous')
    setSearchQuery('')
    setSelectedGithubPreset('total_commits')
    setSelectedGithubCategory('Tous')
    setGithubSearchQuery('')
    setSelectedRepoFullName('')
    setSelectedOrgName('')
    setSelectedType('github')
    setWidth(1)
    setHeight(1)
  }

  /**
   * @brief Resets the form and closes the dialog without adding a widget.
   */
  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  /**
   * @brief Validates the form for the selected widget type, calls onAddWidget with the new widget data, then resets and closes the dialog.
   * @param e Optional form event whose default submission is prevented.
   */
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (selectedType === 'github') {
      if (!githubConnected) return
      onAddWidget({
        title: title.trim() || currentGithubPreset.title,
        type: 'github',
        githubMetric: currentGithubPreset.id,
        refreshIntervalSeconds: Math.max(300, refreshInterval || 300),
        repoFullName: selectedRepoFullName.trim() || undefined,
        orgName: selectedOrgName.trim() || undefined,
        dashboardId: activeDashboardId,
        width,
        height,
      })
    } else if (selectedType === 'steam') {
      if (!steamConnected) return
      onAddWidget({
        title: title.trim() || currentSteamPreset.title,
        type: 'steam',
        steamMetric: currentSteamPreset.id,
        refreshIntervalSeconds: Math.max(300, refreshInterval || 300),
        dashboardId: activeDashboardId,
        width,
        height,
      })
    } else if (selectedType === 'weather') {
      onAddWidget({
        title: title.trim() || 'Météo locale',
        type: 'weather',
        city: city.trim() || undefined,
        dashboardId: activeDashboardId,
        width,
        height,
      })
    } else if (selectedType === 'custom_api') {
      if (!apiUrl.trim() || !jsonPath.trim()) return
      onAddWidget({
        title: title.trim() || 'Métrique API',
        type: 'custom_api',
        apiUrl: apiUrl.trim(),
        jsonPath: jsonPath.trim(),
        displayMode,
        unit: unit.trim() || undefined,
        refreshIntervalSeconds: refreshInterval || 30,
        dashboardId: activeDashboardId,
        width,
        height,
      })
    }

    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[98vw] max-w-[1540px] h-[94vh] max-h-[94vh] p-0 flex flex-col overflow-hidden sm:max-w-none gap-0 border-border/80 shadow-2xl bg-background"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Éditeur de widget</DialogTitle>
          <DialogDescription>
            Configurez et prévisualisez vos widgets en direct avant de les ajouter au tableau de bord.
          </DialogDescription>
        </DialogHeader>

        <header className="h-14 px-5 border-b border-border/70 flex items-center justify-between bg-card/80 shrink-0 select-none">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80 hover:text-foreground transition-colors cursor-pointer">
              Tableau de bord
            </span>
            <span>/</span>
            <span className="text-foreground/90 font-medium">Éditeur de panneau</span>
            <span>/</span>
            <Badge
              variant="outline"
              className={`text-[11px] font-semibold py-0.5 px-2 gap-1.5 ${
                selectedType === 'github'
                  ? 'border-purple-500/50 text-purple-500 bg-purple-500/10'
                  : selectedType === 'steam'
                  ? 'border-primary/50 text-primary bg-primary/10'
                  : selectedType === 'weather'
                  ? 'border-sky-500/50 text-sky-500 bg-sky-500/10'
                  : 'border-amber-500/50 text-amber-500 bg-amber-500/10'
              }`}
            >
              {selectedType === 'github' && <GitBranch className="size-3.5" />}
              {selectedType === 'steam' && <Gamepad2 className="size-3.5" />}
              {selectedType === 'weather' && <CloudSun className="size-3.5" />}
              {selectedType === 'custom_api' && <Activity className="size-3.5" />}
              <span>
                {selectedType === 'github'
                  ? `GitHub • ${currentGithubPreset.title}`
                  : selectedType === 'steam'
                  ? `Steam • ${currentSteamPreset.title}`
                  : selectedType === 'weather'
                  ? 'Météo'
                  : 'API JSON'}
              </span>
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="cursor-pointer text-xs h-9 px-3.5 text-muted-foreground hover:text-foreground"
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleSubmit()}
              disabled={
                (selectedType === 'github' && !githubConnected) ||
                (selectedType === 'steam' && !steamConnected)
              }
              className="cursor-pointer text-xs h-9 px-4 gap-2 font-semibold shadow-sm"
            >
              <PlusCircle className="size-4" />
              Ajouter au tableau de bord
            </Button>
          </div>
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          <div className="lg:col-span-8 flex flex-col min-h-0 border-r border-border/70 bg-muted/5">
            <div className="flex-1 min-h-[340px] flex flex-col overflow-hidden bg-background/40 relative">
              <div className="h-10 px-4 border-b border-border/50 flex items-center justify-between bg-muted/20 text-xs shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <Eye className="size-4 text-primary" />
                  <span className="font-semibold text-foreground">Aperçu en direct</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground truncate max-w-[260px]">
                    {title.trim() || (selectedType === 'github' ? currentGithubPreset.title : currentSteamPreset.title)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 font-medium"
                  >
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Données réelles
                  </Badge>
                  {(selectedType === 'steam' || selectedType === 'github') && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Cycle min. 5 min
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto bg-[radial-gradient(#80808018_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="w-full max-w-[420px] shadow-2xl transition-all duration-300">
                  {selectedType === 'github' ? (
                    githubLoading ? (
                      <div className="p-8 rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <RefreshCw className="size-7 animate-spin text-purple-500" />
                        <span className="text-xs">Chargement des données GitHub...</span>
                      </div>
                    ) : !githubConnected ? (
                      <GithubPatForm onConnected={refreshStatuses} />
                    ) : (
                      <GithubWidget
                        widget={{
                          id: 'preview-github',
                          title: title.trim() || currentGithubPreset.title,
                          type: 'github',
                          githubMetric: selectedGithubPreset,
                          refreshIntervalSeconds: Math.max(300, refreshInterval || 300),
                          repoFullName: selectedRepoFullName.trim() || undefined,
                          orgName: selectedOrgName.trim() || undefined,
                        }}
                      />
                    )
                  ) : selectedType === 'steam' ? (
                    steamLoading ? (
                      <div className="p-8 rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <RefreshCw className="size-7 animate-spin text-primary" />
                        <span className="text-xs">Chargement des données Steam...</span>
                      </div>
                    ) : !steamConnected ? (
                      <div className="p-6 rounded-xl border border-amber-500/40 bg-amber-500/10 text-center space-y-3">
                        <Lock className="size-8 text-amber-500 mx-auto" />
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Connexion requise</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Liez votre compte Steam pour prévisualiser vos données en direct.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="gap-2 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer mx-auto"
                          onClick={() => {
                            window.location.href = getSteamAuthRedirectUrl()
                          }}
                        >
                          <Gamepad2 className="size-4" />
                          Lier mon compte Steam
                        </Button>
                      </div>
                    ) : (
                      <SteamWidget
                        widget={{
                          id: 'preview-steam',
                          title: title.trim() || currentSteamPreset.title,
                          type: 'steam',
                          steamMetric: selectedSteamPreset,
                          refreshIntervalSeconds: Math.max(300, refreshInterval || 300),
                        }}
                      />
                    )
                  ) : selectedType === 'weather' ? (
                    <WeatherWidget city={city.trim() || undefined} />
                  ) : (
                    <CustomApiWidget
                      apiUrl={apiUrl.trim() || 'http://127.0.0.1:8000/api/v1/health'}
                      jsonPath={jsonPath.trim() || 'status'}
                      displayMode={displayMode}
                      unit={unit.trim() || undefined}
                      refreshIntervalSeconds={refreshInterval}
                      title={title.trim() || 'Métrique API'}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="h-[280px] border-t border-border/70 bg-card/50 p-4 overflow-y-auto shrink-0 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Paramètres & Configuration du panneau
                  </h4>
                </div>
                {selectedType === 'github' && githubConnected && githubProfile && (
                  <div className="flex items-center gap-2">
                    {githubProfile.avatar_url || githubProfile.avatar ? (
                      <img
                        src={githubProfile.avatar_url || githubProfile.avatar}
                        alt=""
                        className="size-5 rounded-full border border-purple-500"
                      />
                    ) : (
                      <GitBranch className="size-4 text-purple-500" />
                    )}
                    <span className="text-xs font-semibold text-foreground">
                      {githubProfile.name || githubProfile.login || githubProfile.username}
                    </span>
                    <Badge variant="outline" className="text-[9px] border-purple-500/40 text-purple-500 py-0 px-1.5">
                      Lié
                    </Badge>
                  </div>
                )}
                {selectedType === 'steam' && steamConnected && steamProfile && (
                  <div className="flex items-center gap-2">
                    {steamProfile.avatar ? (
                      <img
                        src={steamProfile.avatar}
                        alt=""
                        className="size-5 rounded-full border border-emerald-500"
                      />
                    ) : (
                      <Gamepad2 className="size-4 text-emerald-500" />
                    )}
                    <span className="text-xs font-semibold text-foreground">
                      {steamProfile.username}
                    </span>
                    <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-500 py-0 px-1.5">
                      Lié
                    </Badge>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <InputField
                    label="Titre affiché sur le widget"
                    placeholder="Ex: Mon dernier jeu, Météo maison..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <RefreshField
                    label="Cycle de rafraîchissement (sec)"
                    value={refreshInterval}
                    onChange={(val) =>
                      setRefreshInterval(
                        selectedType === 'steam' || selectedType === 'github'
                          ? Math.max(300, val)
                          : val
                      )
                    }
                  />
                </div>
              </div>

              {selectedType === 'github' && (
                <GithubParamsForm
                  selectedPreset={selectedGithubPreset}
                  githubStats={githubStats}
                  selectedRepoFullName={selectedRepoFullName}
                  selectedOrgName={selectedOrgName}
                  onRepoChange={setSelectedRepoFullName}
                  onOrgChange={setSelectedOrgName}
                />
              )}

              {selectedType === 'weather' && (
                <div className="space-y-1.5">
                  <InputField
                    label="Ville pour la météo"
                    placeholder="Ex: Paris, Tokyo, New York (laisser vide pour géolocalisation auto)"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Si le champ est laissé vide, votre position géographique approximative sera utilisée.
                  </p>
                </div>
              )}

              {selectedType === 'custom_api' && (
                <CustomApiParamsForm
                  apiUrl={apiUrl}
                  jsonPath={jsonPath}
                  displayMode={displayMode}
                  unit={unit}
                  onApiUrlChange={setApiUrl}
                  onJsonPathChange={setJsonPath}
                  onDisplayModeChange={setDisplayMode}
                  onUnitChange={setUnit}
                  onApplyPreset={handleApplyApiPreset}
                  onSelectPath={handleSelectPath}
                />
              )}

              <div className="pt-3 border-t border-border/60">
                <WidgetDimensionSelector
                  width={width}
                  height={height}
                  onChange={(w, h) => {
                    setWidth(w)
                    setHeight(h)
                  }}
                  showPreview={false}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col min-h-0 bg-card/60 p-4 space-y-3 overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Visualisations</h3>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {selectedType === 'github'
                  ? '28 métriques GitHub'
                  : selectedType === 'steam'
                  ? '15 métriques Steam'
                  : 'Service prêt'}
              </span>
            </div>

            <div className="grid grid-cols-4 p-1 bg-muted/70 rounded-xl border border-border/70 shrink-0 gap-1">
              <button
                type="button"
                onClick={() => handleSelectType('github')}
                className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  selectedType === 'github'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <GitBranch className="size-3.5 text-purple-500" />
                <span className="truncate">GitHub</span>
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 font-bold">
                  28
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => handleSelectType('steam')}
                className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  selectedType === 'steam'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Gamepad2 className="size-3.5 text-primary" />
                <span className="truncate">Steam</span>
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 font-bold">
                  15
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => handleSelectType('weather')}
                className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  selectedType === 'weather'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CloudSun className="size-3.5 text-sky-500" />
                <span className="truncate">Météo</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectType('custom_api')}
                className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  selectedType === 'custom_api'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Activity className="size-3.5 text-amber-500" />
                <span className="truncate">API</span>
              </button>
            </div>

            {selectedType === 'github' && (
              <GithubPresetCatalog
                selectedPresetId={selectedGithubPreset}
                selectedCategory={selectedGithubCategory}
                searchQuery={githubSearchQuery}
                onSelectCategory={setSelectedGithubCategory}
                onSearchChange={setGithubSearchQuery}
                onSelectPreset={handleSelectGithubPreset}
              />
            )}

            {selectedType === 'steam' && (
              <SteamPresetCatalog
                selectedPresetId={selectedSteamPreset}
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
                onSelectCategory={setSelectedCategory}
                onSearchChange={setSearchQuery}
                onSelectPreset={handleSelectSteamPreset}
              />
            )}

            {selectedType === 'weather' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-muted/20 rounded-xl border border-border/50">
                <CloudSun className="size-10 text-sky-500" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-xs text-foreground">Widget Météo Direct</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Température, ressentie, vent et icône météo dynamique alimentés par Open-Meteo sans clé requise.
                  </p>
                </div>
              </div>
            )}

            {selectedType === 'custom_api' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-muted/20 rounded-xl border border-border/50">
                <Activity className="size-10 text-amber-500" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-xs text-foreground">API JSON Universelle</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Raccordez n'importe quelle API REST externe et extrayez la donnée de votre choix grâce à l'explorateur JSON Path.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddWidgetDialog
