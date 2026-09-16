import * as React from 'react'
import { useState, useEffect } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { InputField } from '@/components/ui/input-field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  CloudSun,
  Activity,
  Gamepad2,
  Trophy,
  Clock,
  Flame,
  Shield,
  Award,
  Sparkles,
  BarChart3,
  Inbox,
  Layers,
  Lock,
  Check,
  RefreshCw,
  PlusCircle,
  Eye,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import type { NewWidgetData, WidgetType, SteamMetricType } from '@/types/widget'
import { JsonPathPicker } from './JsonPathPicker'
import { RefreshField } from '@/components/ui/refresh-field'
import { fetchSteamStatus, getSteamAuthRedirectUrl } from '@/services/api'
import { SteamWidget } from './widgets/SteamWidget'
import { WeatherWidget } from './widgets/WeatherWidget'
import { CustomApiWidget } from './widgets/CustomApiWidget'

export interface AddWidgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddWidget: (data: NewWidgetData) => void
}

interface SteamPreset {
  id: SteamMetricType
  title: string
  description: string
  category: string
  icon: any
  icon: React.ComponentType<{ className?: string }>
  defaultInterval: number
}

const STEAM_PRESETS: SteamPreset[] = [
  {
    id: 'last_played',
    title: 'Dernier jeu joué',
    description: 'Affiche la jaquette HD, le titre et le temps récent du dernier jeu lancé.',
    category: 'Activité',
    icon: Gamepad2,
    defaultInterval: 300,
  },
  {
    id: 'most_played',
    title: 'Jeu le plus joué',
    description: 'Votre titre favori de tous les temps avec le total d’heures accumulées.',
    category: 'Records',
    icon: Trophy,
    defaultInterval: 300,
  },
  {
    id: 'games_count',
    title: 'Taille de la bibliothèque',
    description: 'Nombre global de jeux possédés et ratio joués / jamais lancés.',
    category: 'Bibliothèque',
    icon: Layers,
    defaultInterval: 300,
  },
  {
    id: 'total_playtime',
    title: 'Heures de jeu cumulées',
    description: 'Temps de jeu global cumulé sur Steam (converti en jours de jeu).',
    category: 'Statistiques',
    icon: Clock,
    defaultInterval: 300,
  },
  {
    id: 'recent_playtime',
    title: 'Activité récente (14j)',
    description: 'Heures de jeu passées ces deux dernières semaines sur la plateforme.',
    category: 'Activité',
    icon: Flame,
    defaultInterval: 300,
  },
  {
    id: 'steam_level',
    title: 'Niveau Steam',
    description: 'Badge de niveau officiel de votre profil Steam avec points XP.',
    category: 'Profil',
    icon: Shield,
    defaultInterval: 300,
  },
  {
    id: 'profile_status',
    title: 'Statut & Profil en direct',
    description: 'Avatar, pseudo et statut en temps réel (En jeu, En ligne, Hors ligne).',
    category: 'Profil',
    icon: Activity,
    defaultInterval: 300,
  },
  {
    id: 'badges_count',
    title: 'Nombre de badges',
    description: 'Nombre de badges d’événements et de jeux débloqués.',
    category: 'Profil',
    icon: Award,
    defaultInterval: 300,
  },
  {
    id: 'player_xp',
    title: 'Points d’expérience (XP)',
    description: 'Totalité des points d’expérience accumulés sur votre profil.',
    category: 'Profil',
    icon: Sparkles,
    defaultInterval: 300,
  },
  {
    id: 'next_level_progress',
    title: 'Progression prochain niveau',
    description: 'Barre de progression et points XP manquants pour le niveau supérieur.',
    category: 'Niveau',
    icon: BarChart3,
    defaultInterval: 300,
  },
  {
    id: 'top_3_played',
    title: 'Top 3 des jeux favoris',
    description: 'Podium #1, #2 et #3 de vos jeux les plus joués de votre histoire.',
    category: 'Classement',
    icon: Trophy,
    defaultInterval: 300,
  },
  {
    id: 'top_3_recent',
    title: 'Top 3 des jeux récents',
    description: 'Les 3 jeux auxquels vous avez le plus joué ces 14 derniers jours.',
    category: 'Activité',
    icon: Flame,
    defaultInterval: 300,
  },
  {
    id: 'unplayed_games',
    title: 'Backlog (Jamais lancés)',
    description: 'Carrousel animé des jeux possédés n’ayant jamais été lancés (0h).',
    category: 'Bibliothèque',
    icon: Inbox,
    defaultInterval: 300,
  },
  {
    id: 'avg_playtime_per_game',
    title: 'Moyenne d’heures par jeu',
    description: 'Moyenne horaire de jeu calculée sur l’ensemble de votre catalogue.',
    category: 'Statistiques',
    icon: BarChart3,
    defaultInterval: 300,
  },
  {
    id: 'recent_games_count',
    title: 'Jeux actifs récents',
    description: 'Titres distincts lancés sur les 14 jours avec liste déroulante.',
    category: 'Activité',
    icon: Gamepad2,
    defaultInterval: 300,
  },
]

