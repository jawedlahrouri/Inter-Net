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

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

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
