import {
  GitCommit,
  Layers,
  Clock,
  Calendar,
  FolderGit2,
  Trophy,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { GithubUserStats } from '@/services/api'
import type { GithubMetricType } from '@/types/widget'

interface GithubCommitMetricsProps {
  metric: GithubMetricType
  stats: GithubUserStats
}

/**
 * @brief Renders the GitHub widget body for a chosen commit-related metric from the user's stats.
 * @param metric GitHub metric type selecting which commit-related view is rendered.
 * @param stats GitHub user statistics object supplying the values displayed.
 * @return A JSX block for the metric (commits, lines, timeframes, active days, repos or top devs), or null for unknown metrics.
 */
export function GithubCommitMetrics({ metric, stats }: GithubCommitMetricsProps) {
  switch (metric) {
    case 'total_commits':
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

    case 'lines_stats':
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

    case 'avg_commit_size':
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

    case 'commits_timeframes':
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

    case 'lines_timeframes':
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

    case 'active_days':
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

    case 'active_repos_count':
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

    default:
      return null
  }
}
