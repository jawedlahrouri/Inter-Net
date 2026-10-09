import { ExternalLink, Scaling, GripVertical } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { RemoveButton } from '@/components/ui/removebutton'
import { EditButton } from '@/components/ui/editbutton'
import { WeatherWidget } from '@/components/dashboard/widgets/WeatherWidget'
import { CustomApiWidget } from '@/components/dashboard/widgets/CustomApiWidget'
import { SteamWidget } from '@/components/dashboard/widgets/SteamWidget'
import { GithubWidget } from '@/components/dashboard/widgets/GithubWidget'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getWidgetSpanClasses } from '@/lib/widgetLayout'
import { cn } from '@/lib/utils'
import type { Widget } from '@/types/widget'

export interface WidgetCardProps {
  widget: Widget
  isEditing?: boolean
  onEdit?: (widget: Widget) => void
  onRemove?: (id: string) => void
  onResize?: (width: number, height: number) => void
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  className?: string
}

/**
 * @brief Renders a dashboard widget card with its type-specific content, drag-and-drop handles and editing controls.
 * @param widget Widget data that determines which type-specific content is rendered and its size.
 * @param isEditing Whether edit mode is on, showing the resize, edit and remove actions.
 * @param onEdit Optional callback receiving the widget when the edit button is clicked.
 * @param onRemove Optional callback receiving the widget id when the remove button is clicked.
 * @param onResize Optional callback receiving the new width and height chosen in the size dropdown.
 * @param isDragging Whether this card is currently being dragged.
 * @param isDragOver Whether another card is being dragged over this card.
 * @param onDragStart Drag start handler.
 * @param onDragOver Drag over handler.
 * @param onDragLeave Drag leave handler.
 * @param onDrop Drop handler.
 * @param onDragEnd Drag end handler.
 * @param className Optional extra CSS classes applied to the card container.
 * @return A grid-spanning container with the widget content and drag-and-drop actions.
 */
export function WidgetCard({
  widget,
  isEditing = false,
  onEdit,
  onRemove,
  onResize,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  className,
}: WidgetCardProps) {
  const currentWidth = widget.width || 1
  const currentHeight = widget.height || 1

  /**
   * @brief Renders the edit-mode action bar with drag handle, size dropdown and the edit/remove buttons.
   * @return The action bar JSX, or null when the card is not in editing mode.
   */
  const renderActions = () => {
    if (!isEditing) return null
    return (
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 px-0.5">
        <div className="flex items-center gap-1">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/60 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing border border-border/60 text-[11px] font-mono select-none"
            title="Glisser-déposer pour réordonner ce widget"
          >
            <GripVertical className="size-3.5 text-primary" />
            <span className="text-[10px]">Déplacer</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] gap-1 px-2 border-border/80 hover:border-primary/50 text-muted-foreground hover:text-foreground cursor-pointer font-mono"
                title="Modifier la taille (largeur × longueur)"
              >
                <Scaling className="size-3 text-primary" />
                <span>
                  {currentWidth === 6 ? 'Full' : `${currentWidth}c`} × {currentHeight}l
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-2 text-xs">
              <div className="px-2 py-1 text-[11px] font-semibold text-foreground flex items-center justify-between border-b border-border/50 mb-1.5 pb-1.5">
                <span>Taille du widget</span>
                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-primary/40 text-primary">
                  {currentWidth} × {currentHeight}
                </Badge>
              </div>

              <div className="px-1 py-1 space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium">Largeur :</span>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 6].map((w) => (
                    <button
                      key={`w-${w}`}
                      type="button"
                      onClick={() => onResize?.(w, currentHeight)}
                      className={`py-1 rounded text-[10px] font-mono border cursor-pointer transition-colors ${
                        currentWidth === w
                          ? 'bg-primary text-primary-foreground border-primary font-bold'
                          : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60'
                      }`}
                    >
                      {w === 6 ? 'Max' : `${w}c`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-1 py-1.5 space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium">Longueur (Hauteur) :</span>
                <div className="grid grid-cols-3 gap-1">
                  {[1, 2, 3].map((h) => (
                    <button
                      key={`h-${h}`}
                      type="button"
                      onClick={() => onResize?.(currentWidth, h)}
                      className={`py-1 rounded text-[10px] font-mono border cursor-pointer transition-colors ${
                        currentHeight === h
                          ? 'bg-primary text-primary-foreground border-primary font-bold'
                          : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60'
                      }`}
                    >
                      {h === 1 ? '1 ligne' : `${h} lignes`}
                    </button>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1.5">
            {onEdit && (
              <EditButton
                onClick={() => onEdit(widget)}
                label="Modifier"
              />
            )}
            {onRemove && (
              <RemoveButton
                onClick={() => onRemove(widget.id)}
                label="Supprimer"
              />
            )}
          </div>
        </div>
      </div>
    )
  }


  /**
   * @brief Renders the widget body matching its type (Steam, GitHub, weather, custom API) or a placeholder card.
   * @return The JSX of the type-specific widget, or a generic placeholder card for other widgets.
   */
  const renderContent = () => {
    if (widget.type === 'steam') {
      return <SteamWidget widget={widget} className="h-full" />
    }

    if (widget.type === 'github') {
      return <GithubWidget widget={widget} className="h-full" />
    }

    if (widget.type === 'weather') {
      return (
        <WeatherWidget
          city={widget.city}
          lat={widget.lat}
          lon={widget.lon}
          className="h-full"
        />
      )
    }

    if (widget.type === 'custom_api' && widget.apiUrl && widget.jsonPath) {
      return (
        <CustomApiWidget
          apiUrl={widget.apiUrl}
          jsonPath={widget.jsonPath}
          displayMode={widget.displayMode}
          unit={widget.unit}
          refreshIntervalSeconds={widget.refreshIntervalSeconds}
          gaugeMin={widget.gaugeMin}
          gaugeMax={widget.gaugeMax}
          title={widget.title}
          className="h-full"
        />
      )
    }

    return (
      <Card className="min-h-[320px] h-full bg-card border-border flex flex-col justify-between">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg text-card-foreground">{widget.title}</CardTitle>
            {widget.url ? (
              <a
                href={widget.url.startsWith('http') ? widget.url : `https://${widget.url}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-foreground/80 hover:text-foreground hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
              >
                <span className="truncate">{widget.url}</span>
                <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
              </a>
            ) : (
              <CardDescription className="text-xs text-muted-foreground">Widget #{widget.id}</CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-t border-dashed border-border/60 m-4 rounded-lg bg-muted/20">
          Contenu du widget
        </CardContent>
      </Card>
    )
  }

  return (
    <div
      draggable={isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'relative group flex flex-col justify-between transition-all select-none',
        getWidgetSpanClasses(widget.width, widget.height),
        isEditing ? 'ring-1 ring-border/50 hover:ring-primary/40 rounded-xl p-1 bg-card/10 cursor-grab active:cursor-grabbing' : '',
        isDragging ? 'opacity-35 scale-[0.98] ring-2 ring-primary ring-dashed' : '',
        isDragOver ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.01] shadow-lg shadow-primary/20' : '',
        className
      )}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        {renderContent()}
      </div>
      {renderActions()}
    </div>
  )
}

export default WidgetCard
