import { useState, useEffect, useCallback } from 'react'
import { fetchGithubRepoStats, type GithubRepoDetailedStats } from '@/services/api'

const repoCache = new Map<string, { data: GithubRepoDetailedStats; timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * @brief Loads detailed statistics for a GitHub repository with an in-memory cache, periodic refresh and manual refresh.
 * @param repoFullName Repository name in owner/repo format, or undefined to skip loading with an error.
 * @param refreshIntervalSeconds Auto-refresh period in seconds, with a minimum of 300 (default 300).
 * @return An object with the stats, loading flag, error message, last update date and a refresh function that forces a reload.
 */
export function useGithubRepoStats(repoFullName?: string, refreshIntervalSeconds: number = 300) {
  const [stats, setStats] = useState<GithubRepoDetailedStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = useCallback(async (force: boolean = false) => {
    if (!repoFullName || !repoFullName.includes('/')) {
      setLoading(false)
      setError('Format de dépôt invalide (attendu: propriétaire/dépôt).')
      return
    }

    const [owner, repo] = repoFullName.split('/')
    const cacheKey = repoFullName.toLowerCase()
    const cached = repoCache.get(cacheKey)

    if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setStats(cached.data)
      setLastUpdated(new Date(cached.timestamp))
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    try {
      const data = await fetchGithubRepoStats(owner, repo, force)
      repoCache.set(cacheKey, { data, timestamp: Date.now() })
      setStats(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err: any) {
      setError(err?.message || `Impossible de charger les données du dépôt ${repoFullName}`)
    } finally {
      setLoading(false)
    }
  }, [repoFullName])

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

