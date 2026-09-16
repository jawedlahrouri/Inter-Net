import { FolderGit2, Building } from 'lucide-react'
import type { GithubUserStats } from '@/services/api'
import type { GithubMetricType } from '@/types/widget'

interface GithubParamsFormProps {
  selectedPreset: GithubMetricType
  githubStats: GithubUserStats | null
  selectedRepoFullName: string
  selectedOrgName: string
  onRepoChange: (repo: string) => void
  onOrgChange: (org: string) => void
}

export function GithubParamsForm({
  selectedPreset,
  githubStats,
  selectedRepoFullName,
  selectedOrgName,
  onRepoChange,
  onOrgChange,
}: GithubParamsFormProps) {
  return (
    <div className="space-y-3">
      {selectedPreset.startsWith('repo_') && (
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
                onChange={(e) => onRepoChange(e.target.value)}
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
              onChange={(e) => onRepoChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Laissez vide pour cibler automatiquement votre dépôt le plus actif.
          </p>
        </div>
      )}

      {selectedPreset === 'org_overview' && (
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
                onChange={(e) => onOrgChange(e.target.value)}
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
              onChange={(e) => onOrgChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Organisation dont vous souhaitez consulter les statistiques.
          </p>
        </div>
      )}
    </div>
  )
}
