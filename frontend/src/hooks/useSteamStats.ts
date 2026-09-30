import { useState, useEffect, useCallback } from 'react'
import { fetchSteamUserStats, type SteamUserStats } from '@/services/api'

export const MIN_STEAM_INTERVAL_SECONDS = 300

let cachedStats: SteamUserStats | null = null
let cachedError: string | null = null
let isFetching = false
let lastFetchTime: Date | null = null
const subscribers = new Set<(stats: SteamUserStats | null, error: string | null, loading: boolean) => void>()

let globalIntervalId: ReturnType<typeof setInterval> | null = null
let activeMinInterval = MIN_STEAM_INTERVAL_SECONDS

/**
 * @brief Calls every subscribed callback with the cached Steam stats, cached error and the given loading flag.
 * @param loading Whether a Steam stats fetch is currently in progress.
 */
function notifySubscribers(loading: boolean) {
  subscribers.forEach((cb) => cb(cachedStats, cachedError, loading))
}

/**
 * @brief Fetches Steam user stats once at a time, updates the shared cache and notifies subscribers.
 * @param forceRefresh When true, asks the backend to bypass its cache.
 * @return A promise resolving to the fetched stats, the cached stats if already fetching, or null on error.
 */
export async function refreshSteamStats(forceRefresh: boolean = false): Promise<SteamUserStats | null> {
  if (isFetching) return cachedStats
  isFetching = true
  notifySubscribers(true)

  try {
    const data = await fetchSteamUserStats(forceRefresh)
    cachedStats = data
    cachedError = null
    lastFetchTime = new Date()
    return data
  } catch (err: any) {
    cachedError = err?.message || 'Impossible de récupérer les statistiques Steam.'
    return null
  } finally {
    isFetching = false
    notifySubscribers(false)
  }
}

/**
 * @brief Resets the shared polling interval and restarts it only if there are subscribers, using the enforced minimum interval.
 */
function updateGlobalTimer() {
  if (globalIntervalId) {
    clearInterval(globalIntervalId)
    globalIntervalId = null
  }

  if (subscribers.size > 0) {
    const effectiveInterval = Math.max(MIN_STEAM_INTERVAL_SECONDS, activeMinInterval)
    globalIntervalId = setInterval(() => {
      refreshSteamStats(false)
    }, effectiveInterval * 1000)
  }
}

/**
 * @brief Provides shared, cached Steam stats with loading and error state and automatic periodic refresh.
 * @param intervalSeconds Desired refresh interval in seconds, raised to the minimum of 300 seconds if lower.
 * @return An object with stats, loading, error, lastUpdated and a refresh function forcing a reload.
 */
export function useSteamStats(intervalSeconds: number = MIN_STEAM_INTERVAL_SECONDS) {
  const [stats, setStats] = useState<SteamUserStats | null>(cachedStats)
  const [error, setError] = useState<string | null>(cachedError)
  const [loading, setLoading] = useState<boolean>(isFetching)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(lastFetchTime)

  useEffect(() => {
    /**
     * @brief Subscriber callback that copies the shared Steam stats, error, loading state and last fetch time into local state.
     * @param newStats The latest Steam stats or null.
     * @param newError The latest error message or null.
     * @param isLoading Whether a fetch is in progress.
     */
    const handleUpdate = (
      newStats: SteamUserStats | null,
      newError: string | null,
      isLoading: boolean
    ) => {
      setStats(newStats)
      setError(newError)
      setLoading(isLoading)
      setLastUpdated(lastFetchTime)
    }

    subscribers.add(handleUpdate)

    const validatedInterval = Math.max(MIN_STEAM_INTERVAL_SECONDS, intervalSeconds)
    if (validatedInterval < activeMinInterval) {
      activeMinInterval = validatedInterval
    }
    updateGlobalTimer()

    const now = Date.now()
    if (!cachedStats || !lastFetchTime || now - lastFetchTime.getTime() > MIN_STEAM_INTERVAL_SECONDS * 1000) {
      refreshSteamStats(false)
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
    return refreshSteamStats(true)
  }, [])

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refresh: manualRefresh,
  }
}

export default useSteamStats
