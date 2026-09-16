import * as React from 'react'
import { useState, useEffect } from 'react'
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
  ExternalLink,
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
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import type { NewWidgetData, WidgetType, SteamMetricType } from '@/types/widget'
import { JsonPathPicker } from './JsonPathPicker'
import { RefreshField } from '@/components/ui/refresh-field'
import { fetchSteamStatus, getSteamAuthRedirectUrl } from '@/services/api'

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
  defaultInterval: number
}

const STEAM_PRESETS: SteamPreset[] = [
  {
    id: 'last_played',
    title: 'Dernier jeu joué',
    description: 'Affiche la jaquette, le titre et le temps récent du dernier jeu lancé.',
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
    description: 'Nombre et pourcentage de jeux possédés ayant 0 heure de jeu.',
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
    description: 'Nombre de jeux distincts lancés sur les 14 derniers jours.',
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
  const [selectedType, setSelectedType] = useState<WidgetType>('weather')

  // Common
  const [title, setTitle] = useState('')

  // Weather
  const [city, setCity] = useState('')

  // Custom API
  const [apiUrl, setApiUrl] = useState('')
  const [jsonPath, setJsonPath] = useState('')
  const [displayMode, setDisplayMode] = useState<'kpi' | 'gauge'>('kpi')
  const [unit, setUnit] = useState('')
  const [refreshInterval, setRefreshInterval] = useState<number>(30)

  // Default link
  const [url, setUrl] = useState('')

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

  // Check Steam connection status when dialog opens
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

  const handleApplyPreset = (preset: {
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
    setRefreshInterval(preset.defaultInterval)
  }

  const resetForm = () => {
    setTitle('')
    setCity('')
    setApiUrl('')
    setJsonPath('')
    setDisplayMode('kpi')
    setUnit('')
    setRefreshInterval(30)
    setUrl('')
    setSelectedSteamPreset('last_played')
    setSelectedCategory('Tous')
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedType === 'weather') {
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
    } else if (selectedType === 'steam') {
      if (!steamConnected) return
      const preset = STEAM_PRESETS.find((p) => p.id === selectedSteamPreset) || STEAM_PRESETS[0]
      onAddWidget({
        title: title.trim() || preset.title,
        type: 'steam',
        steamMetric: preset.id,
        refreshIntervalSeconds: Math.max(300, refreshInterval || 300),
      })
    } else {

      if (!title.trim()) return
      onAddWidget({
        title: title.trim(),
        type: 'default',
        url: url.trim() || undefined,
      })
    }

    resetForm()
    onOpenChange(false)
  }

  const categories = ['Tous', 'Activité', 'Profil', 'Bibliothèque', 'Statistiques', 'Records', 'Classement', 'Niveau']
  const filteredPresets = selectedCategory === 'Tous'
    ? STEAM_PRESETS
    : STEAM_PRESETS.filter((p) => p.category === selectedCategory)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajouter un widget</DialogTitle>
          <DialogDescription>
            Choisissez le type de panneau et configurez sa source de données.
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
                setRefreshInterval(preset.defaultInterval)
              }
            }}
            className="w-full flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid grid-cols-4 w-full h-10 shrink-0">
              <TabsTrigger value="weather" className="flex items-center gap-1.5 text-xs cursor-pointer">
                <CloudSun className="size-4" />
                Météo
              </TabsTrigger>
              <TabsTrigger value="custom_api" className="flex items-center gap-1.5 text-xs cursor-pointer">
                <Activity className="size-4" />
                API JSON
              </TabsTrigger>
              <TabsTrigger value="steam" className="flex items-center gap-1.5 text-xs cursor-pointer font-medium">
                <Gamepad2 className="size-4 text-primary" />
                Steam (15)
              </TabsTrigger>
              <TabsTrigger value="default" className="flex items-center gap-1.5 text-xs cursor-pointer">
                <ExternalLink className="size-4" />
                Raccourci
              </TabsTrigger>
            </TabsList>

            {/* Onglet Steam (15 Presets) */}
            <TabsContent value="steam" className="space-y-3 pt-3 flex-1 overflow-y-auto pr-1">
              {steamLoading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2 text-muted-foreground">
                  <RefreshCw className="size-6 animate-spin text-primary" />
                  <span className="text-xs">Vérification de la connexion Steam...</span>
                </div>
              ) : !steamConnected ? (
                // Steam NON connecté : avertissement et blocage
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-start gap-3.5">
                    <div className="p-2 rounded-full bg-amber-500/20 text-amber-500 shrink-0 mt-0.5">
                      <Lock className="size-5" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        Compte Steam non lié
                        <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600 dark:text-amber-400">
                          Connexion requise
                        </Badge>
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Pour ajouter et utiliser les 15 widgets Steam en temps réel, vous devez d'abord associer votre profil Steam à INTER-NET.
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

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Aperçu des 15 presets disponibles après connexion :
                    </span>
                    <div className="grid grid-cols-2 gap-2 opacity-50 pointer-events-none">
                      {STEAM_PRESETS.slice(0, 6).map((preset) => {
                        const Icon = preset.icon
                        return (
                          <div
                            key={preset.id}
                            className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-start gap-2.5"
                          >
                            <div className="p-1.5 rounded-md bg-muted text-muted-foreground shrink-0">
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
                </div>
              ) : (
                // Steam CONNECTÉ : Choix des 15 presets
                <div className="space-y-3.5">
                  {/* Bandeau profil Steam connecté */}
                  <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {steamProfile?.avatar ? (
                        <img
                          src={steamProfile.avatar}
                          alt=""
                          className="size-7 rounded-full border border-emerald-500 shrink-0"
                        />
                      ) : (
                        <Gamepad2 className="size-5 text-emerald-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-[11px] text-muted-foreground block leading-tight">
                          Connecté en tant que
                        </span>
                        <span className="font-bold text-xs text-foreground truncate block">
                          {steamProfile?.username || 'Joueur Steam'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Temps réel actif
                      </Badge>
                    </div>
                  </div>

                  {/* Filtres par catégories */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Grille des 15 presets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {filteredPresets.map((preset) => {
                      const Icon = preset.icon
                      const isSelected = selectedSteamPreset === preset.id
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectSteamPreset(preset)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 text-left relative ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                              : 'border-border/80 bg-card hover:bg-muted/30 hover:border-border'
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-md shrink-0 ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-xs text-foreground truncate">{preset.title}</p>
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                                {preset.category}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                              {preset.description}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 text-primary">
                              <Check className="size-3.5" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Configuration avancée du preset sélectionné */}
                  <div className="pt-2 border-t border-border/60 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <InputField
                          label="Titre personnalisé"
                          placeholder="Nom du widget"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <RefreshField
                          label="Cycle (sec)"
                          value={refreshInterval}
                          onChange={(val) => setRefreshInterval(Math.max(300, val))}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Shield className="size-3 text-primary shrink-0" />
                      Actualisation limitée à 5 min minimum (300s) pour préserver les quotas de l'API Steam.
                    </p>
                  </div>

                </div>
              )}
            </TabsContent>

            {/* Onglet Météo */}
            <TabsContent value="weather" className="space-y-3 pt-3 flex-1 overflow-y-auto pr-1">
              <InputField
                label="Nom du widget"
                placeholder="Ex: Météo locale (optionnel)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <InputField
                label="Ville spécifique (optionnel)"
                placeholder="Ex: Paris, Lyon, Bordeaux..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                description="Laissez vide pour détecter automatiquement votre position GPS."
              />
            </TabsContent>

            {/* Onglet API JSON Universelle */}
            <TabsContent value="custom_api" className="space-y-3 pt-3 flex-1 overflow-y-auto pr-1">
              {/* Presets rapides */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted-foreground text-[11px]">Exemples :</span>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted text-[11px]"
                  onClick={() =>
                    handleApplyPreset({
                      title: 'Statut Backend',
                      apiUrl: 'http://127.0.0.1:8000/api/v1/health',
                      refresh: 15,
                      jsonPath: 'status',
                      displayMode: 'kpi',
                      unit: '',
                    })
                  }
                >
                  Backend FastAPI
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted text-[11px]"
                  onClick={() =>
                    handleApplyPreset({
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

              <InputField
                label="Nom du panneau"
                placeholder="Ex: Santé API ou Wishlist Steam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <InputField
                label="URL de l'API (GET)"
                placeholder="http://... ou https://..."
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                required
              />

              {apiUrl.trim().length > 5 && (
                <JsonPathPicker
                  apiUrl={apiUrl}
                  selectedPath={jsonPath}
                  onSelectPath={handleSelectPath}
                  className="p-2.5 rounded-lg border border-border/80 bg-muted/20"
                />
              )}

              <InputField
                label="Chemin JSON (Path)"
                placeholder="status ou data.value"
                value={jsonPath}
                onChange={(e) => setJsonPath(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Unité (optionnelle)"
                  placeholder="Ex: $, ms, %, °C"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
                <RefreshField
                  label="Refresh"
                  value={refreshInterval}
                  onChange={(val) => setRefreshInterval(val)}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-foreground">
                  Mode d'affichage
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={displayMode === 'kpi' ? 'default' : 'outline'}
                    size="sm"
                    className="cursor-pointer text-xs"
                    onClick={() => setDisplayMode('kpi')}
                  >
                    Chiffre clé (KPI)
                  </Button>
                  <Button
                    type="button"
                    variant={displayMode === 'gauge' ? 'default' : 'outline'}
                    size="sm"
                    className="cursor-pointer text-xs"
                    onClick={() => setDisplayMode('gauge')}
                  >
                    Jauge Radiale (0-100%)
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Onglet Raccourci classique */}
            <TabsContent value="default" className="space-y-3 pt-3 flex-1 overflow-y-auto pr-1">
              <InputField
                label="Nom du widget"
                placeholder="Entrez le nom du widget"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <InputField
                label="Lien externe (optionnel)"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={selectedType === 'steam' && !steamConnected}
            >
              Créer le widget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddWidgetDialog
