import { useState, useEffect, useCallback } from 'react'
import { fetchSteamUserStats, type SteamUserStats } from '@/services/api'

// Limite stricte de rafraîchissement à 5 minutes (300s) pour préserver les quotas Steam multi-comptes
export const MIN_STEAM_INTERVAL_SECONDS = 300 // 5 minutes

// Cache partagé et gestion des abonnés entre tous les widgets Steam du dashboard
let cachedStats: SteamUserStats | null = null
let cachedError: string | null = null
let isFetching = false
let lastFetchTime: Date | null = null
const subscribers = new Set<(stats: SteamUserStats | null, error: string | null, loading: boolean) => void>()

let globalIntervalId: ReturnType<typeof setInterval> | null = null
let activeMinInterval = MIN_STEAM_INTERVAL_SECONDS

function notifySubscribers(loading: boolean) {
  subscribers.forEach((cb) => cb(cachedStats, cachedError, loading))
}

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

function updateGlobalTimer() {
  if (globalIntervalId) {
    clearInterval(globalIntervalId)
    globalIntervalId = null
  }

  if (subscribers.size > 0) {
    // Toujours au minimum 5 minutes (300 secondes) pour préserver les quotas de l'API Steam
    const effectiveInterval = Math.max(MIN_STEAM_INTERVAL_SECONDS, activeMinInterval)
    globalIntervalId = setInterval(() => {
      refreshSteamStats(false)
    }, effectiveInterval * 1000)
  }
}

export function useSteamStats(intervalSeconds: number = MIN_STEAM_INTERVAL_SECONDS) {
  const [stats, setStats] = useState<SteamUserStats | null>(cachedStats)
  const [error, setError] = useState<string | null>(cachedError)
  const [loading, setLoading] = useState<boolean>(isFetching)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(lastFetchTime)

  useEffect(() => {
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

    // Toujours au minimum 5 minutes
    const validatedInterval = Math.max(MIN_STEAM_INTERVAL_SECONDS, intervalSeconds)
    if (validatedInterval < activeMinInterval) {
      activeMinInterval = validatedInterval
    }
    updateGlobalTimer()

    // Ne fetch au montage que si pas de données ou si les données ont plus de 5 minutes
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
