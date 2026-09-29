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

/**
 * @brief Reads the stored authentication token from the browser localStorage.
 * @return The stored access token string, or null when none is saved.
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * @brief Saves the authentication token in the browser localStorage.
 * @param token The JWT access token to persist.
 */
export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * @brief Removes the authentication token from the browser localStorage.
 */
export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/**
 * @brief Builds the backend URL that starts the Steam authentication flow, attaching the stored token when available.
 * @return The Steam auth URL string, with an encoded token query parameter if the user is logged in.
 */
export function getSteamAuthRedirectUrl(): string {
  const token = getStoredToken();
  return token
    ? `${API_BASE_URL}/api/v1/auth/steam?token=${encodeURIComponent(token)}`
    : `${API_BASE_URL}/api/v1/auth/steam`;
}

/**
 * @brief Builds the backend URL that starts the GitHub authentication flow, attaching the stored token when available.
 * @return The GitHub auth URL string, with an encoded token query parameter if the user is logged in.
 */
export function getGithubAuthRedirectUrl(): string {
  const token = getStoredToken();
  return token
    ? `${API_BASE_URL}/api/v1/auth/github?token=${encodeURIComponent(token)}`
    : `${API_BASE_URL}/api/v1/auth/github`;
}



/**
 * @brief Performs a fetch call to the backend API with JSON and bearer-token headers and throws an Error on non-OK responses.
 * @param endpoint The API path (prefixed with the base URL) or a full http URL to call.
 * @param options Optional fetch RequestInit settings such as method, headers and body.
 * @return A promise resolving to the parsed JSON response body typed as T.
 */
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
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * @brief Registers a new user through the API and stores the returned access token.
 * @param payload The registration data containing email, username and password.
 * @return A promise resolving to the token response with the access token and created user.
 */
export async function registerUser(payload: RegisterPayload): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(data.access_token);
  return data;
}

/**
 * @brief Logs a user in through the API and stores the returned access token.
 * @param payload The login data containing the identifier (email or username) and password.
 * @return A promise resolving to the token response with the access token and user.
 */
export async function loginUser(payload: LoginPayload): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(data.access_token);
  return data;
}

/**
 * @brief Fetches the profile of the currently authenticated user.
 * @return A promise resolving to the current User object.
 */
export async function fetchCurrentUser(): Promise<User> {
  return apiFetch<User>('/api/v1/auth/me');
}

/**
 * @brief Fetches the backend health status.
 * @return A promise resolving to the health response with status, version, timestamp and service name.
 */
export async function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/api/v1/health');
}

export interface QuoteResponse {
  quote: string;
  author: string;
}

/**
 * @brief Fetches a random motivational quote from the backend.
 * @return A promise resolving to an object with the quote text and its author.
 */
export async function fetchRandomQuote(): Promise<QuoteResponse> {
  return apiFetch<QuoteResponse>('/api/v1/quotes/random');
}

/**
 * @brief Fetches the backend root endpoint containing the welcome message and documentation links.
 * @return A promise resolving to the root response with message, docs and health paths.
 */
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

/**
 * @brief Fetches all widgets belonging to the authenticated user.
 * @return A promise resolving to the array of user widgets.
 */
export async function fetchUserWidgets(): Promise<ApiUserWidget[]> {
  return apiFetch<ApiUserWidget[]>('/api/v1/widgets');
}

/**
 * @brief Creates a new widget for the authenticated user.
 * @param payload The widget data such as type, title, parameter values, refresh rate, position and size.
 * @return A promise resolving to the newly created user widget.
 */
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

/**
 * @brief Updates an existing widget of the authenticated user.
 * @param widgetId The identifier of the widget to update.
 * @param payload The fields to change such as title, parameter values, refresh rate, position and size.
 * @return A promise resolving to the updated user widget.
 */
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

/**
 * @brief Deletes a widget of the authenticated user.
 * @param widgetId The identifier of the widget to delete.
 * @return A promise resolving to a confirmation message with the deleted widget id.
 */
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

/**
 * @brief Fetches the settings of the authenticated user.
 * @return A promise resolving to the user settings with meditation, dashboards and customization.
 */
export async function fetchUserSettings(): Promise<UserSettings> {
  return apiFetch<UserSettings>('/api/v1/auth/me/settings');
}

/**
 * @brief Partially updates the settings of the authenticated user via a PATCH request.
 * @param payload The partial meditation, dashboards and customization settings to apply.
 * @return A promise resolving to the updated user settings.
 */
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

/**
 * @brief Fetches the list of custom videos available to the user.
 * @return A promise resolving to an array of video information objects.
 */
