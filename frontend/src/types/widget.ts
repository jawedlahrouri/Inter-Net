export type WidgetType = 'weather' | 'custom_api' | 'default' | 'steam' | 'github'

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

export type GithubMetricType =
  | 'total_commits'
  | 'lines_stats'
  | 'avg_commit_size'
  | 'commits_timeframes'
  | 'lines_timeframes'
  | 'active_days'
  | 'active_repos_count'
  | 'weekly_top_devs'
  | 'pr_overview'
  | 'pr_merge_rate'
  | 'pr_created_total'
  | 'code_reviews_done'
  | 'projects_collaboration'
  | 'avg_team_size'
  | 'project_seniority'
  | 'top_repos_by_commits'
  | 'top_starred_repos'
  | 'recent_repos_list'
  | 'primary_language'
  | 'languages_breakdown'
  | 'profile_card'
  | 'repo_overview'
  | 'repo_recent_commits'
  | 'repo_contributors'
  | 'repo_languages'
  | 'org_overview'
  | 'orgs_list'
  | 'repos_by_org'

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
  // For GitHub
  githubMetric?: GithubMetricType
  repoFullName?: string
  orgName?: string
  dashboardId?: string
  width?: number
  height?: number
}

export interface DashboardPage {
  id: string
  name: string
}

export type NewWidgetData = Omit<Widget, 'id'>


