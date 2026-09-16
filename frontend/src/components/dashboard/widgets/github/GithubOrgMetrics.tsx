import {
  Users,
  Clock,
  Code2,
  Layers,
  MapPin,
  ExternalLink,
  Building,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { GithubUserStats } from '@/services/api'
import type { GithubMetricType } from '@/types/widget'
import type { useGithubOrgStats } from '@/hooks/useGithubOrgStats'

type OrgHookReturn = ReturnType<typeof useGithubOrgStats>

interface GithubOrgMetricsProps {
  metric: GithubMetricType
  stats: GithubUserStats
  targetOrg: string
  orgHook: OrgHookReturn
}

export function GithubOrgMetrics({
  metric,
  stats,
  targetOrg,
  orgHook,
}: GithubOrgMetricsProps) {
  switch (metric) {
    // 13. Projets & Statut (Owner / Collab)
    case 'projects_collaboration':
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

    // 14. Taille moyenne d'équipe
    case 'avg_team_size':
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

    // 15. Ancienneté des projets
    case 'project_seniority':
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

    // 19. Langage de prédilection
    case 'primary_language':
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

    // Activité d'une organisation
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

    // Liste des organisations
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

    // Répartition par organisation
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

    default:
      return null
  }
}
