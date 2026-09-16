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
  onToggleEdit?: () => void
}

export function WidgetGrid({
  widgets,
  isEditing,
  onAddWidget,
  onUpdateWidget,
  onRemoveWidget,
  onToggleEdit,
}: WidgetGridProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingWidget, setEditingWidget] = React.useState<Widget | null>(null)

  return (
    <>
      {/* Si aucun widget et PAS en mode édition : état vide discret */}
      {widgets.length === 0 && !isEditing ? (
        <div className="w-full min-h-[260px] rounded-2xl border border-dashed border-border/70 bg-card/30 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="size-10 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-center text-muted-foreground">
            <LayoutGrid className="size-5" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Cette page est vide
            </h3>
            <p className="text-xs text-muted-foreground">
              Activez le mode édition pour ajouter et organiser vos widgets sur ce tableau de bord.
            </p>
          </div>
          {onToggleEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleEdit}
              className="gap-1.5 text-xs h-8 px-3 mt-1 cursor-pointer font-medium"
            >
              <Plus className="size-3.5" />
              <span>Éditer les widgets</span>
            </Button>
          )}
        </div>
      ) : widgets.length === 0 && isEditing ? (
        /* Si aucun widget et EN mode édition : invitation claire à ajouter un premier widget */
        <div className="w-full min-h-[280px] rounded-2xl border-2 border-dashed border-primary/40 bg-card/40 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Plus className="size-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Mode édition activé
            </h3>
            <p className="text-xs text-muted-foreground">
              Cette page ne contient encore aucun widget. Ajoutez-y vos métriques ou flux favoris.
            </p>
          </div>
          <Button
            size="default"
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 text-xs font-semibold cursor-pointer shadow-sm px-5"
          >
            <Plus className="size-4" />
            <span>Ajouter votre premier widget</span>
          </Button>
        </div>
      ) : (
        /* Grille des widgets avec le bouton d'ajout visible uniquement en mode édition */
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
      )}

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