export async function fetchCustomVideos(): Promise<VideoInfo[]> {
  return apiFetch<VideoInfo[]>('/api/v1/customization/videos');
}

/**
 * @brief Uploads a custom video file to the backend as multipart form data.
 * @param file The video file to upload.
 * @return A promise resolving to the information of the uploaded video.
 */
export async function uploadCustomVideoApi(file: File): Promise<VideoInfo> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<VideoInfo>('/api/v1/customization/videos/upload', {
    method: 'POST',
    body: formData,
  });
}

/**
 * @brief Fetches the list of custom background images available to the user.
 * @return A promise resolving to an array of background information objects.
 */
export async function fetchCustomBackgrounds(): Promise<BackgroundInfo[]> {
  return apiFetch<BackgroundInfo[]>('/api/v1/customization/backgrounds');
}

/**
 * @brief Uploads a custom background image to the backend as multipart form data.
 * @param file The background image file to upload.
 * @return A promise resolving to the information of the uploaded background.
 */
export async function uploadCustomBackgroundApi(file: File): Promise<BackgroundInfo> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<BackgroundInfo>('/api/v1/customization/backgrounds/upload', {
    method: 'POST',
    body: formData,
  });
}

/**
 * @brief Fetches the list of custom music tracks available to the user.
 * @return A promise resolving to an array of music information objects.
 */
export async function fetchCustomMusic(): Promise<MusicInfo[]> {
  return apiFetch<MusicInfo[]>('/api/v1/customization/music');
}

/**
 * @brief Uploads a custom music file to the backend as multipart form data.
 * @param file The audio file to upload.
 * @return A promise resolving to the information of the uploaded music track.
 */
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

/**
 * @brief Fetches whether the user has a linked Steam account and its profile.
 * @return A promise resolving to the Steam status with the connected flag, steam id and profile.
 */
export async function fetchSteamStatus(): Promise<SteamStatusResponse> {
  return apiFetch<SteamStatusResponse>('/api/v1/auth/steam/status');
}

/**
 * @brief Unlinks the Steam account from the authenticated user.
 * @return A promise resolving to an object containing a confirmation message.
 */
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

/**
 * @brief Fetches the Steam statistics of the linked account, optionally bypassing the backend cache.
 * @param forceRefresh When true, asks the backend to refresh the data instead of using cached values.
 * @return A promise resolving to the Steam user statistics.
 */
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

/**
 * @brief Fetches whether the user has a linked GitHub account and its profile.
 * @return A promise resolving to the GitHub status with the connected flag and profile.
 */
export async function fetchGithubStatus(): Promise<GithubStatusResponse> {
  return apiFetch<GithubStatusResponse>('/api/v1/auth/github/status');
}

/**
 * @brief Unlinks the GitHub account from the authenticated user.
 * @return A promise resolving to an object containing a confirmation message.
 */
export async function disconnectGithub(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/v1/auth/github/disconnect', {
    method: 'POST',
  });
}

/**
 * @brief Links a GitHub account by sending a personal access token to the backend.
 * @param token The GitHub personal access token to register.
 * @return A promise resolving to a message and the linked GitHub profile.
 */
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
  total_commits: number;
  lines_added: number;
  lines_deleted: number;
  lines_ratio: number;
  avg_commit_size: number;
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
  weekly_top_devs: WeeklyTopDev[];
  pr_open_count: number;
  pr_merged_count: number;
  pr_closed_unmerged: number;
  pr_merge_rate: number;
  pr_created_total: number;
  code_reviews_done: number;
  joined_projects_count: number;
  owned_projects_count: number;
  collab_projects_count: number;
  avg_team_size: number;
  avg_seniority_days: number;
  oldest_project_age_days: number;
  organisations?: GithubOrgInfo[];
  org_count?: number;
  repos_by_owner?: GithubRepoByOwner[];
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

/**
 * @brief Fetches the aggregated GitHub statistics of the linked user, optionally bypassing the backend cache.
 * @param forceRefresh When true, asks the backend to refresh the data instead of using cached values.
 * @return A promise resolving to the GitHub user statistics.
 */
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

/**
 * @brief Fetches the GitHub organisations the linked user belongs to.
 * @return A promise resolving to an array of GitHub organisation summaries.
 */
export async function fetchGithubUserOrgs(): Promise<GithubOrgInfo[]> {
  return apiFetch<GithubOrgInfo[]>('/api/v1/auth/github/user/orgs');
}

/**
 * @brief Fetches detailed statistics of a GitHub organisation, optionally bypassing the backend cache.
 * @param org The login of the GitHub organisation.
 * @param forceRefresh When true, asks the backend to refresh the data instead of using cached values.
 * @return A promise resolving to the detailed organisation statistics.
 */
