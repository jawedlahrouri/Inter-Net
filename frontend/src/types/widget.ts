export type WidgetType = 'weather' | 'custom_api' | 'default' | 'steam'

export type SteamMetricType =
  | 'last_played'
  | 'most_played'
  | 'games_count'
  | 'total_playtime'
  | 'recent_playtime'
  | 'steam_level'
  | 'profile_status'
  | 'badges_count'
  | 'player_xp'
  | 'next_level_progress'
  | 'top_3_played'
  | 'top_3_recent'
  | 'unplayed_games'
  | 'avg_playtime_per_game'
  | 'recent_games_count'

export interface Widget {
  id: string
  title: string
  type?: WidgetType
  // For default / link
  url?: string
  // For weather
  city?: string
  lat?: number
  lon?: number
  // For custom_api
  apiUrl?: string
  jsonPath?: string
  displayMode?: 'kpi' | 'gauge'
  unit?: string
  refreshIntervalSeconds?: number
  gaugeMin?: number
  gaugeMax?: number
  // For Steam
  steamMetric?: SteamMetricType
}

export type NewWidgetData = Omit<Widget, 'id'>

