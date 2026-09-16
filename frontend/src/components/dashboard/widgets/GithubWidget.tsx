import { useState, useEffect } from 'react'
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Star,
  GitFork,
  Users,
  UserCheck,
  Calendar,
  Clock,
  Flame,
  Award,
  Trophy,
  BarChart3,
  Layers,
  Code2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  FolderGit2,
  FileCode,
  MapPin,
  Building,
  User,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useGithubStats } from '@/hooks/useGithubStats'
import { useGithubRepoStats } from '@/hooks/useGithubRepoStats'
import { useGithubOrgStats } from '@/hooks/useGithubOrgStats'
import type { Widget } from '@/types/widget'

export interface GithubWidgetProps {
  widget: Widget
  className?: string
}

export function GithubWidget({ widget, className = '' }: GithubWidgetProps) {
  const metric = widget.githubMetric || 'profile_card'
  const refreshInterval = Math.max(300, widget.refreshIntervalSeconds || 300)
  const { stats, loading, error, lastUpdated, refresh } = useGithubStats(refreshInterval)

  const isRepoMetric = metric.startsWith('repo_')
  const isOrgMetric = metric === 'org_overview'

  const targetRepo = widget.repoFullName || stats?.recent_repos?.[0]?.full_name || ''
  const targetOrg = widget.orgName || stats?.organisations?.[0]?.login || stats?.profile?.login || ''

  const repoHook = useGithubRepoStats(isRepoMetric && targetRepo ? targetRepo : undefined, refreshInterval)
  const orgHook = useGithubOrgStats(isOrgMetric && targetOrg ? targetOrg : undefined, refreshInterval)

  const [secondsAgo, setSecondsAgo] = useState<number>(0)

  useEffect(() => {
    const updateRelativeTime = () => {
      if (!lastUpdated) {
        setSecondsAgo(0)
        return
      }
      const diff = Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000))
      setSecondsAgo(diff)
    }

    updateRelativeTime()
    const timer = setInterval(updateRelativeTime, 1000)
    return () => clearInterval(timer)
  }, [lastUpdated])

  const renderMetricContent = () => {
    if (loading && !stats) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-8 text-muted-foreground">
          <RefreshCw className="size-6 animate-spin text-primary" />
          <span className="text-xs">Chargement des métriques GitHub...</span>
        </div>
      )
    }

    if (error && !stats) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-8 text-center px-4">
          <AlertCircle className="size-6 text-destructive" />
          <span className="text-xs text-destructive font-medium">{error}</span>
          <Button variant="outline" size="sm" onClick={() => refresh()} className="mt-2 text-xs">
            Réessayer
          </Button>
        </div>
      )
    }

    if (!stats) return null

    switch (metric) {
      // 1. Commits (total)
      case 'total_commits': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex p-2.5 rounded-full bg-primary/10 text-primary mb-1">
              <GitCommit className="size-6" />
            </div>
            <div>
              <div className="text-4xl font-black tracking-tight text-foreground">
                {stats.total_commits.toLocaleString('fr-FR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Commits cumulés sur vos dépôts
              </p>
            </div>
            <Badge variant="secondary" className="text-xs font-mono">
              Volume global de production
            </Badge>
          </div>
        )
      }

      // 2. Lignes ajoutées & supprimées
      case 'lines_stats': {
        return (
          <div className="space-y-4 py-1 text-center">
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                  Ajoutées (+)
                </span>
                <span className="text-lg font-black text-foreground font-mono">
                  +{stats.lines_added.toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10px] uppercase font-mono font-bold text-rose-600 dark:text-rose-400 block">
                  Supprimées (-)
                </span>
                <span className="text-lg font-black text-foreground font-mono">
                  -{stats.lines_deleted.toLocaleString('fr-FR')}
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ratio ajouts / suppressions :</span>
              <strong className="text-primary font-mono text-sm">{stats.lines_ratio}</strong>
            </div>
          </div>
        )
      }

      // 3. Taille moyenne d'un commit
      case 'avg_commit_size': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex p-2.5 rounded-full bg-purple-500/10 text-purple-500 mb-1">
              <Layers className="size-6" />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tight text-foreground font-mono">
                {stats.avg_commit_size} <span className="text-base font-normal text-muted-foreground">lignes</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Taille moyenne par commit
              </p>
            </div>
            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-500">
              Changements atomiques & réguliers
            </Badge>
          </div>
        )
      }

      // 4. Commits (7j / 30j / 90j)
      case 'commits_timeframes': {
        return (
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="text-[10px] text-muted-foreground block font-mono">7 jours</span>
                <strong className="text-xl font-black text-primary font-mono">{stats.commits_7d}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="text-[10px] text-muted-foreground block font-mono">30 jours</span>
                <strong className="text-xl font-black text-foreground font-mono">{stats.commits_30d}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="text-[10px] text-muted-foreground block font-mono">90 jours</span>
                <strong className="text-xl font-black text-foreground font-mono">{stats.commits_90d}</strong>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Activité de push sur les 3 derniers mois
            </p>
          </div>
        )
      }

      // 5. Lignes modifiées (7j / 30j / 90j)
      case 'lines_timeframes': {
        return (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-muted-foreground font-mono">7 jours :</span>
              <span className="font-mono">
                <strong className="text-emerald-500">+{stats.lines_added_7d.toLocaleString('fr-FR')}</strong> / <strong className="text-rose-500">-{stats.lines_deleted_7d.toLocaleString('fr-FR')}</strong>
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-muted-foreground font-mono">30 jours :</span>
              <span className="font-mono">
                <strong className="text-emerald-500">+{stats.lines_added_30d.toLocaleString('fr-FR')}</strong> / <strong className="text-rose-500">-{stats.lines_deleted_30d.toLocaleString('fr-FR')}</strong>
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-muted-foreground font-mono">90 jours :</span>
              <span className="font-mono">
                <strong className="text-emerald-500">+{stats.lines_added_90d.toLocaleString('fr-FR')}</strong> / <strong className="text-rose-500">-{stats.lines_deleted_90d.toLocaleString('fr-FR')}</strong>
              </span>
            </div>
          </div>
        )
      }

      // 6. Jours actifs (30j / 365j)
      case 'active_days': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <div className="text-3xl font-black text-primary font-mono">{stats.active_days_30d}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Jours actifs (30j)</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <div className="text-3xl font-black text-foreground font-mono">{stats.active_days_365d}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Jours actifs (365j)</div>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Présence constante au calendrier Git
            </Badge>
          </div>
        )
      }

      // 7. Dépôts avec au moins un commit
      case 'active_repos_count': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex p-2.5 rounded-full bg-blue-500/10 text-blue-500 mb-1">
              <FolderGit2 className="size-6" />
            </div>
            <div>
              <div className="text-4xl font-black text-foreground font-mono">{stats.active_repos_count}</div>
              <p className="text-xs text-muted-foreground mt-1">Dépôts avec au moins un commit</p>
            </div>
            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-500">
              Contribution active multi-projets
            </Badge>
          </div>
        )
      }

      // 8. Commits cette Semaine — Top Développeurs
      case 'weekly_top_devs': {
        const topDevs = stats.weekly_top_devs || []
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-border/40">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Trophy className="size-3.5 text-amber-500" />
                Semaine en cours
              </span>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Activité 7j
              </Badge>
            </div>
            <div className="space-y-1.5">
              {topDevs.map((dev) => (
                <div
                  key={dev.login}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30 border border-border/50 text-xs"
                >
                  <div className="size-5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center font-bold text-[10px] shrink-0">
                    #{dev.rank}
                  </div>
                  {dev.avatar ? (
                    <img src={dev.avatar} alt="" className="size-6 rounded-full shrink-0 object-cover" />
                  ) : (
                    <User className="size-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground truncate block">{dev.username || dev.login}</span>
                    <span className="text-[10px] text-muted-foreground truncate block">@{dev.login}</span>
                  </div>
                  <Badge variant="default" className="text-[11px] font-mono shrink-0">
                    {dev.commits} commits
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )
      }

      // 9. Pull Requests — Répartition
      case 'pr_overview': {
        return (
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-lg font-black text-emerald-500 font-mono">{stats.pr_open_count}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Ouvertes</div>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="text-lg font-black text-purple-500 font-mono">{stats.pr_merged_count}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Mergées</div>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <div className="text-lg font-black text-muted-foreground font-mono">{stats.pr_closed_unmerged}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Fermées</div>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-muted/20 border border-border/50 text-[11px] text-muted-foreground flex justify-between">
              <span>Total PR traitées :</span>
              <strong className="text-foreground font-mono">{stats.pr_merged_count + stats.pr_closed_unmerged}</strong>
            </div>
          </div>
        )
      }

      // 10. Taux de PR mergées
      case 'pr_merge_rate': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex p-2.5 rounded-full bg-emerald-500/10 text-emerald-500 mb-1">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <div className="text-4xl font-black text-foreground font-mono">
                {stats.pr_merge_rate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Taux de PR mergées sur fermées</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              Qualité et intégration du code
            </Badge>
          </div>
        )
      }

      // 11. PR créées (total)
      case 'pr_created_total': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex p-2.5 rounded-full bg-indigo-500/10 text-indigo-500 mb-1">
              <GitPullRequest className="size-6" />
            </div>
            <div>
              <div className="text-4xl font-black text-foreground font-mono">{stats.pr_created_total}</div>
              <p className="text-xs text-muted-foreground mt-1">Pull Requests créées au total</p>
            </div>
            <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-500">
              Cumul des contributions proposées
            </Badge>
          </div>
        )
      }

      // 12. Reviews de code effectuées
      case 'code_reviews_done': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex p-2.5 rounded-full bg-amber-500/10 text-amber-500 mb-1">
              <Award className="size-6" />
            </div>
            <div>
              <div className="text-4xl font-black text-foreground font-mono">{stats.code_reviews_done}</div>
              <p className="text-xs text-muted-foreground mt-1">Relectures de code (Reviews) effectuées</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              Partage et entraide d'équipe
            </Badge>
          </div>
        )
      }

      // 13. Projets & Statut (Owner / Collab)
      case 'projects_collaboration': {
        return (
          <div className="space-y-2.5 py-1">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Projets rejoints :</span>
              <strong className="text-foreground font-mono text-sm">{stats.joined_projects_count}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
              <span className="text-primary font-medium">Dont propriétaire (owner) :</span>
              <strong className="text-primary font-mono text-sm">{stats.owned_projects_count}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Dont contributeur :</span>
              <strong className="text-foreground font-mono text-sm">{stats.collab_projects_count}</strong>
            </div>
          </div>
        )
      }

      // 14. Taille moyenne d'équipe
      case 'avg_team_size': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex p-2.5 rounded-full bg-teal-500/10 text-teal-500 mb-1">
              <Users className="size-6" />
            </div>
            <div>
              <div className="text-4xl font-black text-foreground font-mono">{stats.avg_team_size}</div>
              <p className="text-xs text-muted-foreground mt-1">Taille moyenne d'équipe (hors soi-même)</p>
            </div>
            <Badge variant="outline" className="text-xs border-teal-500/30 text-teal-500">
              Collaboration & binômage
            </Badge>
          </div>
        )
      }

      // 15. Ancienneté des projets
      case 'project_seniority': {
        return (
          <div className="space-y-2.5 py-1">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-center">
              <div className="text-2xl font-black text-foreground font-mono">{stats.avg_seniority_days} jours</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Ancienneté moyenne sur ses projets</div>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Plus vieux projet (owner) :</span>
              <strong className="text-primary font-mono">{stats.oldest_project_age_days} jours</strong>
            </div>
          </div>
        )
      }

      // 16. Top dépôts par commits
      case 'top_repos_by_commits': {
        const topRepos = stats.top_repos_by_commits || []
        return (
          <div className="space-y-2">
            {topRepos.map((repo, idx) => (
              <div
                key={repo.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 text-xs"
              >
                <div
                  className={`size-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                    idx === 0
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                      : idx === 1
                      ? 'bg-slate-300/20 text-slate-300 border border-slate-300/40'
                      : 'bg-amber-700/20 text-amber-700 border border-amber-700/40'
                  }`}
                >
                  #{idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-foreground truncate block">{repo.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{repo.language || 'Code'}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                  Actif
                </Badge>
              </div>
            ))}
          </div>
        )
      }

      // 17. Top dépôts par étoiles
      case 'top_starred_repos': {
        const topStars = stats.top_starred_repos || []
        return (
          <div className="space-y-2">
            {topStars.map((repo, idx) => (
              <div
                key={repo.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 text-xs"
              >
                <div
                  className={`size-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                    idx === 0
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  #{idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-foreground truncate block">{repo.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{repo.language || 'Projet'}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-bold font-mono text-xs shrink-0">
                  <Star className="size-3 fill-amber-500" />
                  <span>{repo.stargazers_count}</span>
                </div>
              </div>
            ))}
          </div>
        )
      }

      // 18. Derniers dépôts modifiés
      case 'recent_repos_list': {
        const recents = stats.recent_repos || []
        return (
          <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
            {recents.map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/40 transition-colors text-xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <span className="font-semibold text-foreground truncate block hover:text-primary">
                    {repo.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {repo.description}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 font-mono">
                  {repo.language}
                </Badge>
              </a>
            ))}
          </div>
        )
      }

      // 19. Langage de prédilection
      case 'primary_language': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex p-2.5 rounded-full bg-emerald-500/10 text-emerald-500 mb-1">
              <Code2 className="size-6" />
            </div>
            <div>
              <div className="text-3xl font-black text-foreground">{stats.primary_language}</div>
              <p className="text-xs text-muted-foreground mt-1">Technologie dominante dans vos projets</p>
            </div>
            <Badge variant="secondary" className="text-xs font-mono">
              Langage #1 le plus représenté
            </Badge>
          </div>
        )
      }

      // 20. Top 5 des langages utilisés
      case 'languages_breakdown': {
        const langs = stats.top_languages || []
        return (
          <div className="space-y-2.5 py-1">
            {langs.map((l) => (
              <div key={l.name} className="space-y-1 text-xs">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-foreground">{l.name}</span>
                  <span className="text-muted-foreground font-mono">{l.percentage ?? l.count}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/60">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${l.percentage ?? Math.min(100, l.count * 20)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      }

      // 21. Profil & Bio Développeur
      case 'profile_card':
      default: {
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={stats.profile.avatar || stats.profile.avatar_url}
                alt={stats.profile.username}
                className="size-14 rounded-full border-2 border-primary object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-base text-foreground truncate">
                  {stats.profile.username || stats.profile.login}
                </h4>
                <p className="text-xs text-muted-foreground truncate font-mono">
                  @{stats.profile.login}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                  <span><strong>{stats.public_repos_count}</strong> dépôts</span>
                  <span>•</span>
                  <span><strong>{stats.followers_count}</strong> followers</span>
                </div>
              </div>
            </div>

            {stats.profile.bio && (
              <p className="text-xs text-muted-foreground italic line-clamp-2 pt-1 border-t border-border/50">
                "{stats.profile.bio}"
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              {stats.profile.location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="size-3" /> {stats.profile.location}
                </span>
              )}
              {stats.profile.profile_url && (
                <a
                  href={stats.profile.profile_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5 ml-auto"
                >
                  GitHub <ExternalLink className="size-2.5" />
                </a>
              )}
            </div>
          </div>
        )
      }

      case 'repo_overview': {
        if (!targetRepo) {
          return (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Aucun dépôt configuré. Définissez le dépôt dans les paramètres du widget.
            </div>
          )
        }
        if (repoHook.loading && !repoHook.stats) {
          return (
            <div className="flex flex-col items-center justify-center py-8 space-y-2 text-muted-foreground">
              <RefreshCw className="size-5 animate-spin text-purple-500" />
              <span className="text-xs">Chargement du dépôt...</span>
            </div>
          )
        }
        if (repoHook.error && !repoHook.stats) {
          return (
            <div className="text-center py-6 space-y-2">
              <p className="text-xs text-destructive">{repoHook.error}</p>
              <Button size="sm" variant="outline" onClick={() => repoHook.refresh()} className="text-xs">
                Réessayer
              </Button>
            </div>
          )
        }
        const repo = repoHook.stats?.repo
        if (!repo) return null

        return (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-foreground truncate">{repo.name}</span>
                  <Badge variant={repo.is_private ? 'outline' : 'secondary'} className="text-[10px] px-1.5 py-0">
                    {repo.is_private ? 'Privé' : 'Public'}
                  </Badge>
                  {repo.language && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/30 text-purple-500">
                      {repo.language}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{repo.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-center gap-1 text-amber-500">
                  <Star className="size-3.5" />
                  <span className="font-bold text-xs">{repo.stargazers_count}</span>
                </div>
                <span className="text-[9px] text-muted-foreground">Étoiles</span>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-center gap-1 text-sky-500">
                  <GitFork className="size-3.5" />
                  <span className="font-bold text-xs">{repo.forks_count}</span>
                </div>
                <span className="text-[9px] text-muted-foreground">Forks</span>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-center gap-1 text-emerald-500">
                  <AlertCircle className="size-3.5" />
                  <span className="font-bold text-xs">{repo.open_issues_count}</span>
                </div>
                <span className="text-[9px] text-muted-foreground">Issues</span>
              </div>
            </div>

            {repo.html_url && (
              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center justify-end gap-1 pt-1"
              >
                Ouvrir sur GitHub <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        )
      }

      case 'repo_recent_commits': {
        if (!targetRepo) {
          return (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Aucun dépôt configuré.
            </div>
          )
        }
        if (repoHook.loading && !repoHook.stats) {
          return (
            <div className="flex flex-col items-center justify-center py-8 space-y-2 text-muted-foreground">
              <RefreshCw className="size-5 animate-spin text-purple-500" />
              <span className="text-xs">Chargement des commits...</span>
            </div>
          )
        }
        const commits = repoHook.stats?.commits || []
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-border/40 text-[11px] text-muted-foreground">
              <span className="truncate font-medium">{targetRepo}</span>
              <span>{commits.length} commits</span>
            </div>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {commits.map((c, i) => (
                <div key={i} className="p-2 rounded-lg bg-muted/30 border border-border/40 text-xs flex items-start gap-2">
                  {c.author_avatar ? (
                    <img src={c.author_avatar} alt="" className="size-4 rounded-full mt-0.5 shrink-0" />
                  ) : (
                    <GitCommit className="size-4 text-purple-500 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate text-[11px]">{c.message}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                      <span className="truncate">{c.author}</span>
                      <code className="bg-muted px-1 rounded text-[9px] font-mono">{c.sha}</code>
                    </div>
                  </div>
                </div>
              ))}
              {commits.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">Aucun commit récent.</div>
              )}
            </div>
          </div>
        )
      }

      case 'repo_contributors': {
        if (!targetRepo) {
          return (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Aucun dépôt configuré.
            </div>
          )
        }
        if (repoHook.loading && !repoHook.stats) {
          return (
            <div className="flex flex-col items-center justify-center py-8 space-y-2 text-muted-foreground">
              <RefreshCw className="size-5 animate-spin text-purple-500" />
              <span className="text-xs">Chargement des contributeurs...</span>
            </div>
          )
        }
        const contributors = repoHook.stats?.contributors || []
        return (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-1 border-b border-border/40">
              <span className="truncate font-medium">{targetRepo}</span>
              <span>{contributors.length} contributeurs</span>
            </div>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {contributors.map((cont, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4 text-center">#{idx + 1}</span>
                    {cont.avatar_url ? (
                      <img src={cont.avatar_url} alt="" className="size-5 rounded-full" />
                    ) : (
                      <User className="size-4 text-muted-foreground" />
                    )}
                    <span className="text-xs font-semibold text-foreground truncate">{cont.login}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {cont.contributions} commits
                  </Badge>
                </div>
              ))}
              {contributors.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">Aucun contributeur répertorié.</div>
              )}
            </div>
          </div>
        )
      }

      case 'repo_languages': {
        if (!targetRepo) {
          return (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Aucun dépôt configuré.
            </div>
          )
        }
        if (repoHook.loading && !repoHook.stats) {
          return (
            <div className="flex flex-col items-center justify-center py-8 space-y-2 text-muted-foreground">
              <RefreshCw className="size-5 animate-spin text-purple-500" />
              <span className="text-xs">Calcul des langages...</span>
            </div>
          )
        }
        const languages = repoHook.stats?.languages || []
        return (
          <div className="space-y-3">
            <div className="text-[11px] text-muted-foreground pb-1 border-b border-border/40 truncate font-medium">
              {targetRepo}
            </div>
            <div className="space-y-2">
              {languages.slice(0, 5).map((l, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{l.name}</span>
                    <span className="text-muted-foreground text-[11px] font-mono">{l.percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        i === 0 ? 'bg-purple-500' : i === 1 ? 'bg-sky-500' : i === 2 ? 'bg-amber-500' : i === 3 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(2, l.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
              {languages.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">Aucun langage détecté.</div>
              )}
            </div>
          </div>
        )
      }

      case 'org_overview': {
        if (!targetOrg) {
          return (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Aucune organisation configurée.
            </div>
          )
        }
        if (orgHook.loading && !orgHook.stats) {
          return (
            <div className="flex flex-col items-center justify-center py-8 space-y-2 text-muted-foreground">
              <RefreshCw className="size-5 animate-spin text-purple-500" />
              <span className="text-xs">Chargement de l'organisation...</span>
            </div>
          )
        }
        const org = orgHook.stats?.org
        if (!org) return null

        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {org.avatar_url ? (
                <img src={org.avatar_url} alt="" className="size-10 rounded-xl border border-purple-500/40 shrink-0" />
              ) : (
                <Building className="size-10 text-purple-500 shrink-0" />
              )}
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-foreground truncate">{org.name || org.login}</h4>
                <p className="text-[11px] text-muted-foreground truncate">{org.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="font-extrabold text-base text-foreground">{orgHook.stats?.repos_count || 0}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Dépôts</p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="font-extrabold text-base text-amber-500">⭐ {orgHook.stats?.total_stars || 0}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Étoiles</p>
              </div>
            </div>

            {orgHook.stats?.primary_language && orgHook.stats.primary_language !== 'N/A' && (
              <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-muted/20 border border-border/40">
                <span className="text-muted-foreground">Langage dominant :</span>
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-500">
                  {orgHook.stats.primary_language}
                </Badge>
              </div>
            )}
          </div>
        )
      }

      case 'orgs_list': {
        const orgs = stats?.organisations || []
        return (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Organisations affiliées</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {orgs.length}
              </Badge>
            </div>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {orgs.map((org, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/20 border border-border/40">
                  {org.avatar_url ? (
                    <img src={org.avatar_url} alt="" className="size-6 rounded-lg border border-purple-500/30 shrink-0" />
                  ) : (
                    <Building className="size-5 text-purple-500 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-foreground truncate">{org.login}</p>
                    {org.description && (
                      <p className="text-[10px] text-muted-foreground truncate">{org.description}</p>
                    )}
                  </div>
                </div>
              ))}
              {orgs.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Aucune organisation publique trouvée pour ce compte.
                </div>
              )}
            </div>
          </div>
        )
      }

      case 'repos_by_org': {
        const groups = stats?.repos_by_owner || []
        return (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Répartition par Organisation</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {groups.length} propriétaires
              </Badge>
            </div>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {groups.map((grp, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-foreground truncate">{grp.owner}</span>
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${grp.is_user ? 'border-sky-500/40 text-sky-500' : 'border-purple-500/40 text-purple-500'}`}>
                        {grp.is_user ? 'Personnel' : 'Organisation'}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      ⭐ {grp.stars} stars • 🍴 {grp.forks} forks
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md text-foreground shrink-0">
                    {grp.count} {grp.count > 1 ? 'dépôts' : 'dépôt'}
                  </span>
                </div>
              ))}
              {groups.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Aucun dépôt répertorié.
                </div>
              )}
            </div>
          </div>
        )
      }
    }
  }

  return (
    <Card className={`min-h-[320px] h-full bg-card border-border flex flex-col justify-between ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <GitBranch className="size-4 text-primary shrink-0" />
            <CardTitle className="text-base font-bold text-card-foreground truncate">
              {widget.title || 'GitHub'}
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground truncate">
            {stats?.profile?.login ? `@${stats.profile.login}` : 'GitHub Live'}
          </CardDescription>
        </div>

        {/* Real-time status indicator & refresh button */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
            title="Mise à jour en direct active"
          >
            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => refresh()}
            title="Rafraîchir maintenant"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center px-4 py-2">
        {renderMetricContent()}
      </CardContent>

      <CardFooter className="pt-2 pb-3 px-4 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40">
        <div className="flex items-center gap-1 truncate">
          <span className="truncate">
            {secondsAgo < 60
              ? secondsAgo === 0
                ? "À l'instant"
                : `Il y a ${secondsAgo}s`
              : `Il y a ${Math.floor(secondsAgo / 60)} min`}
          </span>
          <span className="opacity-60">
            • cycle {Math.round(refreshInterval / 60)} min
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border/80">
          GitHub
        </Badge>
      </CardFooter>
    </Card>
  )
}

export default GithubWidget

