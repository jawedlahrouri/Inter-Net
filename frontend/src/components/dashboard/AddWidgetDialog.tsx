import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { InputField } from '@/components/ui/input-field'
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
  GitBranch,
  GitCommit,
  GitPullRequest,
  Star,
  Users,
  Code2,
  FolderGit2,
  FileCode,
  UserCheck,
  Calendar,
  Building,
  CheckCircle2,
  Key,
} from 'lucide-react'
import type { NewWidgetData, WidgetType, SteamMetricType, GithubMetricType } from '@/types/widget'
import { JsonPathPicker } from './JsonPathPicker'
import { RefreshField } from '@/components/ui/refresh-field'
import {
  fetchSteamStatus,
  getSteamAuthRedirectUrl,
  fetchGithubStatus,
  getGithubAuthRedirectUrl,
  connectGithubToken,
} from '@/services/api'
import { SteamWidget } from './widgets/SteamWidget'
import { WeatherWidget } from './widgets/WeatherWidget'
import { CustomApiWidget } from './widgets/CustomApiWidget'
import { GithubWidget } from './widgets/GithubWidget'
import { useGithubStats } from '@/hooks/useGithubStats'
import { useSettings } from '@/context/SettingsContext'

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

interface GithubPreset {
  id: GithubMetricType
  title: string
  description: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  defaultInterval: number
}