export function AddWidgetDialog({
  open,
  onOpenChange,
  onAddWidget,
}: AddWidgetDialogProps) {
  // Steam par défaut
  const [selectedType, setSelectedType] = useState<WidgetType>('steam')

  // Common
  const [title, setTitle] = useState('Dernier jeu joué')

  // Weather
  const [city, setCity] = useState('')

  // Custom API
  const [apiUrl, setApiUrl] = useState('')
  const [jsonPath, setJsonPath] = useState('')
  const [displayMode, setDisplayMode] = useState<'kpi' | 'gauge'>('kpi')
  const [unit, setUnit] = useState('')
  const [refreshInterval, setRefreshInterval] = useState<number>(300)

  // Steam
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

  // Vérification statut Steam à l'ouverture
  useEffect(() => {
    if (open) {
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
        .finally(() => {
          setSteamLoading(false)
        })
    }
  }, [open])

  const currentSteamPreset = useMemo(() => {
    return STEAM_PRESETS.find((p) => p.id === selectedSteamPreset) || STEAM_PRESETS[0]
  }, [selectedSteamPreset])

  const handleApplyApiPreset = (preset: {
    title: string
    apiUrl: string
    jsonPath: string
    refresh: number
    displayMode: 'kpi' | 'gauge'
    unit: string
  }) => {
    setTitle(preset.title)
    setApiUrl(preset.apiUrl)
    setJsonPath(preset.jsonPath)
    setRefreshInterval(preset.refresh)
    setDisplayMode(preset.displayMode)
    setUnit(preset.unit)
  }

  const handleSelectPath = (path: string, _previewValue: any, suggestedMode?: 'kpi' | 'gauge') => {
    setJsonPath(path)
    if (suggestedMode) {
      setDisplayMode(suggestedMode)
    }
    if (!title.trim()) {
      const parts = path.split('.')
      const name = parts[parts.length - 1]
      setTitle(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }

  const handleSelectSteamPreset = (preset: SteamPreset) => {
    setSelectedSteamPreset(preset.id)
    setTitle(preset.title)
    setRefreshInterval(preset.defaultInterval || 300)
  }

  const handleSelectType = (type: WidgetType) => {
    setSelectedType(type)
    if (type === 'steam') {
      setTitle(currentSteamPreset.title)
      setRefreshInterval(currentSteamPreset.defaultInterval || 300)
    } else if (type === 'weather') {
      setTitle('Météo locale')
    } else if (type === 'custom_api') {
      setTitle('Métrique API')
      setRefreshInterval(30)
    }
  }

  const resetForm = () => {
    setTitle('Dernier jeu joué')
    setCity('')
    setApiUrl('')
    setJsonPath('')
    setDisplayMode('kpi')
    setUnit('')
    setRefreshInterval(300)
    setSelectedSteamPreset('last_played')
    setSelectedCategory('Tous')
    setSearchQuery('')
    setSelectedType('steam')
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (selectedType === 'steam') {
      if (!steamConnected) return
      const preset = STEAM_PRESETS.find((p) => p.id === selectedSteamPreset) || STEAM_PRESETS[0]
      onAddWidget({
        title: title.trim() || preset.title,
        title: title.trim() || currentSteamPreset.title,
        type: 'steam',
        steamMetric: preset.id,
        steamMetric: currentSteamPreset.id,
        refreshIntervalSeconds: Math.max(300, refreshInterval || 300),
      })
    } else if (selectedType === 'weather') {
      onAddWidget({
        title: title.trim() || 'Météo locale',
        type: 'weather',
        city: city.trim() || undefined,
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
      })
    }

    resetForm()
    onOpenChange(false)
  }

  const categories = [
    { label: 'Tous', count: 15 },
    { label: 'Activité', count: 4 },
    { label: 'Profil', count: 4 },
    { label: 'Bibliothèque', count: 2 },
    { label: 'Statistiques', count: 2 },
    { label: 'Records', count: 1 },
    { label: 'Classement', count: 1 },
    { label: 'Niveau', count: 1 },
  ]

  const filteredPresets = selectedCategory === 'Tous'
    ? STEAM_PRESETS
    : STEAM_PRESETS.filter((p) => p.category === selectedCategory)
  const filteredSteamPresets = useMemo(() => {
    return STEAM_PRESETS.filter((p) => {
      const matchCategory = selectedCategory === 'Tous' || p.category === selectedCategory
      const matchQuery =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchQuery
    })
  }, [selectedCategory, searchQuery])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] md:max-w-[820px] max-h-[88vh] flex flex-col p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <PlusCircle className="size-5 text-primary" />
            <DialogTitle className="text-xl font-bold">Ajouter un widget</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Choisissez un service ou connectez une source de données pour enrichir votre tableau de bord.
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

        <form onSubmit={handleSubmit} className="space-y-4 py-2 flex-1 flex flex-col min-h-0">
          <Tabs
            value={selectedType}
            onValueChange={(val) => {
              const nextType = val as WidgetType
              setSelectedType(nextType)
              if (nextType === 'steam') {
                const preset = STEAM_PRESETS.find((p) => p.id === selectedSteamPreset) || STEAM_PRESETS[0]
                setTitle(preset.title)
                setRefreshInterval(preset.defaultInterval || 300)
              } else if (nextType === 'weather') {
                setTitle('Météo locale')
              } else if (nextType === 'custom_api') {
                setTitle('Métrique API')
                setRefreshInterval(30)
              }
            }}
            className="w-full flex-1 flex flex-col min-h-0"
          >
            {/* 3 Onglets : Steam (15) en 1er, Météo en 2e, API JSON en dernier */}
            <TabsList className="grid grid-cols-3 w-full h-12 p-1 bg-muted/60 rounded-xl border border-border/60 shrink-0">
              <TabsTrigger
                value="steam"
                className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-all"
        {/* TOP BAR STYLE GRAFANA */}
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
                selectedType === 'steam'
                  ? 'border-primary/50 text-primary bg-primary/10'
                  : selectedType === 'weather'
                  ? 'border-sky-500/50 text-sky-500 bg-sky-500/10'
                  : 'border-amber-500/50 text-amber-500 bg-amber-500/10'
              }`}
            >
              {selectedType === 'steam' && <Gamepad2 className="size-3.5" />}
              {selectedType === 'weather' && <CloudSun className="size-3.5" />}
              {selectedType === 'custom_api' && <Activity className="size-3.5" />}
              <span>
                {selectedType === 'steam'
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
              disabled={selectedType === 'steam' && !steamConnected}
              className="cursor-pointer text-xs h-9 px-4 gap-2 font-semibold shadow-sm"
            >
              <PlusCircle className="size-4" />
              Ajouter au tableau de bord
            </Button>
          </div>
        </header>

        {/* CORPS PRINCIPAL : SPLIT VIEW 2 COLONNES GRAFANA */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* COLONNE GAUCHE (8 COLS) : APERÇU EN DIRECT (HAUT) + ÉDITEUR DE PARAMÈTRES (BAS) */}
          <div className="lg:col-span-8 flex flex-col min-h-0 border-r border-border/70 bg-muted/5">
            {/* SCÈNE DE PRÉVISUALISATION (CANVAS HAUT) */}
            <div className="flex-1 min-h-[340px] flex flex-col overflow-hidden bg-background/40 relative">
              {/* Toolbar du canvas */}
              <div className="h-10 px-4 border-b border-border/50 flex items-center justify-between bg-muted/20 text-xs shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <Eye className="size-4 text-primary" />
                  <span className="font-semibold text-foreground">Aperçu en direct</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground truncate max-w-[260px]">
                    {title.trim() || currentSteamPreset.title}
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
                  {selectedType === 'steam' && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Cycle min. 5 min
                    </Badge>
                  )}
                </div>
              </div>

              {/* Scène de rendu du widget avec quadrillage stylisé */}
              <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto bg-[radial-gradient(#80808018_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="w-full max-w-[420px] shadow-2xl transition-all duration-300">
                  {selectedType === 'steam' ? (
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

            {/* ÉDITEUR DE PARAMÈTRES / QUERY EDITOR (BAS) */}
            <div className="h-[280px] border-t border-border/70 bg-card/50 p-4 overflow-y-auto shrink-0 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Paramètres & Configuration du panneau
                  </h4>
                </div>
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

              {/* LIGNE COMMUNE : TITRE & CYCLE */}
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
                      setRefreshInterval(selectedType === 'steam' ? Math.max(300, val) : val)
                    }
                  />
                </div>
              </div>

              {/* CHAMPS SPÉCIFIQUES SELON SERVICE */}
              {selectedType === 'steam' && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-start gap-3 text-xs">
                  <Shield className="size-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-foreground">
                      Métrique active : {currentSteamPreset.title} ({currentSteamPreset.category})
                    </p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {currentSteamPreset.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium pt-0.5">
                      🔒 Protection de quota : rafraîchissement borné à 5 minutes (300 secondes) minimum.
                    </p>
                  </div>
                </div>
              )}

              {selectedType === 'weather' && (
                <div className="space-y-2">
                  <InputField
                    label="Ville spécifique (optionnel)"
                    placeholder="Ex: Paris, Lyon, Bordeaux, Marseille..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    description="Laissez vide pour détecter automatiquement votre localisation."
                  />
                </div>
              )}

              {selectedType === 'custom_api' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground font-medium">Modèles rapides :</span>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-muted text-xs py-1 px-2.5"
                      onClick={() =>
                        handleApplyApiPreset({
                          title: 'Santé Serveur Backend',
                          apiUrl: 'http://127.0.0.1:8000/api/v1/health',
                          refresh: 15,
                          jsonPath: 'status',
                          displayMode: 'kpi',
                          unit: '',
                        })
                      }
                    >
                      ⚡ Santé API FastAPI
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-muted text-xs py-1 px-2.5"
                      onClick={() =>
                        handleApplyApiPreset({
                          title: 'Wishlist Steam',
                          apiUrl:
                            'https://api.steampowered.com/IWishlistService/GetWishlist/v1/?steamid=76561199802292886',
                          jsonPath: 'response.items.length',
                          displayMode: 'kpi',
                          refresh: 60,
                          unit: 'jeux',
                        })
                      }
                    >
                      🎮 Wishlist Steam
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField
                      label="URL de l'API (GET)"
                      placeholder="https://api.example.com/data"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      required
                    />
                    <InputField
                      label="Chemin JSON (Path)"
                      placeholder="status ou response.data.count"
                      value={jsonPath}
                      onChange={(e) => setJsonPath(e.target.value)}
                      required
                    />
                  </div>

                  {apiUrl.trim().length > 5 && (
                    <JsonPathPicker
                      apiUrl={apiUrl}
                      selectedPath={jsonPath}
                      onSelectPath={handleSelectPath}
                      className="p-3 rounded-xl border border-border bg-muted/20"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Unité affichée (optionnelle)"
                      placeholder="Ex: ms, %, €, FPS..."
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    />
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">Mode d'affichage</span>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={displayMode === 'kpi' ? 'default' : 'outline'}
                          size="sm"
                          className="cursor-pointer text-xs h-9"
                          onClick={() => setDisplayMode('kpi')}
                        >
                          KPI
                        </Button>
                        <Button
                          type="button"
                          variant={displayMode === 'gauge' ? 'default' : 'outline'}
                          size="sm"
                          className="cursor-pointer text-xs h-9"
                          onClick={() => setDisplayMode('gauge')}
                        >
                          Jauge (0-100%)
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE (4 COLS) : CATALOGUE DE VISUALISATIONS (STYLE GRAFANA) */}
          <div className="lg:col-span-4 flex flex-col min-h-0 bg-card/60 p-4 space-y-3 overflow-hidden">
            {/* Header Visualisations */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Visualisations</h3>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {selectedType === 'steam' ? '15 métriques Steam' : 'Service prêt'}
              </span>
            </div>

            {/* SÉLECTEUR DE SERVICES (3 TABS) */}
            <div className="grid grid-cols-3 p-1 bg-muted/70 rounded-xl border border-border/70 shrink-0 gap-1">
              <button
                type="button"
                onClick={() => handleSelectType('steam')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  selectedType === 'steam'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Gamepad2 className="size-4 text-primary" />
                <Gamepad2 className="size-3.5 text-primary" />
                <span>Steam</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5 font-bold">
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 font-bold">
                  15
                </Badge>
              </TabsTrigger>
              </button>

              <TabsTrigger
                value="weather"
                className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-all"
              <button
                type="button"
                onClick={() => handleSelectType('weather')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  selectedType === 'weather'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CloudSun className="size-4 text-sky-500" />
                <CloudSun className="size-3.5 text-sky-500" />
                <span>Météo</span>
              </TabsTrigger>
              </button>

              <TabsTrigger
                value="custom_api"
                className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-all"
              <button
                type="button"
                onClick={() => handleSelectType('custom_api')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  selectedType === 'custom_api'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Activity className="size-4 text-amber-500" />
                <Activity className="size-3.5 text-amber-500" />
                <span>API JSON</span>
              </TabsTrigger>
            </TabsList>
              </button>
            </div>

            {/* 1. ONGLET STEAM (15 PRESETS) */}
            <TabsContent value="steam" className="space-y-3.5 pt-3 flex-1 overflow-y-auto pr-1">
              {steamLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2 text-muted-foreground">
                  <RefreshCw className="size-6 animate-spin text-primary" />
                  <span className="text-xs">Vérification de votre compte Steam...</span>
            {/* CONTENU CATALOGUE SELON TYPE SÉLECTIONNÉ */}
            {selectedType === 'steam' && (
              <div className="flex-1 min-h-0 flex flex-col space-y-2.5 overflow-hidden">
                {/* Barre de recherche dans les presets */}
                <div className="relative shrink-0">
                  <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher une métrique..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border/70 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              ) : !steamConnected ? (
                // Compte NON connecté : Alerte & blocage propre
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-start gap-3.5">
                    <div className="p-2.5 rounded-full bg-amber-500/20 text-amber-500 shrink-0">
                      <Lock className="size-5" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">Compte Steam non lié</h4>
                        <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600 dark:text-amber-400">
                          Connexion requise
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Pour ajouter vos widgets Steam personnalisés, associez d'abord votre profil Steam à INTER-NET via l'authentification officielle de Valve.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer mt-1"
                        onClick={() => {
                          window.location.href = getSteamAuthRedirectUrl()
                        }}
                      >
                        <Gamepad2 className="size-4" />
                        Lier mon compte Steam
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Aperçu des 15 widgets disponibles après connexion :
                    </span>
                    <div className="grid grid-cols-2 gap-2 opacity-50 pointer-events-none">
                      {STEAM_PRESETS.slice(0, 6).map((preset) => {
                        const Icon = preset.icon
                        return (
                          <div
                            key={preset.id}
                            className="p-3 rounded-lg border border-border bg-muted/20 flex items-start gap-2.5"
                          >
                            <div className="p-2 rounded-md bg-muted text-muted-foreground shrink-0">
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-foreground truncate">{preset.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{preset.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                {/* Filtres par catégories (pilules horizontales) */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs shrink-0 no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setSelectedCategory(cat.label)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        selectedCategory === cat.label
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-[9px] opacity-80">{cat.count}</span>
                    </button>
                  ))}
                </div>
              ) : (
                // Compte CONNECTÉ : Choix ergonomique parmi les 15 widgets
                <div className="space-y-3">
                  {/* Bandeau profil Steam connecté */}
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {steamProfile?.avatar ? (
                        <img
                          src={steamProfile.avatar}
                          alt=""
                          className="size-8 rounded-full border-2 border-emerald-500 shrink-0"
                        />
                      ) : (
                        <Gamepad2 className="size-6 text-emerald-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-[11px] text-muted-foreground block leading-tight">
                          Compte Steam actif
                        </span>
                        <span className="font-bold text-sm text-foreground truncate block">
                          {steamProfile?.username || 'Joueur Steam'}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[11px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 gap-1.5 py-1 px-2.5 font-medium">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      Connecté & Prêt
                    </Badge>
                  </div>

                  {/* Filtres par catégories */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setSelectedCategory(cat.label)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          selectedCategory === cat.label
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                {/* Liste des cartes de visualisations Steam (défilable) */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                  {filteredSteamPresets.map((preset) => {
                    const Icon = preset.icon
                    const isSelected = selectedSteamPreset === preset.id
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectSteamPreset(preset)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative text-left group ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-sm'
                            : 'border-border/70 bg-card hover:bg-muted/40 hover:border-border'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`text-[10px] px-1 py-0 rounded ${
                            selectedCategory === cat.label
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-background/80 text-muted-foreground'
                          }`}
                        >
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Grille des presets Steam */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {filteredPresets.map((preset) => {
                      const Icon = preset.icon
                      const isSelected = selectedSteamPreset === preset.id
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectSteamPreset(preset)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-left relative group ${
                          className={`p-2 rounded-lg shrink-0 transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-sm'
                              : 'border-border/80 bg-card hover:bg-muted/40 hover:border-border'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground group-hover:text-foreground'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground group-hover:text-foreground'
                            }`}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1 pr-4">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                                {preset.title}
                              </p>
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                                {preset.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-snug">
                              {preset.description}
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-semibold text-xs text-foreground truncate">
                              {preset.title}
                            </p>
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                              {preset.category}
                            </Badge>
                          </div>
                          {isSelected && (
                            <div className="absolute top-3 right-3 text-primary">
                              <Check className="size-4" />
                            </div>
                          )}
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                            {preset.description}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Configuration avancée du preset sélectionné */}
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/70 space-y-2.5">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <InputField
                          label="Titre personnalisé sur le dashboard"
                          placeholder="Ex: Mon dernier jeu"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />
                        {isSelected && (
                          <div className="absolute top-3 right-3 text-primary">
                            <Check className="size-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <RefreshField
                          label="Cycle (secondes)"
                          value={refreshInterval}
                          onChange={(val) => setRefreshInterval(Math.max(300, val))}
                        />
                      </div>
                    )
                  })}
                  {filteredSteamPresets.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Aucune métrique ne correspond à votre recherche.
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Shield className="size-3.5 text-primary shrink-0" />
                      Protection des quotas Steam : cycle minimum de 5 minutes (300s) avec cache automatique.
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedType === 'weather' && (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 text-xs">
                <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/10 space-y-2">
                  <div className="flex items-center gap-2 text-sky-500 font-bold">
                    <CloudSun className="size-5" />
                    <span>Météo locale & mondiale</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Visualisez les conditions météo en direct : température, vent, humidité et prévisions horaires.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* 2. ONGLET MÉTÉO */}
            <TabsContent value="weather" className="space-y-4 pt-3 flex-1 overflow-y-auto pr-1">
              <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
                    <CloudSun className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Widget Météo en direct</h4>
                    <p className="text-xs text-muted-foreground">
                      Affiche la température, l'humidité, le vent et les prévisions locales.
                <div className="space-y-2">
                  <span className="font-semibold text-foreground uppercase tracking-wider text-[10px] block">
                    Fonctionnalités incluses
                  </span>
                  <div className="p-3 rounded-lg border border-border/70 bg-card/60 space-y-1.5">
                    <p className="font-medium text-foreground flex items-center gap-1.5">
                      <Check className="size-3.5 text-emerald-500" />
                      Géolocalisation automatique par IP
                    </p>
                    <p className="font-medium text-foreground flex items-center gap-1.5">
                      <Check className="size-3.5 text-emerald-500" />
                      Recherche par nom de ville
                    </p>
                    <p className="font-medium text-foreground flex items-center gap-1.5">
                      <Check className="size-3.5 text-emerald-500" />
                      Graphique de température (Sparkline)
                    </p>
                  </div>
                </div>

                <InputField
                  label="Nom du panneau"
                  placeholder="Ex: Météo locale, Bureau, Maison..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <InputField
                  label="Ville spécifique (optionnel)"
                  placeholder="Ex: Paris, Lyon, Bordeaux, Marseille..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  description="Laissez vide pour détecter automatiquement votre position géographique par IP/GPS."
                />
              </div>
            </TabsContent>
            )}

            {/* 3. ONGLET API JSON (EN DERNIER) */}
            <TabsContent value="custom_api" className="space-y-3.5 pt-3 flex-1 overflow-y-auto pr-1">
              {/* Presets rapides */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground font-medium text-xs">Modèles rapides :</span>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted text-xs py-1 px-2.5"
                  onClick={() =>
                    handleApplyApiPreset({
                      title: 'Statut Serveur Backend',
                      apiUrl: 'http://127.0.0.1:8000/api/v1/health',
                      refresh: 15,
                      jsonPath: 'status',
                      displayMode: 'kpi',
                      unit: '',
                    })
                  }
                >
                  ⚡ Santé API FastAPI
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted text-xs py-1 px-2.5"
                  onClick={() =>
                    handleApplyApiPreset({
                      title: 'Wishlist Steam',
                      apiUrl: 'https://api.steampowered.com/IWishlistService/GetWishlist/v1/?steamid=76561199802292886',
                      jsonPath: 'response.items.length',
                      displayMode: 'kpi',
                      refresh: 60,
                      unit: 'jeux',
                    })
                  }
                >
                  🎮 Wishlist Steam
                </Badge>
              </div>
            {selectedType === 'custom_api' && (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 text-xs">
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                  <div className="flex items-center gap-2 text-amber-500 font-bold">
                    <Activity className="size-5" />
                    <span>Visualisation API JSON</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Connectez n'importe quelle API REST publique ou interne et extrayez la donnée souhaitée avec le sélecteur d'arborescence JSON.
                  </p>
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField
                  label="Nom du panneau"
                  placeholder="Ex: Santé API"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <InputField
                  label="URL de l'API (GET)"
                  placeholder="https://api.example.com/data"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  required
                />
              </div>

              {apiUrl.trim().length > 5 && (
                <JsonPathPicker
                  apiUrl={apiUrl}
                  selectedPath={jsonPath}
                  onSelectPath={handleSelectPath}
                  className="p-3 rounded-xl border border-border bg-muted/20"
                />
              )}

              <InputField
                label="Chemin JSON (Path)"
                placeholder="status ou response.data.count"
                value={jsonPath}
                onChange={(e) => setJsonPath(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Unité affichée (optionnelle)"
                  placeholder="Ex: ms, %, €, FPS..."
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
                <RefreshField
                  label="Rafraîchissement (sec)"
                  value={refreshInterval}
                  onChange={(val) => setRefreshInterval(val)}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-foreground">
                  Mode d'affichage
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    type="button"
                    variant={displayMode === 'kpi' ? 'default' : 'outline'}
                    size="sm"
                    className="cursor-pointer text-xs h-9"
                <div className="space-y-2">
                  <span className="font-semibold text-foreground uppercase tracking-wider text-[10px] block">
                    Styles d'affichage supportés
                  </span>
                  <div
                    onClick={() => setDisplayMode('kpi')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      displayMode === 'kpi'
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border/70 bg-card hover:bg-muted/40'
                    }`}
                  >
                    Chiffre clé (KPI)
                  </Button>
                  <Button
                    type="button"
                    variant={displayMode === 'gauge' ? 'default' : 'outline'}
                    size="sm"
                    className="cursor-pointer text-xs h-9"
                    <p className="font-semibold text-foreground">Chiffre Clé (KPI)</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Affichage numérique en grand format avec statut et unité personnalisée.
                    </p>
                  </div>

                  <div
                    onClick={() => setDisplayMode('gauge')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      displayMode === 'gauge'
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border/70 bg-card hover:bg-muted/40'
                    }`}
                  >
                    Jauge Radiale (0-100%)
                  </Button>
                    <p className="font-semibold text-foreground">Jauge Radiale (0 - 100%)</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Visualisation d'un pourcentage ou niveau sur une jauge semi-circulaire colorée.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-3 border-t border-border/50 shrink-0 flex items-center justify-between sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={selectedType === 'steam' && !steamConnected}
              className="cursor-pointer gap-1.5 font-semibold"
            >
              <PlusCircle className="size-4" />
              Ajouter au tableau de bord
            </Button>
          </DialogFooter>
        </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddWidgetDialog
