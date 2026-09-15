import * as React from 'react'
import { AddButton } from '@/components/ui/addbutton'
import { WidgetCard } from '@/components/dashboard/WidgetCard'
import { AddWidgetDialog } from '@/components/dashboard/AddWidgetDialog'
import { EditWidgetDialog } from '@/components/dashboard/EditWidgetDialog'
import type { Widget, NewWidgetData } from '@/types/widget'

export interface WidgetGridProps {
  widgets: Widget[]
  isEditing: boolean
  onAddWidget: (data: NewWidgetData) => void
  onUpdateWidget?: (id: string, data: Partial<Widget>) => void
  onRemoveWidget: (id: string) => void
}

export function WidgetGrid({
  widgets,
  isEditing,
  onAddWidget,
  onUpdateWidget,
  onRemoveWidget,
}: WidgetGridProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingWidget, setEditingWidget] = React.useState<Widget | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            isEditing={isEditing}
            onEdit={(w) => setEditingWidget(w)}
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

      <EditWidgetDialog
        open={!!editingWidget}
        onOpenChange={(open) => !open && setEditingWidget(null)}
        widget={editingWidget}
        onUpdateWidget={(id, data) => {
          if (onUpdateWidget) onUpdateWidget(id, data)
        }}
      />
    </>
  )
}

export default WidgetGrid

