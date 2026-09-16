import {
  Star,
  GitFork,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  GitCommit,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GithubUserStats } from '@/services/api'
import type { GithubMetricType } from '@/types/widget'
import type { useGithubRepoStats } from '@/hooks/useGithubRepoStats'

type RepoHookReturn = ReturnType<typeof useGithubRepoStats>

interface GithubRepoMetricsProps {
  metric: GithubMetricType
  stats: GithubUserStats
  targetRepo: string
  repoHook: RepoHookReturn
}

export function GithubRepoMetrics({
  metric,
  stats,
  targetRepo,
  repoHook,
}: GithubRepoMetricsProps) {
  switch (metric) {
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

    // Fiche détaillée d'un dépôt
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

    // Derniers commits d'un dépôt
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

    // Contributeurs du dépôt
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

    // Langages du dépôt
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

    default:
      return null
  }
}
