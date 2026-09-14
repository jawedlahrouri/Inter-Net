import * as React from 'react'
import { AddButton } from '@/components/ui/addbutton'
import { WidgetCard } from '@/components/dashboard/WidgetCard'
import { AddWidgetDialog } from '@/components/dashboard/AddWidgetDialog'
import type { Widget, NewWidgetData } from '@/types/widget'

export interface WidgetGridProps {
  widgets: Widget[]
  isEditing: boolean
  onAddWidget: (data: NewWidgetData) => void
  onRemoveWidget: (id: string) => void
}

export function WidgetGrid({
  widgets,
  isEditing,
  onAddWidget,
  onRemoveWidget,
}: WidgetGridProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            isEditing={isEditing}
            onRemove={onRemoveWidget}
          />
        ))}

        {isEditing && (
          <AddButton onClick={() => setIsDialogOpen(true)} />
        )}
      </div>

      <AddWidgetDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddWidget={onAddWidget}
      />
    </>
  )
}

export default WidgetGrid
