import { ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { RemoveButton } from '@/components/ui/removebutton'
import { WeatherWidget } from '@/components/dashboard/widgets/WeatherWidget'
import { CustomApiWidget } from '@/components/dashboard/widgets/CustomApiWidget'
import type { Widget } from '@/types/widget'

export interface WidgetCardProps {
  widget: Widget
  isEditing?: boolean
  onRemove?: (id: string) => void
}

export function WidgetCard({ widget, isEditing = false, onRemove }: WidgetCardProps) {
  // If Weather Widget
  if (widget.type === 'weather') {
    return (
      <div className="relative group h-full">
        {isEditing && onRemove && (
          <RemoveButton
            onClick={() => onRemove(widget.id)}
            className="absolute top-2 right-2 z-30"
          />
        )}
        <WeatherWidget
          city={widget.city}
          lat={widget.lat}
          lon={widget.lon}
          className="h-full"
        />
      </div>
    )
  }

  // If Custom API Widget
  if (widget.type === 'custom_api' && widget.apiUrl && widget.jsonPath) {
    return (
      <div className="relative group h-full">
        {isEditing && onRemove && (
          <RemoveButton
            onClick={() => onRemove(widget.id)}
            className="absolute top-2 right-2 z-30"
          />
        )}
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
      </div>
    )
  }

  // Default / Shortcut Widget
  return (
    <div className="relative group h-full">
      {isEditing && onRemove && (
        <RemoveButton
          onClick={() => onRemove(widget.id)}
          className="absolute top-2 right-2 z-30"
        />
      )}
      <Card className="min-h-[320px] h-full bg-card border-border flex flex-col justify-between">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg text-card-foreground">{widget.title}</CardTitle>
            {widget.url ? (
              <a
                href={widget.url.startsWith('http') ? widget.url : `https://${widget.url}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
              >
                <span className="truncate">{widget.url}</span>
                <ExternalLink className="size-3 shrink-0" />
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
    </div>
  )
}

export default WidgetCard