export async function fetchGithubOrgStats(org: string, forceRefresh: boolean = false): Promise<GithubOrgDetailedStats> {
  const query = forceRefresh ? '?force_refresh=true' : '';
  return apiFetch<GithubOrgDetailedStats>(`/api/v1/auth/github/orgs/${encodeURIComponent(org)}/stats${query}`);
}

/**
 * @brief Fetches detailed statistics of a GitHub repository, optionally bypassing the backend cache.
 * @param owner The login of the repository owner.
 * @param repo The name of the repository.
 * @param forceRefresh When true, asks the backend to refresh the data instead of using cached values.
 * @return A promise resolving to the detailed repository statistics.
 */
export async function fetchGithubRepoStats(owner: string, repo: string, forceRefresh: boolean = false): Promise<GithubRepoDetailedStats> {
  const query = forceRefresh ? '?force_refresh=true' : '';
  return apiFetch<GithubRepoDetailedStats>(`/api/v1/auth/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/stats${query}`);
}

export interface AdminStats {
  total_users: number;
  total_admins: number;
  total_dashboards: number;
  total_widgets: number;
}

export interface AdminUserSummary {
  id: number;
  email: string;
  username: string;
  role: 'user' | 'admin';
  created_at: string;
  dashboards_count: number;
  widgets_count: number;
}

export interface AdminUserCreatePayload {
  email: string;
  username: string;
  password: string;
  role: 'user' | 'admin';
}

export interface AdminUserUpdatePayload {
  email?: string;
  username?: string;
  role?: 'user' | 'admin';
  password?: string;
}

export interface AdminUserDetail {
  id: number;
  email: string;
  username: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  dashboards: DashboardPageInfo[];
  widgets: ApiUserWidget[];
}

export interface AdminDashboardSummary {
  dashboard_id: string;
  user_id: number;
  user_username: string;
  user_email: string;
  name: string;
  primary_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  background_image?: string | null;
  widgets_count: number;
}

export interface AdminDashboardDetail {
  dashboard_id: string;
  user_id: number;
  user_username: string;
  user_email: string;
  name: string;
  primary_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  background_image?: string | null;
  widgets: ApiUserWidget[];
}

export interface AdminDashboardCreatePayload {
  name: string;
  primary_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  background_image?: string | null;
}

export interface AdminDashboardUpdatePayload {
  name?: string;
  primary_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  background_image?: string | null;
}

/**
 * @brief Fetches global platform counters for the admin panel.
 * @return A promise resolving to the totals of users, admins, dashboards and widgets.
 */
export async function fetchAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>('/api/v1/admin/stats');
}

/**
 * @brief Fetches the list of users for the admin panel with optional search and role filters.
 * @param q Optional search text matched against users.
 * @param role Optional role to filter users by.
 * @return A promise resolving to an array of admin user summaries.
 */
export async function fetchAdminUsers(q?: string, role?: string): Promise<AdminUserSummary[]> {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (role) params.set('role', role);
  const qs = params.toString();
  return apiFetch<AdminUserSummary[]>(`/api/v1/admin/users${qs ? `?${qs}` : ''}`);
}

/**
 * @brief Fetches the full details of a user, including dashboards and widgets, as an admin.
 * @param userId The identifier of the user to inspect.
 * @return A promise resolving to the admin user detail.
 */
export async function fetchAdminUserDetail(userId: number): Promise<AdminUserDetail> {
  return apiFetch<AdminUserDetail>(`/api/v1/admin/users/${userId}`);
}

/**
 * @brief Creates a new user account as an admin.
 * @param payload The new user's email, username, password and role.
 * @return A promise resolving to the created user's detail.
 */
