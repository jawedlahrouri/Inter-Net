import { useState } from 'react'
import {
  WIDGET_WIDTH_OPTIONS,
  WIDGET_HEIGHT_OPTIONS,
  WIDGET_SIZE_PRESETS,
  type SizePreset,
} from '@/lib/widgetLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Maximize2, MoveHorizontal, MoveVertical, Sparkles } from 'lucide-react'

export interface WidgetDimensionSelectorProps {
  width: number
  height: number
  onChange: (width: number, height: number) => void
  showPresets?: boolean
  showPreview?: boolean
}

/**
 * @brief Renders the controls used to pick a widget width and height, with presets and a hoverable grid preview.
 * @param width Current widget width in grid columns.
 * @param height Current widget height in grid rows.
 * @param onChange Callback receiving the new width and height when the user picks a size.
 * @param showPresets Whether to show the recommended size preset buttons (defaults to true).
 * @param showPreview Whether to show the interactive grid preview (defaults to true).
 * @return A panel with the size badge, preset buttons, width and height option buttons and an interactive 6x3 grid preview.
 */
export function WidgetDimensionSelector({
  width,
  height,
  onChange,
  showPresets = true,
  showPreview = true,
}: WidgetDimensionSelectorProps) {
  const [hoveredCell, setHoveredCell] = useState<{ col: number; row: number } | null>(null)

  const activeWidth = hoveredCell ? hoveredCell.col : width
  const activeHeight = hoveredCell ? hoveredCell.row : height

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Maximize2 className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Dimensions du widget</span>
        </div>
        <Badge variant="outline" className="text-xs font-mono font-bold px-2 py-0.5 border-primary/40 bg-primary/10 text-primary">
          {width} col{width > 1 ? 's' : ''} × {height} ligne{height > 1 ? 's' : ''}
        </Badge>
      </div>

      {showPresets && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Sparkles className="size-3 text-primary" />
            Formats recommandés :
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {WIDGET_SIZE_PRESETS.map((preset: SizePreset) => {
              const isSelected = width === preset.width && height === preset.height
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onChange(preset.width, preset.height)}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-all text-xs cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs ring-1 ring-primary/40'
                      : 'border-border/80 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="truncate">{preset.name}</span>
                  <span className="text-[10px] font-mono opacity-70">
                    {preset.width === 6 ? 'Full' : `${preset.width}x${preset.height}`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div className="space-y-2 p-3 rounded-xl border border-border/70 bg-card/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <MoveHorizontal className="size-3.5 text-sky-500" />
              Largeur
            </span>
            <span className="text-[10px] text-muted-foreground">Colonnes</span>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {WIDGET_WIDTH_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={width === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange(opt.value, height)}
                className={`h-8 text-xs font-mono cursor-pointer px-1 ${
                  width === opt.value ? 'font-bold' : 'text-muted-foreground'
                }`}
                title={opt.description}
              >
                {opt.shortLabel}
              </Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            {WIDGET_WIDTH_OPTIONS.find((o) => o.value === width)?.description || ''}
          </p>
        </div>

        <div className="space-y-2 p-3 rounded-xl border border-border/70 bg-card/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <MoveVertical className="size-3.5 text-emerald-500" />
              Longueur (Hauteur)
            </span>
            <span className="text-[10px] text-muted-foreground">Lignes</span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {WIDGET_HEIGHT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={height === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange(width, opt.value)}
                className={`h-8 text-xs font-mono cursor-pointer px-1 ${
                  height === opt.value ? 'font-bold' : 'text-muted-foreground'
                }`}
                title={opt.description}
              >
                {opt.shortLabel}
              </Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            {WIDGET_HEIGHT_OPTIONS.find((o) => o.value === height)?.description || ''}
          </p>
        </div>
      </div>

      {showPreview && (
        <div className="space-y-1.5 p-3 rounded-xl border border-border/60 bg-muted/20">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Aperçu de l'emprise sur la grille :</span>
            <span className="font-mono text-[10px]">
              {activeWidth} × {activeHeight}
            </span>
          </div>

          <div
            className="grid grid-cols-6 gap-1.5 p-2 rounded-lg bg-background/80 border border-border/50 select-none"
            onMouseLeave={() => setHoveredCell(null)}
          >
            {[1, 2, 3].map((r) => (
              <div key={`row-${r}`} className="contents">
                {[1, 2, 3, 4, 5, 6].map((c) => {
                  const isInBlock = c <= activeWidth && r <= activeHeight
                  return (
                    <div
                      key={`cell-${c}-${r}`}
                      onClick={() => onChange(c, r)}
                      onMouseEnter={() => setHoveredCell({ col: c, row: r })}
                      className={`h-6 rounded-md border transition-all cursor-pointer flex items-center justify-center text-[9px] font-mono font-semibold ${
                        isInBlock
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-muted/40 border-border/60 text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {c === 1 && r === 1 ? '1×1' : ''}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default WidgetDimensionSelector
