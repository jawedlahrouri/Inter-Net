import {
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RadialGauge } from '@/components/ui/radial-gauge'

function formatDisplayValue(value: any): string {
  if (value === null) return 'null'
  if (value === undefined) return 'N/A'
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 4 })
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '[Objet]'
    }
  }
  return String(value)
}

export function WidgetLoadingView() {
  return (
    <div className="flex flex-col items-center justify-center my-auto py-8 text-center gap-2.5">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-xs text-muted-foreground">Récupération des données API...</p>
    </div>
  )
}

export function WidgetErrorView({
  error,
  onRetry,
}: {
  error: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center my-auto py-6 text-center gap-3">
      <div className="p-2.5 rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-5" />
      </div>
      <div className="space-y-1 max-w-[260px]">
        <p className="text-xs font-semibold text-foreground">Erreur de connexion API</p>
        <p className="text-[11px] text-muted-foreground line-clamp-2" title={error}>
          {error}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="gap-1.5 text-xs h-7 cursor-pointer"
      >
        <RefreshCw className="size-3" />
        Réessayer
      </Button>
    </div>
  )
}

export function WidgetNotFoundView({
  jsonPath,
  availableKeys,
  onRetry,
}: {
  jsonPath: string
  availableKeys: string[]
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center my-auto py-6 text-center gap-2.5">
      <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-500">
        <AlertTriangle className="size-5" />
      </div>
      <div className="space-y-1 max-w-[280px]">
        <p className="text-xs font-semibold text-foreground">Chemin introuvable</p>
        <p className="text-[11px] text-muted-foreground">
          La clé <code className="px-1 py-0.5 rounded bg-muted font-mono text-foreground">{jsonPath}</code> est absente de la réponse.
        </p>
        {availableKeys.length > 0 && (
          <p className="text-[10px] text-muted-foreground/80 font-mono truncate">
            Clés : {availableKeys.slice(0, 4).join(', ')}{availableKeys.length > 4 ? '...' : ''}
          </p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="gap-1.5 text-xs h-7 cursor-pointer mt-1"
      >
        <RefreshCw className="size-3" />
        Actualiser
      </Button>
    </div>
  )
}

export function WidgetKpiView({
  value,
  unit,
  jsonPath,
}: {
  value: any
  unit?: string
  jsonPath: string
}) {
  return (
    <div className="flex flex-col justify-center my-auto py-4">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-4xl sm:text-5xl font-bold tracking-tight text-card-foreground tabular-nums">
          {formatDisplayValue(value)}
        </span>
        {unit && (
          <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
            {unit}
          </Badge>
        )}
      </div>
      <div className="mt-2 text-xs font-mono text-muted-foreground truncate">
        <span className="text-muted-foreground/60">path: </span>
        <span className="text-foreground/80">{jsonPath}</span>
      </div>
    </div>
  )
}

export function WidgetGaugeView({
  value,
  unit,
  gaugeMin = 0,
  gaugeMax = 100,
}: {
  value: any
  unit?: string
  gaugeMin?: number
  gaugeMax?: number
}) {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value))
  const isNumeric = typeof numericValue === 'number' && !Number.isNaN(numericValue)

  if (!isNumeric) {
    return (
      <div className="flex flex-col items-center justify-center my-auto py-4 text-center">
        <span className="text-2xl font-bold text-foreground tabular-nums">
          {formatDisplayValue(value)}
        </span>
        {unit && <Badge variant="secondary" className="mt-2">{unit}</Badge>}
        <span className="text-[11px] text-amber-500/90 mt-2 flex items-center gap-1">
          <AlertTriangle className="size-3" /> Valeur non numérique pour la jauge
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center my-auto py-1">
      <RadialGauge
        value={numericValue}
        min={gaugeMin}
        max={gaugeMax}
        size={150}
        thickness={12}
        className="mx-auto"
      >
        <div className="flex flex-col items-center justify-center -mb-1">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatDisplayValue(numericValue)}
          </span>
          {unit && (
            <span className="text-[11px] font-semibold text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
      </RadialGauge>
      <div className="flex justify-between items-center w-full max-w-[170px] text-[10px] text-muted-foreground font-mono mt-1">
        <span>Min: {gaugeMin}{unit ? ` ${unit}` : ''}</span>
        <span>Max: {gaugeMax}{unit ? ` ${unit}` : ''}</span>
      </div>
    </div>
  )
}
