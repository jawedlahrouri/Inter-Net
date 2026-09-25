export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  service: string;
}

export interface RootResponse {
  message: string;
  docs: string;
  health: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

const TOKEN_KEY = 'dashboard_access_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export function getSteamAuthRedirectUrl(): string {
  const token = getStoredToken();
  return token
    ? `${API_BASE_URL}/api/v1/auth/steam?token=${encodeURIComponent(token)}`
    : `${API_BASE_URL}/api/v1/auth/steam`;
}

export function getGithubAuthRedirectUrl(): string {
  const token = getStoredToken();
  return token
    ? `${API_BASE_URL}/api/v1/auth/github?token=${encodeURIComponent(token)}`
    : `${API_BASE_URL}/api/v1/auth/github`;
}



export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function registerUser(payload: RegisterPayload): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(data.access_token);
  return data;
}

export async function loginUser(payload: LoginPayload): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(data.access_token);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  return apiFetch<User>('/api/v1/auth/me');
}

export async function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/api/v1/health');
}

export interface QuoteResponse {
  quote: string;
  author: string;
}

export async function fetchRandomQuote(): Promise<QuoteResponse> {
  return apiFetch<QuoteResponse>('/api/v1/quotes/random');
}

export async function fetchRoot(): Promise<RootResponse> {
  return apiFetch<RootResponse>('/');
}

export interface DeleteWidgetResponse {
  message: string;
  id: number;
}

export interface ApiWidgetDefinition {
  id: number;
  service_id: number;
  name: string;
  display_name: string;
  description?: string;
  params_schema: any;
}

export interface ApiUserWidget {
  id: number;
  user_id: number;
  widget_id?: number;
  type?: string;
  title?: string;
  params_values: Record<string, any>;

  refresh_rate: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
  widget_def?: ApiWidgetDefinition;
}

export async function fetchUserWidgets(): Promise<ApiUserWidget[]> {
  return apiFetch<ApiUserWidget[]>('/api/v1/widgets');
}

