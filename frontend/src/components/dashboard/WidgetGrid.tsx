import * as React from 'react'
import { AddButton } from '@/components/ui/addbutton'
import { WidgetCard } from '@/components/dashboard/WidgetCard'
import { AddWidgetDialog } from '@/components/dashboard/AddWidgetDialog'
import { EditWidgetDialog } from '@/components/dashboard/EditWidgetDialog'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid } from 'lucide-react'
import type { Widget, NewWidgetData } from '@/types/widget'

export interface WidgetGridProps {
  widgets: Widget[]
  isEditing: boolean
  onAddWidget: (data: NewWidgetData) => void
  onUpdateWidget?: (id: string, data: Partial<Widget>) => void
  onRemoveWidget: (id: string) => void
  onOpenAddDialog?: () => void
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

  // Empty State Actionnable si aucun widget
  if (widgets.length === 0) {
    return (
      <>
        <div className="w-full min-h-[380px] rounded-xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="size-12 rounded-lg bg-muted/60 border border-border/80 flex items-center justify-center text-foreground">
            <LayoutGrid className="size-6 text-muted-foreground" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Aucun widget configuré
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Votre tableau de bord est actuellement vide. Composez votre espace modulaire en ajoutant des prévisions météo, des indicateurs d'API JSON ou des raccourcis.
            </p>
          </div>

          <Button
            variant="default"
            size="default"
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 cursor-pointer h-10 px-5 text-xs font-medium mt-2"
          >
            <Plus className="size-4" />
            <span>Ajouter mon premier widget</span>
          </Button>
        </div>

        <AddWidgetDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onAddWidget={onAddWidget}
        />
      </>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 w-full">
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

