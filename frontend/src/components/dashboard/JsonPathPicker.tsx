import * as React from 'react'
import { useState, useMemo } from 'react'
import { Search, Zap, RefreshCw, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  discoverJsonPaths,
  findBestDefaultPath,
  type DiscoveredPath,
} from '@/lib/jsonPath'

export interface JsonPathPickerProps {
  apiUrl: string
  selectedPath: string
  onSelectPath: (path: string, previewValue: any, suggestedMode?: 'kpi' | 'gauge') => void
  className?: string
}

async function fetchApiResponse(apiUrl: string): Promise<any> {
  let response: Response
  try {
    response = await fetch(apiUrl, { headers: { Accept: 'application/json' } })
  } catch {
    const proxyUrl = `/api/v1/proxy?url=${encodeURIComponent(apiUrl)}`
    response = await fetch(proxyUrl, { headers: { Accept: 'application/json' } })
  }

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText || 'Impossible de joindre l\'API'}`)
  }

  return response.json()
}

export function JsonPathPicker({
  apiUrl,
  selectedPath,
  onSelectPath,
  className,
}: JsonPathPickerProps) {
  const [paths, setPaths] = useState<DiscoveredPath[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleInspect = async () => {
    if (!apiUrl.trim()) return
    setLoading(true)
    setError(null)

    try {
      const json = await fetchApiResponse(apiUrl.trim())
      const discovered = discoverJsonPaths(json)
      setPaths(discovered)

      if (discovered.length === 0) {
        setError('Aucune valeur exploitable trouvée dans la réponse JSON.')
        return
      }

      if (!selectedPath) {
        const best = findBestDefaultPath(discovered)
        if (best) {
          onSelectPath(best.path, best.value, best.suggestedMode)
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la récupération des données de l\'API.')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoSelect = () => {
    const best = findBestDefaultPath(paths)
    if (best) {
      onSelectPath(best.path, best.value, best.suggestedMode)
    }
  }

  const filteredPaths = useMemo(() => {
    if (!searchQuery.trim()) return paths
    const q = searchQuery.toLowerCase()
    return paths.filter(
      (p) => p.path.toLowerCase().includes(q) || String(p.value).toLowerCase().includes(q)
    )
  }, [paths, searchQuery])

  return (
    <div className={cn('space-y-2 text-xs', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">
          Champs détectés {paths.length > 0 && `(${paths.length})`}
        </span>
        <div className="flex items-center gap-1.5">
          {paths.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoSelect}
              className="h-7 text-[11px] gap-1 px-2 cursor-pointer"
            >
              <Zap className="size-3 text-amber-500" />
              Sélection auto
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleInspect}
            disabled={!apiUrl.trim() || loading}
            className="h-7 text-[11px] gap-1 px-2 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <RefreshCw className="size-3" />
            )}
            Analyser l'API
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 p-2 rounded-md bg-destructive/10 text-destructive text-[11px]">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {paths.length > 0 && (
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filtrer les champs (ex: count, rate, items)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-7 text-xs"
            />
          </div>

          <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-muted/20 divide-y divide-border/40">
            {filteredPaths.length === 0 ? (
              <div className="p-3 text-center text-muted-foreground text-[11px]">
                Aucun champ ne correspond à votre recherche.
              </div>
            ) : (
              filteredPaths.map((item) => {
                const isSelected = selectedPath === item.path
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => onSelectPath(item.path, item.value, item.suggestedMode)}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 flex items-center justify-between gap-2 transition-colors cursor-pointer hover:bg-muted/60',
                      isSelected && 'bg-primary/10 font-medium'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn(
                        'size-3.5 rounded-full flex items-center justify-center border shrink-0',
                        isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                      )}>
                        {isSelected && <Check className="size-2.5" />}
                      </div>
                      <span className="font-mono text-[11px] truncate text-foreground" title={item.path}>
                        {item.path}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 uppercase">
                        {item.type}
                      </Badge>
                      <span className="font-mono text-[11px] text-muted-foreground max-w-[100px] truncate text-right">
                        {String(item.value)}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

