import { useState, useEffect } from 'react'
import {
  GitBranch,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useGithubStats } from '@/hooks/useGithubStats'
import { useGithubRepoStats } from '@/hooks/useGithubRepoStats'
import { useGithubOrgStats } from '@/hooks/useGithubOrgStats'
import type { Widget } from '@/types/widget'
import { GithubCommitMetrics } from './github/GithubCommitMetrics'
import { GithubPrMetrics } from './github/GithubPrMetrics'
import { GithubRepoMetrics } from './github/GithubRepoMetrics'
import { GithubOrgMetrics } from './github/GithubOrgMetrics'

export interface GithubWidgetProps {
  widget: Widget
  className?: string
}

const COMMIT_METRICS = new Set([
  'total_commits',
  'lines_stats',
  'avg_commit_size',
  'commits_timeframes',
  'lines_timeframes',
  'active_days',
  'active_repos_count',
  'weekly_top_devs',
])

const PR_METRICS = new Set([
  'pr_overview',
  'pr_merge_rate',
  'pr_created_total',
  'code_reviews_done',
])

const REPO_METRICS = new Set([
  'top_repos_by_commits',
  'top_starred_repos',
  'recent_repos_list',
  'repo_overview',
  'repo_recent_commits',
  'repo_contributors',
  'repo_languages',
])

/**
 * @brief Renders the dashboard card that shows the selected GitHub metric with auto-refresh, loading and error states.
 * @param widget Widget config providing the GitHub metric, target repo or org, title and refresh interval.
 * @param className Optional extra CSS classes applied to the card (defaults to empty).
 * @return A Card with a header and refresh button, the commit, PR, repo or org metric content, and a footer with last-update time and a GitHub badge.
 */
export function GithubWidget({ widget, className = '' }: GithubWidgetProps) {
  const metric = widget.githubMetric || 'profile_card'
  const refreshInterval = Math.max(300, widget.refreshIntervalSeconds || 300)
  const { stats, loading, error, lastUpdated, refresh } = useGithubStats(refreshInterval)

  const isRepoMetric = metric.startsWith('repo_') || REPO_METRICS.has(metric)
  const isOrgMetric = metric === 'org_overview'

  const targetRepo = widget.repoFullName || stats?.recent_repos?.[0]?.full_name || ''
  const targetOrg = widget.orgName || stats?.organisations?.[0]?.login || stats?.profile?.login || ''

  const repoHook = useGithubRepoStats(isRepoMetric && targetRepo ? targetRepo : undefined, refreshInterval)
  const orgHook = useGithubOrgStats(isOrgMetric && targetOrg ? targetOrg : undefined, refreshInterval)

  const [secondsAgo, setSecondsAgo] = useState<number>(0)

  useEffect(() => {
    /**
     * @brief Updates the seconds-ago state from the time of the last successful stats refresh.
     */
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

  /**
   * @brief Builds the card body by choosing the commit, PR, repo or org metrics component, or a loading or error state.
   * @return JSX for the matching GitHub metrics component, a loading or error placeholder, or null when there are no stats.
   */
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

    if (COMMIT_METRICS.has(metric)) {
      return <GithubCommitMetrics metric={metric} stats={stats} />
    }

    if (PR_METRICS.has(metric)) {
      return <GithubPrMetrics metric={metric} stats={stats} />
    }

    if (REPO_METRICS.has(metric)) {
      return (
        <GithubRepoMetrics
          metric={metric}
          stats={stats}
          targetRepo={targetRepo}
          repoHook={repoHook}
        />
      )
    }

    return (
      <GithubOrgMetrics
        metric={metric}
        stats={stats}
        targetOrg={targetOrg}
        orgHook={orgHook}
      />
    )
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
            {stats?.profile?.login ? `@${stats.profile.login}` : 'GitHub'}
          </CardDescription>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
              onClick={() => refresh()}
              aria-label="Actualiser les données GitHub"
              title="Actualiser les données GitHub"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            Actualiser les données GitHub
          </TooltipContent>
        </Tooltip>
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
