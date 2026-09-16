import {
  GitPullRequest,
  CheckCircle2,
  Award,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { GithubUserStats } from '@/services/api'
import type { GithubMetricType } from '@/types/widget'

interface GithubPrMetricsProps {
  metric: GithubMetricType
  stats: GithubUserStats
}

export function GithubPrMetrics({ metric, stats }: GithubPrMetricsProps) {
  switch (metric) {
    // 9. Pull Requests — Répartition
    case 'pr_overview':
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

    // 10. Taux de PR mergées
    case 'pr_merge_rate':
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

    // 11. PR créées (total)
    case 'pr_created_total':
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

    // 12. Reviews de code effectuées
    case 'code_reviews_done':
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

    default:
      return null
  }
}
