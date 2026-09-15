import * as React from 'react'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Activity,
  Clock,
  RefreshCw,
  Code2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { extractJsonValue } from '@/lib/jsonPath'
import {
  WidgetLoadingView,
  WidgetErrorView,
  WidgetNotFoundView,
  WidgetKpiView,
  WidgetGaugeView,
} from './CustomApiWidgetViews'

export interface CustomApiWidgetProps {
  apiUrl: string
  jsonPath: string
  displayMode?: 'kpi' | 'gauge'
  unit?: string
  refreshIntervalSeconds?: number
  gaugeMin?: number
  gaugeMax?: number
  title?: string
  className?: string
}

function getHostname(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    return parsed.hostname
  } catch {
    return url
  }
}

export function CustomApiWidget({
  apiUrl,
  jsonPath,
  displayMode = 'kpi',
  unit,
  refreshIntervalSeconds,
  gaugeMin = 0,
  gaugeMax = 100,
  title,
  className,
}: CustomApiWidgetProps) {
  const [data, setData] = useState<any>(undefined)
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(
    async (opts?: { background?: boolean }) => {
      if (!apiUrl || !apiUrl.trim()) {
        setLoading(false)
        setData(undefined)
        setError(null)
        return
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      const controller = new AbortController()
      abortControllerRef.current = controller

      if (opts?.background) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        let response: Response
        try {
          response = await fetch(apiUrl, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          })
        } catch (directErr: any) {
          if (directErr.name === 'AbortError') return
          // Fallback via backend proxy to bypass browser CORS restrictions
          const proxyUrl = `/api/v1/proxy?url=${encodeURIComponent(apiUrl)}`
          response = await fetch(proxyUrl, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          })
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText || 'Requête échouée'}`)
        }

        const json = await response.json()
        setData(json)
        setLastUpdated(new Date())
        setError(null)
      } catch (err: any) {
        if (err.name === 'AbortError') return
        const message =
          err instanceof TypeError && err.message.includes('fetch')
            ? "Impossible de joindre l'API (Erreur réseau ou blocage CORS)"
            : err instanceof Error
              ? err.message
              : "Erreur inconnue lors de l'appel API"
        setError(message)
      } finally {
        setLoading(false)
        setIsRefreshing(false)
      }
    },
    [apiUrl]
  )

  useEffect(() => {
    fetchData({ background: false })

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  useEffect(() => {
    if (!apiUrl || !refreshIntervalSeconds || refreshIntervalSeconds <= 0) {
      return
    }

    const intervalId = setInterval(() => {
      fetchData({ background: true })
    }, refreshIntervalSeconds * 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [apiUrl, refreshIntervalSeconds, fetchData])

  const { value, found } = useMemo(() => {
    if (data === undefined) {
      return { value: undefined, found: false }
    }
    return extractJsonValue(data, jsonPath)
  }, [data, jsonPath])

  const availableKeys = useMemo(() => {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return Object.keys(data)
    }
    return []
  }, [data])

  return (
    <Card
      className={cn(
        'min-h-[320px] bg-card border-border flex flex-col justify-between shadow-xs',
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-0.5 min-w-0">
          <CardTitle className="text-base font-semibold flex items-center gap-1.5 text-card-foreground truncate">
            <Activity className="size-4 text-cyan-500 shrink-0" />
            <span className="truncate">{title || 'API Metric'}</span>
          </CardTitle>
          {apiUrl ? (
            <CardDescription className="text-xs text-muted-foreground truncate" title={apiUrl}>
              {getHostname(apiUrl)}
            </CardDescription>
          ) : (
            <CardDescription className="text-xs text-muted-foreground">
              JSON API Widget
            </CardDescription>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => fetchData({ background: true })}
          disabled={loading || isRefreshing}
          aria-label="Refresh metric"
          className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
        >
          <RefreshCw className={cn('size-3.5', (loading || isRefreshing) && 'animate-spin')} />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-1">
        {!apiUrl ? (
          <div className="flex flex-col items-center justify-center my-auto py-8 text-center gap-2 text-muted-foreground">
            <Code2 className="size-6 opacity-60" />
            <span className="text-xs">Aucune URL d'API configurée</span>
          </div>
        ) : loading && data === undefined ? (
          <WidgetLoadingView />
        ) : error && data === undefined ? (
          <WidgetErrorView error={error} onRetry={() => fetchData({ background: false })} />
        ) : !found ? (
          <WidgetNotFoundView
            jsonPath={jsonPath}
            availableKeys={availableKeys}
            onRetry={() => fetchData({ background: true })}
          />
        ) : displayMode === 'gauge' ? (
          <WidgetGaugeView
            value={value}
            unit={unit}
            gaugeMin={gaugeMin}
            gaugeMax={gaugeMax}
          />
        ) : (
          <WidgetKpiView value={value} unit={unit} jsonPath={jsonPath} />
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2 mt-auto">
          <span className="flex items-center gap-1 truncate">
            <Clock className="size-3 shrink-0" />
            {lastUpdated
              ? `Mis à jour : ${lastUpdated.toLocaleTimeString()}`
              : 'En attente de données'}
          </span>
          {refreshIntervalSeconds && refreshIntervalSeconds > 0 ? (
            <span className="text-[10px] font-mono opacity-80">
              auto: {refreshIntervalSeconds}s
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export default CustomApiWidget
