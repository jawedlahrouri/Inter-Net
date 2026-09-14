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

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`);
  if (!response.ok) {
    throw new Error(`Failed to fetch health status: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchRoot(): Promise<RootResponse> {
  const response = await fetch(`${API_BASE_URL}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch root endpoint: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