const GITHUB_PRESETS: GithubPreset[] = [
  {
    id: 'total_commits',
    title: 'Commits (total)',
    description: 'Nombre global de commits effectués sur l’ensemble de vos dépôts.',
    category: 'Volume & Activité',
    icon: GitCommit,
    defaultInterval: 300,
  },
  {
    id: 'lines_stats',
    title: 'Lignes ajoutées & supprimées',
    description: 'Total cumulé des lignes insérées (+) et retirées (-) avec calcul du delta net.',
    category: 'Volume & Activité',
    icon: FileCode,
    defaultInterval: 300,
  },
  {
    id: 'avg_commit_size',
    title: 'Taille moyenne d’un commit',
    description: 'Nombre moyen de lignes impactées par commit (ajouts et suppressions confondus).',
    category: 'Volume & Activité',
    icon: BarChart3,
    defaultInterval: 300,
  },
  {
    id: 'commits_timeframes',
    title: 'Commits par période (7j / 30j / 90j)',
    description: 'Évolution comparative de votre cadence de commits sur une semaine, un mois et un trimestre.',
    category: 'Périodes',
    icon: Clock,
    defaultInterval: 300,
  },
  {
    id: 'lines_timeframes',
    title: 'Lignes modifiées par période',
    description: 'Volume de code ajouté et supprimé ventilé sur 7 jours, 30 jours et 90 jours.',
    category: 'Périodes',
    icon: FileCode,
    defaultInterval: 300,
  },
  {
    id: 'active_days',
    title: 'Jours d’activité (30j & 365j)',
    description: 'Nombre distinct de jours calendaires avec des commits sur le dernier mois et l’année écoulée.',
    category: 'Volume & Activité',
    icon: Calendar,
    defaultInterval: 300,
  },
  {
    id: 'active_repos_count',
    title: 'Dépôts actifs récents (90j)',
    description: 'Nombre de projets ayant fait l’objet de commits actifs au cours des 3 derniers mois.',
    category: 'Projets & Collab',
    icon: FolderGit2,
    defaultInterval: 300,
  },
  {
    id: 'weekly_top_devs',
    title: 'Commits cette Semaine — Top Développeurs',
    description: 'Podium et classement de l’activité de la semaine en cours parmi vos collaborateurs.',
    category: 'Classement',
    icon: Trophy,
    defaultInterval: 300,
  },
  {
    id: 'pr_overview',
    title: 'Pull requests — Répartition',
    description: 'Répartition des PR : ouvertes, mergées avec succès et fermées sans merge.',
    category: 'Pull Requests',
    icon: GitPullRequest,
    defaultInterval: 300,
  },
  {
    id: 'pr_merge_rate',
    title: 'Taux de merge & Délais PR',
    description: 'Taux de validation des PR fermées et temps moyen observé avant le merge.',
    category: 'Pull Requests',
    icon: CheckCircle2,
    defaultInterval: 300,
  },
  {
    id: 'pr_created_total',
    title: 'Pull requests créées (cumul quotidien)',
    description: 'Cumul des Pull Requests créées et mergées au fil du temps.',
    category: 'Pull Requests',
    icon: GitPullRequest,
    defaultInterval: 300,
  },
  {
    id: 'code_reviews_done',
    title: 'Reviews effectuées (cumul)',
    description: 'Nombre total de revues de code effectuées sur les contributions de vos pairs.',
    category: 'Pull Requests',
    icon: UserCheck,
    defaultInterval: 300,
  },
  {
    id: 'projects_collaboration',
    title: 'Projets & Collaboration',
    description: 'Projets rejoints, répartition propriétaire / administrateur / contributeur.',
    category: 'Projets & Collab',
    icon: Users,
    defaultInterval: 300,
  },
  {
    id: 'avg_team_size',
    title: 'Taille moyenne d’équipe',
    description: 'Taille moyenne des équipes projet auxquelles vous collaborez (hors vous-même).',
    category: 'Projets & Collab',
    icon: Users,
    defaultInterval: 300,
  },
  {
    id: 'project_seniority',
    title: 'Ancienneté des projets',
    description: 'Ancienneté moyenne sur les projets et longévité du plus vieux dépôt géré en tant qu’owner.',
    category: 'Projets & Collab',
    icon: Clock,
    defaultInterval: 300,
  },
  {
    id: 'top_repos_by_commits',
    title: 'Top dépôts par commits',
    description: 'Vos dépôts les plus denses en nombre de commits avec badges de visibilité.',
    category: 'Classement',
    icon: Trophy,
    defaultInterval: 300,
  },
  {
    id: 'top_starred_repos',
    title: 'Top dépôts par étoiles ⭐',
    description: 'Classement de vos dépôts les plus populaires et étoilés par la communauté.',
    category: 'Classement',
    icon: Star,
    defaultInterval: 300,
  },
  {
    id: 'recent_repos_list',
    title: 'Dépôts récemment mis à jour',
    description: 'Liste des dépôts ayant été mis à jour dernièrement avec leur langage dominant.',
    category: 'Projets & Collab',
    icon: FolderGit2,
    defaultInterval: 300,
  },
  {
    id: 'primary_language',
    title: 'Langage de prédilection',
    description: 'Langage le plus utilisé dans votre historique de code avec volume de lignes.',
    category: 'Langages',
    icon: Code2,
    defaultInterval: 300,
  },
  {
    id: 'languages_breakdown',
    title: 'Répartition des langages (Top 5)',
    description: 'Barres de proportions colorées pour vos 5 langages les plus pratiqués.',
    category: 'Langages',
    icon: Layers,
    defaultInterval: 300,
  },
  {
    id: 'profile_card',
    title: 'Profil Développeur GitHub',
    description: 'Carte d’identité : avatar, bio, abonnements, repositories publics et statut.',
    category: 'Profil',
    icon: Building,
    defaultInterval: 300,
  },
  {
    id: 'repo_overview',
    title: 'Fiche Détaillée d’un Dépôt',
    description: 'Statistiques complètes d’un repo : étoiles, forks, issues, commits récents, taille et visibilité.',
    category: 'Dépôts',
    icon: FolderGit2,
    defaultInterval: 300,
  },
  {
    id: 'repo_recent_commits',
    title: 'Derniers Commits d’un Dépôt',
    description: 'Historique des derniers commits effectués sur un dépôt spécifique avec auteur, message et hash.',
    category: 'Dépôts',
    icon: GitCommit,
    defaultInterval: 300,
  },
  {
    id: 'repo_contributors',
    title: 'Contributeurs du Dépôt',
    description: 'Top contributeurs d’un dépôt avec volume de commits et avatars.',
    category: 'Dépôts',
    icon: Users,
    defaultInterval: 300,
  },
  {
    id: 'repo_languages',
    title: 'Langages du Dépôt',
    description: 'Ventilation précise en octets et pourcentages des langages d’un projet.',
    category: 'Dépôts',
    icon: FileCode,
    defaultInterval: 300,
  },
  {
    id: 'org_overview',
    title: 'Activité d’une Organisation',
    description: 'Vue 360° d’une organisation : total repos, membres, stars cumulées et derniers projets actifs.',
    category: 'Organisations',
    icon: Building,
    defaultInterval: 300,
  },
  {
    id: 'orgs_list',
    title: 'Organisations & Équipes',
    description: 'Liste de toutes les organisations GitHub dont vous faites partie avec description et liens.',
    category: 'Organisations',
    icon: Building,
    defaultInterval: 300,
  },
  {
    id: 'repos_by_org',
    title: 'Répartition Dépôts par Organisation',
    description: 'Volume et répartition de vos dépôts et étoiles par propriétaire et organisation.',
    category: 'Organisations',
    icon: Layers,
    defaultInterval: 300,
  },
]

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

  // Steam State
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

  // GitHub State
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
  const [patTokenInput, setPatTokenInput] = useState<string>('')
  const [patSubmitting, setPatSubmitting] = useState<boolean>(false)
  const [patError, setPatError] = useState<string | null>(null)
  const [showPatInput, setShowPatInput] = useState<boolean>(false)
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
        .finally(() => {
          setGithubLoading(false)
        })
    }
  }, [open])

  const currentSteamPreset = useMemo(() => {
    return STEAM_PRESETS.find((p) => p.id === selectedSteamPreset) || STEAM_PRESETS[0]
  }, [selectedSteamPreset])

  const currentGithubPreset = useMemo(() => {
    return GITHUB_PRESETS.find((p) => p.id === selectedGithubPreset) || GITHUB_PRESETS[0]
  }, [selectedGithubPreset])

  const handleConnectPat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patTokenInput.trim()) return
    setPatSubmitting(true)
    setPatError(null)
    try {
      const res = await connectGithubToken(patTokenInput.trim())
      setGithubConnected(true)
      setGithubProfile(res.profile || null)
      setPatTokenInput('')
      setShowPatInput(false)
    } catch (err: any) {
      setPatError(err?.message || 'Token GitHub invalide ou expiré.')
    } finally {
      setPatSubmitting(false)
    }
  }

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

  const handleSelectGithubPreset = (preset: GithubPreset) => {
    setSelectedGithubPreset(preset.id)
    setTitle(preset.title)
    setRefreshInterval(preset.defaultInterval || 300)
  }

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
    } else if (type === 'custom_api') {
      setTitle('Métrique API')
      setRefreshInterval(30)
    }
  }

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
    setPatTokenInput('')
    setPatError(null)
    setShowPatInput(false)
    setSelectedType('github')
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

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
      })
    } else if (selectedType === 'steam') {
      if (!steamConnected) return
      onAddWidget({
        title: title.trim() || currentSteamPreset.title,
        type: 'steam',
        steamMetric: currentSteamPreset.id,
        refreshIntervalSeconds: Math.max(300, refreshInterval || 300),
        dashboardId: activeDashboardId,
      })
    } else if (selectedType === 'weather') {
      onAddWidget({
        title: title.trim() || 'Météo locale',
        type: 'weather',
        city: city.trim() || undefined,
        dashboardId: activeDashboardId,
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
      })
    }

    resetForm()
    onOpenChange(false)
  }

  const steamCategories = [
    { label: 'Tous', count: 15 },
    { label: 'Activité', count: 4 },
    { label: 'Profil', count: 4 },
    { label: 'Bibliothèque', count: 2 },
    { label: 'Statistiques', count: 2 },
    { label: 'Records', count: 1 },
    { label: 'Classement', count: 1 },
    { label: 'Niveau', count: 1 },
  ]

  const githubCategories = [
    { label: 'Tous', count: 28 },
    { label: 'Dépôts', count: 4 },
    { label: 'Organisations', count: 3 },
    { label: 'Volume & Activité', count: 4 },
    { label: 'Pull Requests', count: 4 },
    { label: 'Projets & Collab', count: 5 },
    { label: 'Classement', count: 3 },
    { label: 'Périodes', count: 2 },
    { label: 'Langages', count: 2 },
    { label: 'Profil', count: 1 },
  ]

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

  const filteredGithubPresets = useMemo(() => {
    return GITHUB_PRESETS.filter((p) => {
      const matchCategory = selectedGithubCategory === 'Tous' || p.category === selectedGithubCategory
      const matchQuery =
        !githubSearchQuery.trim() ||
        p.title.toLowerCase().includes(githubSearchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(githubSearchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(githubSearchQuery.toLowerCase())
      return matchCategory && matchQuery
    })
  }, [selectedGithubCategory, githubSearchQuery])

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

              {/* Scène de rendu du widget avec quadrillage stylisé */}
              <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto bg-[radial-gradient(#80808018_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="w-full max-w-[420px] shadow-2xl transition-all duration-300">
                  {selectedType === 'github' ? (
                    githubLoading ? (
                      <div className="p-8 rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <RefreshCw className="size-7 animate-spin text-purple-500" />
                        <span className="text-xs">Chargement des données GitHub...</span>
                      </div>
                    ) : !githubConnected ? (
                      <div className="p-6 rounded-xl border border-purple-500/40 bg-purple-500/10 text-center space-y-3">
                        <Lock className="size-8 text-purple-500 mx-auto" />
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Connexion requise</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Liez votre compte GitHub ou renseignez un Personal Access Token (PAT) pour prévisualiser vos données.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 pt-1">
                          <Button
                            size="sm"
                            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer mx-auto w-full"
                            onClick={() => {
                              window.location.href = getGithubAuthRedirectUrl()
                            }}
                          >
                            <GitBranch className="size-4" />
                            Se connecter avec GitHub
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-2 text-xs cursor-pointer w-full"
                            onClick={() => setShowPatInput(!showPatInput)}
                          >
                            <Key className="size-3.5" />
                            {showPatInput ? 'Masquer le token PAT' : 'Utiliser un Personal Access Token'}
                          </Button>
                        </div>
                        {showPatInput && (
                          <form onSubmit={handleConnectPat} className="space-y-2 pt-2 text-left border-t border-purple-500/20">
                            <input
                              type="password"
                              placeholder="ghp_... ou github_pat_..."
                              value={patTokenInput}
                              onChange={(e) => setPatTokenInput(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-border bg-background text-foreground"
                            />
                            {patError && <p className="text-[11px] text-destructive">{patError}</p>}
                            <Button
                              type="submit"
                              size="sm"
                              disabled={patSubmitting || !patTokenInput.trim()}
                              className="w-full text-xs h-7 cursor-pointer"
                            >
                              {patSubmitting ? <RefreshCw className="size-3 animate-spin" /> : 'Valider le token'}
                            </Button>
                          </form>
                        )}
                      </div>
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

            {/* ÉDITEUR DE PARAMÈTRES / QUERY EDITOR (BAS) */}
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
                      setRefreshInterval(
                        selectedType === 'steam' || selectedType === 'github'
                          ? Math.max(300, val)
                          : val
                      )
                    }
                  />
                </div>
              </div>

              {/* CHAMPS SPÉCIFIQUES SELON SERVICE */}
              {selectedType === 'github' && (
                <div className="space-y-3">
                  {selectedGithubPreset.startsWith('repo_') && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/60">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <FolderGit2 className="size-3.5 text-purple-500" />
                          Dépôt GitHub ciblé
                        </label>
                        <span className="text-[10px] text-muted-foreground">
                          {githubStats?.recent_repos?.length
                            ? `${githubStats.recent_repos.length} dépôts détectés`
                            : 'owner/repo'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {githubStats?.recent_repos && githubStats.recent_repos.length > 0 && (
                          <select
                            value={selectedRepoFullName}
                            onChange={(e) => setSelectedRepoFullName(e.target.value)}
                            className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="">Sélectionner parmi mes dépôts...</option>
                            {githubStats.recent_repos.map((r) => (
                              <option key={r.full_name || r.name} value={r.full_name || r.name}>
                                {r.full_name || r.name} {r.is_private ? '🔒' : ''}
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          type="text"
                          placeholder="Ou saisissez owner/repo (ex: facebook/react)"
                          value={selectedRepoFullName}
                          onChange={(e) => setSelectedRepoFullName(e.target.value)}
                          className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Laissez vide pour cibler automatiquement votre dépôt le plus actif.
                      </p>
                    </div>
                  )}

                  {selectedGithubPreset === 'org_overview' && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/60">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Building className="size-3.5 text-purple-500" />
                          Organisation GitHub
                        </label>
                        <span className="text-[10px] text-muted-foreground">
                          {githubStats?.organisations?.length
                            ? `${githubStats.organisations.length} organisations`
                            : 'login'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {githubStats?.organisations && githubStats.organisations.length > 0 && (
                          <select
                            value={selectedOrgName}
                            onChange={(e) => setSelectedOrgName(e.target.value)}
                            className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="">Sélectionner une organisation...</option>
                            {githubStats.organisations.map((o) => (
                              <option key={o.login} value={o.login}>
                                {o.login}
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          type="text"
                          placeholder="Ou saisissez le nom d'une organisation (ex: vercel)"
                          value={selectedOrgName}
                          onChange={(e) => setSelectedOrgName(e.target.value)}
                          className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Organisation dont vous souhaitez consulter les statistiques.
                      </p>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-start gap-3 text-xs">
                    <GitBranch className="size-4 text-purple-500 shrink-0 mt-0.5" />
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-foreground">
                        Métrique active : {currentGithubPreset.title} ({currentGithubPreset.category})
                      </p>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {currentGithubPreset.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium pt-0.5">
                        🔒 Protection de quota : rafraîchissement borné à 5 minutes (300 secondes) minimum pour respecter le rate limit de l’API GitHub.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                {selectedType === 'github'
                  ? '28 métriques GitHub'
                  : selectedType === 'steam'
                  ? '15 métriques Steam'
                  : 'Service prêt'}
              </span>
            </div>

            {/* SÉLECTEUR DE SERVICES (4 TABS) */}
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

            {/* CONTENU CATALOGUE SELON TYPE SÉLECTIONNÉ */}
            {selectedType === 'github' && (
              <div className="flex-1 min-h-0 flex flex-col space-y-2.5 overflow-hidden">
                {/* Barre de recherche dans les presets GitHub */}
                <div className="relative shrink-0">
                  <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher une métrique GitHub..."
                    value={githubSearchQuery}
                    onChange={(e) => setGithubSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border/70 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Filtres par catégories (pilules horizontales) */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs shrink-0 no-scrollbar">
                  {githubCategories.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setSelectedGithubCategory(cat.label)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        selectedGithubCategory === cat.label
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-[9px] opacity-80">{cat.count}</span>
                    </button>
                  ))}
                </div>

                {/* Liste des cartes de visualisations GitHub (défilable) */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                  {filteredGithubPresets.map((preset) => {
                    const Icon = preset.icon
                    const isSelected = selectedGithubPreset === preset.id
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectGithubPreset(preset)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative text-left group ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500 shadow-sm'
                            : 'border-border/70 bg-card hover:bg-muted/40 hover:border-border'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-muted text-muted-foreground group-hover:text-foreground'
                          }`}
                        >
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
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                            {preset.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 text-purple-500">
                            <Check className="size-4" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {filteredGithubPresets.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Aucune métrique GitHub ne correspond à votre recherche.
                    </div>
                  )}
                </div>
              </div>
            )}

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

                {/* Filtres par catégories (pilules horizontales) */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs shrink-0 no-scrollbar">
                  {steamCategories.map((cat) => (
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
                            <p className="font-semibold text-xs text-foreground truncate">
                              {preset.title}
                            </p>
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                              {preset.category}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                            {preset.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 text-primary">
                            <Check className="size-4" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {filteredSteamPresets.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Aucune métrique ne correspond à votre recherche.
                    </div>
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
              </div>
            )}

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
                    <p className="font-semibold text-foreground">Jauge Radiale (0 - 100%)</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Visualisation d'un pourcentage ou niveau sur une jauge semi-circulaire colorée.
                    </p>
                  </div>
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
