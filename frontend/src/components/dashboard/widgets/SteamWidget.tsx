import { useState, useEffect } from 'react'
import {
  Gamepad2,
  Trophy,
  Clock,
  Flame,
  Shield,
  Award,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
  BarChart3,
  Inbox,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSteamStats } from '@/hooks/useSteamStats'
import type { Widget } from '@/types/widget'

export interface SteamWidgetProps {
  widget: Widget
  className?: string
}

export function SteamWidget({ widget, className = '' }: SteamWidgetProps) {
  const metric = widget.steamMetric || 'profile_status'
  // Limite stricte à 5 minutes (300s) minimum pour préserver les quotas Steam
  const refreshInterval = Math.max(300, widget.refreshIntervalSeconds || 300)
  const { stats, loading, error, lastUpdated, refresh } = useSteamStats(refreshInterval)
  const [secondsAgo, setSecondsAgo] = useState<number>(0)
  const [backlogIndex, setBacklogIndex] = useState<number>(0)

  // Carousel automatique pour le backlog (défilement toutes les 3.5 secondes)
  useEffect(() => {
    if (metric !== 'unplayed_games') return
    const unplayed = stats?.unplayed_games_list
    if (!unplayed || unplayed.length <= 1) return

    const timer = setInterval(() => {
      setBacklogIndex((prev) => (prev + 1) % unplayed.length)
    }, 3500)

    return () => clearInterval(timer)
  }, [metric, stats?.unplayed_games_list])

  const handlePrevBacklog = (e: React.MouseEvent) => {
    e.stopPropagation()
    const unplayed = stats?.unplayed_games_list || []
    if (unplayed.length === 0) return
    setBacklogIndex((prev) => (prev - 1 + unplayed.length) % unplayed.length)
  }

  const handleNextBacklog = (e: React.MouseEvent) => {
    e.stopPropagation()
    const unplayed = stats?.unplayed_games_list || []
    if (unplayed.length === 0) return
    setBacklogIndex((prev) => (prev + 1) % unplayed.length)
  }

  // Timer for relative updated time
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
          <span className="text-xs">Chargement des données Steam en direct...</span>
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
      // 1. Dernier jeu joué
      case 'last_played': {
        const game = stats.last_played_game
        if (!game) {
          return (
            <div className="text-center py-6 text-muted-foreground text-xs">
              Aucun jeu joué récemment détecté.
            </div>
          )
        }
        return (
          <div className="space-y-3">
            {game.header_url && (
              <div className="relative rounded-lg overflow-hidden border border-border/80 aspect-[460/215] bg-black/40">
                <img
                  src={game.header_url}
                  alt={game.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    // Fallback on error
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
                <Badge className="absolute top-2 left-2 bg-black/70 backdrop-blur text-[10px] text-white border-0">
                  Dernière session
                </Badge>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-sm text-foreground truncate" title={game.name}>
                {game.name}
              </h4>
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>Temps total : <strong className="text-foreground">{game.playtime_forever_hours} h</strong></span>
                {game.playtime_2weeks_hours !== null && (
                  <span className="text-primary font-medium">
                    {game.playtime_2weeks_hours} h (14j)
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      }

      // 2. Jeu le plus joué
      case 'most_played': {
        const game = stats.most_played_game
        if (!game) {
          return (
            <div className="text-center py-6 text-muted-foreground text-xs">
              Aucun jeu trouvé.
            </div>
          )
        }
        return (
          <div className="space-y-3">
            {game.header_url && (
              <div className="relative rounded-lg overflow-hidden border border-amber-500/40 aspect-[460/215] bg-black/40">
                <img
                  src={game.header_url}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-2 left-2 bg-amber-500/90 text-white text-[10px] flex items-center gap-1 border-0">
                  <Trophy className="size-3" /> #1 Plus joué
                </Badge>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-sm text-foreground truncate" title={game.name}>
                {game.name}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Record de temps : <strong className="text-amber-500">{game.playtime_forever_hours} heures</strong>
              </p>
            </div>
          </div>
        )
      }

      // 3. Nombre de jeux
      case 'games_count': {
        const playedCount = Math.max(0, stats.games_count - stats.unplayed_games_count)
        return (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <div className="text-4xl font-extrabold tracking-tight text-foreground">
                {stats.games_count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Jeux possédés dans la bibliothèque
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <div className="font-semibold text-foreground">{playedCount}</div>
                <div className="text-[11px] text-muted-foreground">Déjà lancés</div>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <div className="font-semibold text-foreground">{stats.unplayed_games_count}</div>
                <div className="text-[11px] text-muted-foreground">Jamais lancés</div>
              </div>
            </div>
          </div>
        )
      }

      // 4. Heures cumulées
      case 'total_playtime': {
        const days = Math.round((stats.total_playtime_hours / 24) * 10) / 10
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex p-2.5 rounded-full bg-primary/10 text-primary mb-1">
              <Clock className="size-6" />
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.total_playtime_hours.toLocaleString('fr-FR')} <span className="text-lg font-medium text-muted-foreground">h</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Temps de jeu total cumulé sur Steam
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              Soit environ {days} jours non-stop de jeu
            </Badge>
          </div>
        )
      }

      // 5. Activité récente (14 jours)
      case 'recent_playtime': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex p-2.5 rounded-full bg-orange-500/10 text-orange-500 mb-1">
              <Flame className="size-6" />
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.recent_playtime_hours} <span className="text-lg font-medium text-muted-foreground">h</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Passées en jeu sur les 14 derniers jours
              </p>
            </div>
            <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-500">
              {stats.recent_games_count} jeu(x) actif(s) récemment
            </Badge>
          </div>
        )
      }

      // 6. Niveau Steam
      case 'steam_level': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-full border-4 border-primary bg-primary/10 text-primary text-2xl font-black shadow-inner mx-auto">
              {stats.steam_level}
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                Niveau Steam {stats.steam_level}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.player_xp} points d'expérience
              </p>
            </div>
          </div>
        )
      }

      // 7. Statut & Profil en direct
      case 'profile_status': {
        const isOnline = stats.profile.personastate !== 0
        const isInGame = stats.profile.is_in_game
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={stats.profile.avatarfull || stats.profile.avatar}
                  alt={stats.profile.personaname}
                  className={`size-14 rounded-full border-2 ${
                    isInGame
                      ? 'border-green-500 shadow-lg shadow-green-500/20'
                      : isOnline
                      ? 'border-sky-500'
                      : 'border-muted'
                  } object-cover`}
                />
                <span
                  className={`absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-card ${
                    isInGame ? 'bg-green-500 animate-pulse' : isOnline ? 'bg-sky-500' : 'bg-muted-foreground'
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-base text-foreground truncate">
                  {stats.profile.personaname}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge
                    variant={isInGame ? 'default' : isOnline ? 'secondary' : 'outline'}
                    className={`text-[10px] ${isInGame ? 'bg-green-600 hover:bg-green-600 text-white' : ''}`}
                  >
                    {stats.profile.status_label}
                  </Badge>
                </div>
              </div>
            </div>

            {isInGame && stats.profile.gameextrainfo && (
              <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-xs">
                <span className="text-green-600 dark:text-green-400 font-semibold block">
                  🎮 En cours de partie :
                </span>
                <span className="text-foreground font-medium truncate block mt-0.5">
                  {stats.profile.gameextrainfo}
                </span>
              </div>
            )}

            <div className="text-[11px] text-muted-foreground flex justify-between items-center pt-1 border-t border-border/50">
              <span>SteamID : {stats.steam_id}</span>
              {stats.profile.profileurl && (
                <a
                  href={stats.profile.profileurl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  Profil <ExternalLink className="size-2.5" />
                </a>
              )}
            </div>
          </div>
        )
      }

      // 8. Nombre de badges
      case 'badges_count': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex p-2.5 rounded-full bg-purple-500/10 text-purple-500 mb-1">
              <Award className="size-6" />
            </div>
            <div>
              <div className="text-4xl font-extrabold tracking-tight text-foreground">
                {stats.badges_count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Badges débloqués sur le compte
              </p>
            </div>
          </div>
        )
      }

      // 9. Points d'expérience (XP)
      case 'player_xp': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex p-2.5 rounded-full bg-amber-500/10 text-amber-500 mb-1">
              <Sparkles className="size-6" />
            </div>
            <div>
              <div className="text-4xl font-extrabold tracking-tight text-foreground">
                {stats.player_xp.toLocaleString('fr-FR')} <span className="text-lg font-medium text-muted-foreground">XP</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Expérience totale accumulée
              </p>
            </div>
          </div>
        )
      }

      // 10. Prochain niveau Steam
      case 'next_level_progress': {
        const prog = stats.next_level_progress
        return (
          <div className="space-y-3 py-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground">Niveau {stats.steam_level}</span>
              <span className="text-muted-foreground">Niveau {stats.steam_level + 1}</span>
            </div>

            <div className="w-full bg-muted rounded-full h-3 overflow-hidden border border-border/80">
              <div
                className="bg-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${prog.percent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{prog.percent}% complété</span>
              <span className="font-medium text-primary">{prog.xp_needed} XP manquants</span>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-1">
              {prog.xp_in_level} / {prog.total_level_span} XP pour monter de niveau
            </p>
          </div>
        )
      }

      // 11. Top 3 des jeux favoris
      case 'top_3_played': {
        return (
          <div className="space-y-2">
            {stats.top_3_played.map((game, idx) => (
              <div
                key={game.appid}
                className="flex items-center gap-2.5 p-1.5 rounded-lg bg-muted/30 border border-border/50 text-xs"
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
                {game.icon_url ? (
                  <img src={game.icon_url} alt="" className="size-6 rounded shrink-0 object-cover" />
                ) : (
                  <Gamepad2 className="size-5 text-muted-foreground shrink-0" />
                )}
                <span className="font-medium text-foreground truncate flex-1" title={game.name}>
                  {game.name}
                </span>
                <span className="font-semibold text-primary shrink-0">
                  {game.playtime_forever_hours}h
                </span>
              </div>
            ))}
          </div>
        )
      }

      // 12. Top 3 des jeux récents
      case 'top_3_recent': {
        if (!stats.top_3_recent || stats.top_3_recent.length === 0) {
          return (
            <div className="text-center py-6 text-muted-foreground text-xs">
              Aucun jeu récent enregistré.
            </div>
          )
        }
        return (
          <div className="space-y-2">
            {stats.top_3_recent.map((game) => (
              <div
                key={game.appid}
                className="flex items-center gap-2.5 p-1.5 rounded-lg bg-muted/30 border border-border/50 text-xs"
              >
                {game.icon_url ? (
                  <img src={game.icon_url} alt="" className="size-6 rounded shrink-0 object-cover" />
                ) : (
                  <Gamepad2 className="size-5 text-muted-foreground shrink-0" />
                )}
                <span className="font-medium text-foreground truncate flex-1" title={game.name}>
                  {game.name}
                </span>
                <span className="font-semibold text-orange-500 shrink-0">
                  {game.playtime_2weeks_hours ?? game.playtime_forever_hours}h
                </span>
              </div>
            ))}
          </div>
        )
      }

      // 13. Backlog (Jeux jamais lancés avec défilement des jaquettes)
      case 'unplayed_games': {
        const unplayed = stats.unplayed_games_list || []
        const percent =
          stats.games_count > 0
            ? Math.round((stats.unplayed_games_count / stats.games_count) * 100)
            : 0
        const currentGame = unplayed.length > 0 ? unplayed[backlogIndex % unplayed.length] : null

        return (
          <div className="space-y-2.5">
            {/* Statistique & Contrôles */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-foreground">
                  {stats.unplayed_games_count}
                </span>
                <span className="text-xs text-muted-foreground">
                  jeux jamais lancés ({percent}%)
                </span>
              </div>
              {unplayed.length > 0 && (
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground mr-1">
                    {((backlogIndex % unplayed.length) + 1)}/{unplayed.length}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={handlePrevBacklog}
                    title="Jeu précédent"
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={handleNextBacklog}
                    title="Jeu suivant"
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Image et nom du jeu en défilement */}
            {currentGame ? (
              <div className="relative rounded-lg overflow-hidden border border-border/80 aspect-[460/215] bg-black/40 group">
                <img
                  key={currentGame.appid}
                  src={currentGame.header_url}
                  alt={currentGame.name}
                  className="w-full h-full object-cover transition-all duration-300"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-2.5">
                  <Badge className="w-fit mb-1 bg-blue-600/90 text-white text-[9px] border-0 py-0 px-1.5 h-4">
                    Jamais lancé (0h)
                  </Badge>
                  <h5 className="text-xs font-bold text-white truncate drop-shadow" title={currentGame.name}>
                    {currentGame.name}
                  </h5>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-xs">
                Aucun jeu trouvé dans le backlog.
              </div>
            )}
          </div>
        )
      }

      // 14. Moyenne d'heures par jeu
      case 'avg_playtime_per_game': {
        return (
          <div className="space-y-3 py-2 text-center">
            <div className="inline-flex p-2.5 rounded-full bg-emerald-500/10 text-emerald-500 mb-1">
              <BarChart3 className="size-6" />
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.avg_hours_per_game} <span className="text-base font-normal text-muted-foreground">h / jeu</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Moyenne de temps par titre possédé
              </p>
            </div>
          </div>
        )
      }

      // 15. Nombre de jeux actifs récents avec liste des titres
      case 'recent_games_count': {
        const recentList = stats.recent_games_list || []
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-border/40">
              <div className="flex items-center gap-1.5 text-xs">
                <Flame className="size-4 text-rose-500" />
                <span className="font-bold text-foreground">
                  {stats.recent_games_count} jeux actifs
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                14 derniers jours
              </Badge>
            </div>

            {/* Liste scrollable des jeux récents avec noms et jaquettes */}
            <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-1">
              {recentList.length > 0 ? (
                recentList.map((game) => (
                  <div
                    key={game.appid}
                    className="flex items-center gap-2 p-1.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors border border-border/40 text-xs"
                  >
                    {game.icon_url ? (
                      <img src={game.icon_url} alt="" className="size-6 rounded shrink-0 object-cover" />
                    ) : (
                      <Gamepad2 className="size-5 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-medium text-foreground truncate flex-1" title={game.name}>
                      {game.name}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-semibold text-rose-500">
                      {game.playtime_2weeks_hours !== null && game.playtime_2weeks_hours !== undefined
                        ? `${game.playtime_2weeks_hours}h`
                        : `${game.playtime_forever_hours}h`}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-xs text-muted-foreground">
                  Aucun jeu actif ces 14 derniers jours.
                </p>
              )}
            </div>
          </div>
        )
      }


      default:
        return null
    }
  }

  const isLiveActive = stats?.profile?.personastate !== 0

  return (
    <Card className={`min-h-[320px] h-full bg-card border-border flex flex-col justify-between ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <Gamepad2 className="size-4 text-primary shrink-0" />
            <CardTitle className="text-base font-bold text-card-foreground truncate">
              {widget.title || 'Steam'}
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground truncate">
            {stats?.profile?.personaname ? `${stats.profile.personaname}` : 'Steam Live'}
          </CardDescription>
        </div>

        {/* Real-time status indicator & refresh button */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${
              isLiveActive
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : 'bg-muted text-muted-foreground border-border'
            }`}
            title="Mise à jour en temps réel active"
          >
            <span
              className={`size-1.5 rounded-full ${
                isLiveActive ? 'bg-emerald-500 animate-ping' : 'bg-muted-foreground'
              }`}
            />
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
          Steam
        </Badge>
      </CardFooter>

    </Card>
  )
}

export default SteamWidget
