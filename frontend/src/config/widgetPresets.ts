import type * as React from 'react'
import {
  Gamepad2,
  Trophy,
  Layers,
  Clock,
  Flame,
  Shield,
  Activity,
  Award,
  Sparkles,
  BarChart3,
  Inbox,
  GitCommit,
  FileCode,
  Calendar,
  FolderGit2,
  GitPullRequest,
  CheckCircle2,
  UserCheck,
  Users,
  Star,
  Code2,
  Building,
} from 'lucide-react'
import type { SteamMetricType, GithubMetricType } from '@/types/widget'

export interface SteamPreset {
  id: SteamMetricType
  title: string
  description: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  defaultInterval: number
}

export interface GithubPreset {
  id: GithubMetricType
  title: string
  description: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  defaultInterval: number
}

export interface ApiPreset {
  title: string
  apiUrl: string
  jsonPath: string
  refresh: number
  displayMode: 'kpi' | 'gauge'
  unit: string
}

export interface CategoryFilter {
  label: string
  count: number
}

export const STEAM_CATEGORIES: CategoryFilter[] = [
  { label: 'Tous', count: 15 },
  { label: 'Activité', count: 4 },
  { label: 'Profil', count: 4 },
  { label: 'Bibliothèque', count: 2 },
  { label: 'Statistiques', count: 2 },
  { label: 'Records', count: 1 },
  { label: 'Classement', count: 1 },
  { label: 'Niveau', count: 1 },
]

export const GITHUB_CATEGORIES: CategoryFilter[] = [
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

export const STEAM_PRESETS: SteamPreset[] = [
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

export const GITHUB_PRESETS: GithubPreset[] = [
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

export const API_PRESETS: ApiPreset[] = [
  {
    title: 'Prix Bitcoin (USD)',
    apiUrl: 'https://api.coindesk.com/v1/bpi/currentprice.json',
    jsonPath: 'bpi.USD.rate_float',
    refresh: 30,
    displayMode: 'kpi',
    unit: '$',
  },
  {
    title: 'Position Station Spatiale (Latitude)',
    apiUrl: 'http://api.open-notify.org/iss-now.json',
    jsonPath: 'iss_position.latitude',
    refresh: 15,
    displayMode: 'kpi',
    unit: '°',
  },
]

