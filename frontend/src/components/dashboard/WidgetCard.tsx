import { ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { RemoveButton } from '@/components/ui/removebutton'
import { EditButton } from '@/components/ui/editbutton'
import { WeatherWidget } from '@/components/dashboard/widgets/WeatherWidget'
import { CustomApiWidget } from '@/components/dashboard/widgets/CustomApiWidget'
import { SteamWidget } from '@/components/dashboard/widgets/SteamWidget'
import { GithubWidget } from '@/components/dashboard/widgets/GithubWidget'
import type { Widget } from '@/types/widget'

export interface WidgetCardProps {
  widget: Widget
  isEditing?: boolean
  onEdit?: (widget: Widget) => void
  onRemove?: (id: string) => void
}

export function WidgetCard({ widget, isEditing = false, onEdit, onRemove }: WidgetCardProps) {
  const renderActions = () => {
    if (!isEditing) return null
    return (
      <div className="mt-2.5 flex items-center justify-end gap-2 px-0.5">
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
    )
  }

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

    // Default / Shortcut Widget
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
    <div className={`relative group h-full flex flex-col justify-between ${isEditing ? 'transition-all' : ''}`}>
      <div className="flex-1 min-h-0 flex flex-col">
        {renderContent()}
      </div>
      {renderActions()}
    </div>
  )
}

export default WidgetCard