export async function createAdminUser(payload: AdminUserCreatePayload): Promise<AdminUserDetail> {
  return apiFetch<AdminUserDetail>('/api/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * @brief Updates an existing user account as an admin.
 * @param userId The identifier of the user to update.
 * @param payload The fields to change such as email, username, role or password.
 * @return A promise resolving to the updated user's detail.
 */
export async function updateAdminUser(userId: number, payload: AdminUserUpdatePayload): Promise<AdminUserDetail> {
  return apiFetch<AdminUserDetail>(`/api/v1/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * @brief Deletes a user account as an admin.
 * @param userId The identifier of the user to delete.
 * @return A promise resolving to a confirmation message and the deleted user id.
 */
export async function deleteAdminUser(userId: number): Promise<{ message: string; id: number }> {
  return apiFetch<{ message: string; id: number }>(`/api/v1/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

/**
 * @brief Fetches dashboards across users for the admin panel with optional user and search filters.
 * @param userId Optional user identifier to restrict dashboards to.
 * @param q Optional search text matched against dashboards.
 * @return A promise resolving to an array of admin dashboard summaries.
 */
export async function fetchAdminDashboards(userId?: number, q?: string): Promise<AdminDashboardSummary[]> {
  const params = new URLSearchParams();
  if (userId) params.set('user_id', String(userId));
  if (q) params.set('q', q);
  const qs = params.toString();
  return apiFetch<AdminDashboardSummary[]>(`/api/v1/admin/dashboards${qs ? `?${qs}` : ''}`);
}

/**
 * @brief Fetches the details and widgets of a specific user dashboard as an admin.
 * @param userId The identifier of the dashboard owner.
 * @param dashboardId The identifier of the dashboard to fetch.
 * @return A promise resolving to the admin dashboard detail.
 */
export async function fetchAdminDashboardDetail(userId: number, dashboardId: string): Promise<AdminDashboardDetail> {
  return apiFetch<AdminDashboardDetail>(`/api/v1/admin/users/${userId}/dashboards/${encodeURIComponent(dashboardId)}`);
}

/**
 * @brief Creates a dashboard for a given user as an admin.
 * @param userId The identifier of the user who will own the dashboard.
 * @param payload The dashboard name, colors and background image.
 * @return A promise resolving to the created dashboard detail.
 */
export async function createAdminDashboard(userId: number, payload: AdminDashboardCreatePayload): Promise<AdminDashboardDetail> {
  return apiFetch<AdminDashboardDetail>(`/api/v1/admin/users/${userId}/dashboards`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * @brief Updates a user's dashboard as an admin.
 * @param userId The identifier of the dashboard owner.
 * @param dashboardId The identifier of the dashboard to update.
 * @param payload The dashboard fields to change such as name, colors or background image.
 * @return A promise resolving to the updated dashboard detail.
 */
export async function updateAdminDashboard(
  userId: number,
  dashboardId: string,
  payload: AdminDashboardUpdatePayload
): Promise<AdminDashboardDetail> {
  return apiFetch<AdminDashboardDetail>(`/api/v1/admin/users/${userId}/dashboards/${encodeURIComponent(dashboardId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * @brief Deletes a user's dashboard as an admin.
 * @param userId The identifier of the dashboard owner.
 * @param dashboardId The identifier of the dashboard to delete.
 * @return A promise resolving to a confirmation message and the deleted dashboard id.
 */
export async function deleteAdminDashboard(userId: number, dashboardId: string): Promise<{ message: string; dashboard_id: string }> {
  return apiFetch<{ message: string; dashboard_id: string }>(
    `/api/v1/admin/users/${userId}/dashboards/${encodeURIComponent(dashboardId)}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * @brief Creates a widget for a given user as an admin.
 * @param userId The identifier of the user who will own the widget.
 * @param payload The widget title, type, parameter values, refresh rate and size.
 * @return A promise resolving to the created user widget.
 */
export async function createAdminWidget(
  userId: number,
  payload: {
    title?: string;
    type?: string;
    params_values: Record<string, any>;
    refresh_rate?: number;
    width?: number;
    height?: number;
  }
): Promise<ApiUserWidget> {
  return apiFetch<ApiUserWidget>(`/api/v1/admin/users/${userId}/widgets`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * @brief Updates a user's widget as an admin.
 * @param userId The identifier of the widget owner.
 * @param widgetId The identifier of the widget to update.
 * @param payload The widget fields to change such as title, parameters, refresh rate, size and position.
 * @return A promise resolving to the updated user widget.
 */
export async function updateAdminWidget(
  userId: number,
  widgetId: number | string,
  payload: {
    title?: string;
    params_values?: Record<string, any>;
    refresh_rate?: number;
    width?: number;
    height?: number;
    position_x?: number;
    position_y?: number;
  }
): Promise<ApiUserWidget> {
  return apiFetch<ApiUserWidget>(`/api/v1/admin/users/${userId}/widgets/${widgetId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * @brief Deletes a user's widget as an admin.
 * @param userId The identifier of the widget owner.
 * @param widgetId The identifier of the widget to delete.
 * @return A promise resolving to a confirmation message and the deleted widget id.
 */
export async function deleteAdminWidget(
  userId: number,
  widgetId: number | string
): Promise<{ message: string; id: number }> {
  return apiFetch<{ message: string; id: number }>(`/api/v1/admin/users/${userId}/widgets/${widgetId}`, {
    method: 'DELETE',
  });
}