export async function createUserWidget(payload: {
  widget_id?: number;
  type?: string;
  title?: string;
  params_values: Record<string, any>;
  refresh_rate?: number;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
}): Promise<ApiUserWidget> {
  return apiFetch<ApiUserWidget>('/api/v1/widgets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUserWidget(
  widgetId: string | number,
  payload: {
    title?: string;
    params_values?: Record<string, any>;
    refresh_rate?: number;
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
  }
): Promise<ApiUserWidget> {
  return apiFetch<ApiUserWidget>(`/api/v1/widgets/${widgetId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteWidgetApi(widgetId: string | number): Promise<DeleteWidgetResponse> {
  return apiFetch<DeleteWidgetResponse>(`/api/v1/widgets/${widgetId}`, {
    method: 'DELETE',
  });
}

export interface MeditationSettings {
  video_enabled: boolean;
  video_url: string;
  sound_enabled: boolean;
}

export interface DashboardPageInfo {
  id: string;
  name: string;
  primary_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  background_image?: string | null;
  background_music?: string | null;
  background_music_name?: string | null;
}

export interface ThemeCustomization {
  primary_color: string;
  secondary_color: string;
  tertiary_color: string;
  background_image?: string | null;
  background_music?: string | null;
  background_music_name?: string | null;
}

export interface UserSettings {
  meditation: MeditationSettings;
  dashboards?: DashboardPageInfo[];
  customization?: ThemeCustomization;
}

export interface VideoInfo {
  id: string;
  name: string;
  filename: string;
  url: string;
  size: number;
}

export interface BackgroundInfo {
  id: string;
  name: string;
  filename: string;
  url: string;
  size: number;
}

export interface MusicInfo {
  id: string;
  name: string;
  filename: string;
  url: string;
  size: number;
}

export async function fetchUserSettings(): Promise<UserSettings> {
  return apiFetch<UserSettings>('/api/v1/auth/me/settings');
}

export async function updateUserSettingsApi(payload: {
  meditation?: Partial<MeditationSettings>;
  dashboards?: DashboardPageInfo[];
  customization?: Partial<ThemeCustomization>;
}): Promise<UserSettings> {
  return apiFetch<UserSettings>('/api/v1/auth/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function fetchCustomVideos(): Promise<VideoInfo[]> {
  return apiFetch<VideoInfo[]>('/api/v1/customization/videos');
}

export async function uploadCustomVideoApi(file: File): Promise<VideoInfo> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<VideoInfo>('/api/v1/customization/videos/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function fetchCustomBackgrounds(): Promise<BackgroundInfo[]> {
  return apiFetch<BackgroundInfo[]>('/api/v1/customization/backgrounds');
}

export async function uploadCustomBackgroundApi(file: File): Promise<BackgroundInfo> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<BackgroundInfo>('/api/v1/customization/backgrounds/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function fetchCustomMusic(): Promise<MusicInfo[]> {
  return apiFetch<MusicInfo[]>('/api/v1/customization/music');
}

export async function uploadCustomMusicApi(file: File): Promise<MusicInfo> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<MusicInfo>('/api/v1/customization/music/upload', {
    method: 'POST',
    body: formData,
  });
}

export interface SteamStatusResponse {
  connected: boolean;
  steam_id?: string;
  profile?: {
    steam_id: string;
    username: string;
    avatar: string;
    profile_url: string;
  };
}

export async function fetchSteamStatus(): Promise<SteamStatusResponse> {
  return apiFetch<SteamStatusResponse>('/api/v1/auth/steam/status');
}

export async function disconnectSteam(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/v1/auth/steam/disconnect', {
    method: 'POST',
  });
}

export interface SteamGameInfo {
  appid: number;
  name: string;
  playtime_forever_hours: number;
  playtime_2weeks_hours: number | null;
  icon_url: string;
  header_url: string;
}

export interface SteamProfileInfo {
  personaname: string;
  avatar: string;
  avatarfull: string;
  profileurl: string;
  personastate: number;
  gameextrainfo?: string | null;
  status_label: string;
  is_in_game: boolean;
}

export interface SteamLevelProgress {
  current_xp: number;
  xp_in_level: number;
  xp_needed: number;
  total_level_span: number;
  percent: number;
}

export interface SteamUserStats {
  steam_id: string;
  profile: SteamProfileInfo;
  last_played_game: SteamGameInfo | null;
  most_played_game: SteamGameInfo | null;
  games_count: number;
  total_playtime_hours: number;
  recent_playtime_hours: number;
  steam_level: number;
  badges_count: number;
  player_xp: number;
  xp_needed_to_level_up: number;
  next_level_progress: SteamLevelProgress;
  top_3_played: SteamGameInfo[];
  top_3_recent: SteamGameInfo[];
  unplayed_games_count: number;
  unplayed_games_list?: SteamGameInfo[];
  avg_hours_per_game: number;
  recent_games_count: number;
  recent_games_list?: SteamGameInfo[];
}

export async function fetchSteamUserStats(forceRefresh: boolean = false): Promise<SteamUserStats> {
  const query = forceRefresh ? '?force_refresh=true' : '';
  return apiFetch<SteamUserStats>(`/api/v1/auth/steam/user/stats${query}`);
}

export interface GithubProfileInfo {
  github_id?: string;
  login?: string;
  name?: string;
  username?: string;
  avatar?: string;
  avatar_url?: string;
  profile_url?: string;
  html_url?: string;
  bio?: string;
  location?: string;
  company?: string;
  blog?: string;
  public_repos?: number;
  followers?: number;
  following?: number;
}

export interface GithubStatusResponse {
  connected: boolean;
  access_token?: string;
  profile?: GithubProfileInfo;
  connected_at?: string;
}

export async function fetchGithubStatus(): Promise<GithubStatusResponse> {
  return apiFetch<GithubStatusResponse>('/api/v1/auth/github/status');
}

export async function disconnectGithub(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/v1/auth/github/disconnect', {
    method: 'POST',
  });
}

export async function connectGithubToken(token: string): Promise<{ message: string; profile: GithubProfileInfo }> {
  return apiFetch<{ message: string; profile: GithubProfileInfo }>('/api/v1/auth/github/token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export interface GithubRepoInfo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  is_private: boolean;
}

export interface WeeklyTopDev {
  rank: number;
  login: string;
  username: string;
  avatar: string;
  commits: number;
  percentage: number;
}

export interface GithubUserStats {
  profile: GithubProfileInfo;
  // Volume & Lignes
  total_commits: number;
  lines_added: number;
  lines_deleted: number;
  lines_ratio: number;
  avg_commit_size: number;
  // Fenêtres temporelles & Jours actifs
  commits_7d: number;
  commits_30d: number;
  commits_90d: number;
  lines_added_7d: number;
  lines_added_30d: number;
  lines_added_90d: number;
  lines_deleted_7d: number;
  lines_deleted_30d: number;
  lines_deleted_90d: number;
  active_days_30d: number;
  active_days_365d: number;
  active_repos_count: number;
  // Semaine
  weekly_top_devs: WeeklyTopDev[];
  // Pull Requests & Reviews
  pr_open_count: number;
  pr_merged_count: number;
  pr_closed_unmerged: number;
  pr_merge_rate: number;
  pr_created_total: number;
  code_reviews_done: number;
  // Projets & Collaboration
  joined_projects_count: number;
  owned_projects_count: number;
  collab_projects_count: number;
  avg_team_size: number;
  avg_seniority_days: number;
  oldest_project_age_days: number;
  // Organisations & Ventilation
  organisations?: GithubOrgInfo[];
  org_count?: number;
  repos_by_owner?: GithubRepoByOwner[];
  // Repos & Notoriété
  total_stars: number;
  total_forks: number;
  total_open_issues: number;
  public_repos_count: number;
  public_gists_count: number;
  followers_count: number;
  following_count: number;
  recent_repos: GithubRepoInfo[];
  top_starred_repo: GithubRepoInfo | null;
  top_starred_repos: GithubRepoInfo[];
  top_repos_by_commits: GithubRepoInfo[];
  primary_language: string;
  top_languages: Array<{ name: string; count: number; percentage?: number }>;
  last_updated: number;
}

export async function fetchGithubUserStats(forceRefresh: boolean = false): Promise<GithubUserStats> {
  const query = forceRefresh ? '?force_refresh=true' : '';
  return apiFetch<GithubUserStats>(`/api/v1/auth/github/user/stats${query}`);
}

export interface GithubOrgInfo {
  id: number;
  login: string;
  avatar_url: string;
  description: string;
}

export interface GithubRepoByOwner {
  owner: string;
  count: number;
  stars: number;
  forks: number;
  is_user: boolean;
  repos: string[];
}

export interface GithubCommitItem {
  sha: string;
  message: string;
  author: string;
  author_login: string;
  author_avatar: string;
  date: string;
  html_url: string;
}

export interface GithubContributorItem {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

export interface GithubLanguageItem {
  name: string;
  bytes: number;
  percentage: number;
}

export interface GithubRepoDetailedStats {
  repo: GithubRepoInfo;
  commits: GithubCommitItem[];
  contributors: GithubContributorItem[];
  languages: GithubLanguageItem[];
  last_updated: number;
}

export interface GithubOrgDetailedStats {
  org: {
    id: number;
    login: string;
    name: string;
    description: string;
    avatar_url: string;
    html_url: string;
    public_repos: number;
    followers: number;
    created_at?: string;
    blog?: string;
    location?: string;
  };
  total_stars: number;
  total_forks: number;
  repos_count: number;
  repos: GithubRepoInfo[];
  top_languages: Array<{ name: string; count: number; percentage: number }>;
  primary_language: string;
  last_updated: number;
}

export async function fetchGithubUserOrgs(): Promise<GithubOrgInfo[]> {
  return apiFetch<GithubOrgInfo[]>('/api/v1/auth/github/user/orgs');
}

export async function fetchGithubOrgStats(org: string, forceRefresh: boolean = false): Promise<GithubOrgDetailedStats> {
  const query = forceRefresh ? '?force_refresh=true' : '';
  return apiFetch<GithubOrgDetailedStats>(`/api/v1/auth/github/orgs/${encodeURIComponent(org)}/stats${query}`);
}

export async function fetchGithubRepoStats(owner: string, repo: string, forceRefresh: boolean = false): Promise<GithubRepoDetailedStats> {
  const query = forceRefresh ? '?force_refresh=true' : '';
  return apiFetch<GithubRepoDetailedStats>(`/api/v1/auth/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/stats${query}`);
}



