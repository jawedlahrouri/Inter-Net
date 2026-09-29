import { useState, useEffect, useCallback } from 'react'
import { fetchGithubUserStats, type GithubUserStats } from '@/services/api'

export const MIN_GITHUB_INTERVAL_SECONDS = 300

let cachedStats: GithubUserStats | null = null
let cachedError: string | null = null
let isFetching = false
let lastFetchTime: Date | null = null
const subscribers = new Set<(stats: GithubUserStats | null, error: string | null, loading: boolean) => void>()

let globalIntervalId: ReturnType<typeof setInterval> | null = null
let activeMinInterval = MIN_GITHUB_INTERVAL_SECONDS

/**
 * @brief Calls every subscribed listener with the cached stats, cached error and the given loading flag.
 * @param loading Whether a fetch is currently in progress.
 */
function notifySubscribers(loading: boolean) {
  subscribers.forEach((cb) => cb(cachedStats, cachedError, loading))
}

/**
 * @brief Fetches GitHub user stats into the shared cache unless a fetch is running, notifying subscribers before and after.
 * @param forceRefresh Whether to bypass the server-side cache when fetching.
 * @return A promise resolving to the fetched stats, the cached stats if already fetching, or null on error.
 */
export async function refreshGithubStats(forceRefresh: boolean = false): Promise<GithubUserStats | null> {
  if (isFetching) return cachedStats
  isFetching = true
  notifySubscribers(true)

  try {
    const data = await fetchGithubUserStats(forceRefresh)
    cachedStats = data
    cachedError = null
    lastFetchTime = new Date()
    return data
  } catch (err: any) {
    cachedError = err?.message || 'Impossible de récupérer les statistiques GitHub.'
    return null
  } finally {
    isFetching = false
    notifySubscribers(false)
  }
}

/**
 * @brief Resets the shared polling interval so it runs only while subscribers exist, using at least the minimum interval.
 */
function updateGlobalTimer() {
  if (globalIntervalId) {
    clearInterval(globalIntervalId)
    globalIntervalId = null
  }

  if (subscribers.size > 0) {
    const effectiveInterval = Math.max(MIN_GITHUB_INTERVAL_SECONDS, activeMinInterval)
    globalIntervalId = setInterval(() => {
      refreshGithubStats(false)
    }, effectiveInterval * 1000)
  }
}

/**
 * @brief Subscribes a component to the shared, periodically refreshed GitHub stats cache.
 * @param intervalSeconds The desired refresh interval in seconds, raised to the minimum allowed value.
 * @return An object with stats, loading, error, lastUpdated and a refresh function that forces a reload.
 */
export function useGithubStats(intervalSeconds: number = MIN_GITHUB_INTERVAL_SECONDS) {
  const [stats, setStats] = useState<GithubUserStats | null>(cachedStats)
  const [error, setError] = useState<string | null>(cachedError)
  const [loading, setLoading] = useState<boolean>(isFetching)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(lastFetchTime)

  useEffect(() => {
    /**
     * @brief Subscriber callback that copies the shared stats, error, loading flag and last fetch time into hook state.
     * @param newStats The latest cached GitHub stats, or null.
     * @param newError The latest error message, or null.
     * @param isLoading Whether a fetch is currently in progress.
     */
    const handleUpdate = (
      newStats: GithubUserStats | null,
      newError: string | null,
      isLoading: boolean
    ) => {
      setStats(newStats)
      setError(newError)
      setLoading(isLoading)
      setLastUpdated(lastFetchTime)
    }

    subscribers.add(handleUpdate)

    const validatedInterval = Math.max(MIN_GITHUB_INTERVAL_SECONDS, intervalSeconds)
    if (validatedInterval < activeMinInterval) {
      activeMinInterval = validatedInterval
    }
    updateGlobalTimer()

    const now = Date.now()
    if (!cachedStats || !lastFetchTime || now - lastFetchTime.getTime() > MIN_GITHUB_INTERVAL_SECONDS * 1000) {
      refreshGithubStats(false)
    } else {
      setStats(cachedStats)
      setLastUpdated(lastFetchTime)
    }

    return () => {
      subscribers.delete(handleUpdate)
      updateGlobalTimer()
    }
  }, [intervalSeconds])

  const manualRefresh = useCallback(() => {
    return refreshGithubStats(true)
  }, [])

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refresh: manualRefresh,
  }
}

export default useGithubStats

