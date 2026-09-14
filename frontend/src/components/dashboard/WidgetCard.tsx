import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { RemoveButton } from '@/components/ui/removebutton'
import type { Widget } from '@/types/widget'

export interface WidgetCardProps {
  widget: Widget
  isEditing?: boolean
  onRemove?: (id: string) => void
}

export function WidgetCard({ widget, isEditing = false, onRemove }: WidgetCardProps) {
  return (
    <Card className="min-h-[320px] bg-card border-border flex flex-col justify-between">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg text-card-foreground">{widget.title}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Widget #{widget.id}</CardDescription>
        </div>
        {isEditing && onRemove && (
          <RemoveButton onClick={() => onRemove(widget.id)} />
        )}
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-t border-dashed border-border/60 m-4 rounded-lg bg-muted/20">
        Contenu du widget
      </CardContent>
    </Card>
  )
}

export default WidgetCard

