import { useState, useEffect, useCallback } from 'react'
import { fetchGithubOrgStats, type GithubOrgDetailedStats } from '@/services/api'

const orgCache = new Map<string, { data: GithubOrgDetailedStats; timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * @brief Loads and periodically refreshes detailed GitHub organization statistics using a five-minute client cache.
 * @param orgName The GitHub organization name to load statistics for.
 * @param refreshIntervalSeconds The polling interval in seconds, with a minimum of 300.
 * @return An object with stats, loading, error, lastUpdated and a refresh function that forces a reload.
 */
export function useGithubOrgStats(orgName?: string, refreshIntervalSeconds: number = 300) {
  const [stats, setStats] = useState<GithubOrgDetailedStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = useCallback(async (force: boolean = false) => {
    if (!orgName || !orgName.trim()) {
      setLoading(false)
      setError('Nom d’organisation manquant.')
      return
    }

    const cleanOrg = orgName.trim()
    const cacheKey = cleanOrg.toLowerCase()
    const cached = orgCache.get(cacheKey)

    if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setStats(cached.data)
      setLastUpdated(new Date(cached.timestamp))
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    try {
      const data = await fetchGithubOrgStats(cleanOrg, force)
      orgCache.set(cacheKey, { data, timestamp: Date.now() })
      setStats(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err: any) {
      setError(err?.message || `Impossible de charger l'organisation ${cleanOrg}`)
    } finally {
      setLoading(false)
    }
  }, [orgName])

  useEffect(() => {
    loadData()
    const interval = Math.max(300, refreshIntervalSeconds) * 1000
    const timer = setInterval(() => loadData(false), interval)
    return () => clearInterval(timer)
  }, [loadData, refreshIntervalSeconds])

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refresh: () => loadData(true),
  }
}

