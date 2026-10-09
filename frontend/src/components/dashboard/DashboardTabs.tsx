import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import type { Widget } from '@/types/widget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Pencil, Trash2, Layout, Palette } from 'lucide-react';
import { CustomizePageDialog } from '@/components/dashboard/CustomizePageDialog';
import type { DashboardPageInfo } from '@/services/api';

interface DashboardTabsProps {
  widgets: Widget[];
  isEditing?: boolean;
  onDashboardChange?: (dashboardId: string) => void;
}

/**
 * @brief Renders the dashboard tab bar with per-tab widget counts and menus, plus dialogs to create, rename, delete and customize dashboards.
 * @param widgets List of widgets used to compute the widget count shown on each dashboard tab.
 * @param isEditing Whether edit mode is active, which enables the tab management controls (defaults to false).
 * @param onDashboardChange Optional callback receiving the dashboard id when the active tab changes or a dashboard is created.
 * @return A tab bar of dashboards with a create button and the create, rename, delete and customize dialogs.
 */
export function DashboardTabs({ widgets, isEditing = false, onDashboardChange }: DashboardTabsProps) {
  const {
    dashboards,
    activeDashboardId,
    activeDashboard,
    setActiveDashboardId,
    createDashboard,
    renameDashboard,
    deleteDashboard,
  } = useSettings();

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newDashboardName, setNewDashboardName] = useState<string>('');

  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const [customizeTarget, setCustomizeTarget] = useState<DashboardPageInfo | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState<boolean>(false);

  /**
   * @brief Makes the given dashboard active and notifies the parent through onDashboardChange.
   * @param id Identifier of the dashboard tab to activate.
   */
  const handleSelectTab = (id: string) => {
    setActiveDashboardId(id);
    if (onDashboardChange) {
      onDashboardChange(id);
    }
  };

  /**
   * @brief Creates a new dashboard from the entered name, resets the create dialog and notifies the parent of the new id.
   * @param e The form submit event, whose default behavior is prevented.
   */
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDashboardName.trim()) return;
    const createdId = await createDashboard(newDashboardName.trim());
    setNewDashboardName('');
    setIsCreateOpen(false);
    if (onDashboardChange) {
      onDashboardChange(createdId);
    }
  };

  /**
   * @brief Renames the targeted dashboard with the entered value and clears the rename state.
   * @param e The form submit event, whose default behavior is prevented.
   */
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    await renameDashboard(renameTarget.id, renameValue.trim());
    setRenameTarget(null);
    setRenameValue('');
  };

  /**
   * @brief Deletes the dashboard selected for deletion and clears the delete target.
   */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteDashboard(deleteTarget.id);
    setDeleteTarget(null);
  };

  /**
   * @brief Counts the widgets that belong to a given dashboard, treating widgets without a dashboard as default.
   * @param dashboardId Identifier of the dashboard whose widgets are counted.
   * @return The number of widgets assigned to that dashboard.
   */
  const getWidgetCountForDashboard = (dashboardId: string) => {
    return widgets.filter((w) => {
      const wDashId = w.dashboardId || 'default';
      return wDashId === dashboardId;
    }).length;
  };

  return (
    <div className="w-full flex items-center justify-between gap-3 border-b border-border/70 pb-2.5 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        {dashboards.map((dash) => {
          const isActive = dash.id === activeDashboardId;
          const count = getWidgetCountForDashboard(dash.id);

          return (
            <div
              key={dash.id}
              className={`group relative flex items-center rounded-lg border transition-all select-none ${
                isActive
                  ? 'border-primary/50 bg-primary/10 text-foreground shadow-xs'
                  : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelectTab(dash.id)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium cursor-pointer focus-visible:outline-none"
              >
                <Layout className={`size-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={isActive ? 'font-semibold text-foreground' : ''}>{dash.name}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Options pour ${dash.name}`}
                    className="p-1.5 mr-1 rounded-md text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity cursor-pointer focus-visible:outline-none"
                  >
                    <MoreVertical className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44 text-xs">
                  <DropdownMenuItem
                    onClick={() => {
                      setCustomizeTarget(dash);
                      setIsCustomizeOpen(true);
                    }}
                    className="gap-2 cursor-pointer text-xs"
                  >
                    <Palette className="size-3.5 text-primary" />
                    <span>Personnaliser le thème</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      setRenameTarget(dash);
                      setRenameValue(dash.name);
                    }}
                    className="gap-2 cursor-pointer text-xs"
                  >
                    <Pencil className="size-3.5 text-muted-foreground" />
                    <span>Renommer la page</span>
                  </DropdownMenuItem>

                  {dashboards.length > 1 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(dash)}
                        className="gap-2 cursor-pointer text-xs text-rose-500 focus:text-rose-500"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Supprimer la page</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setNewDashboardName('');
            setIsCreateOpen(true);
          }}
          className="h-8 text-xs gap-1.5 px-2.5 sm:px-3 border-dashed border-border/80 hover:border-primary/60 hover:bg-primary/5 cursor-pointer shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5 text-primary" />
          <span className="hidden sm:inline">Nouvelle page</span>
          <span className="sm:hidden">Page</span>
        </Button>

        {isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCustomizeTarget(activeDashboard);
              setIsCustomizeOpen(true);
            }}
            className="h-8 text-xs gap-1.5 px-2.5 sm:px-3 border-primary/50 bg-primary/10 text-foreground hover:bg-primary/20 cursor-pointer shrink-0 font-medium"
          >
            <Palette className="size-3.5 text-primary" />
            <span className="hidden md:inline">Personnaliser cette page</span>
            <span className="md:hidden">Thème</span>
          </Button>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Créer une page de tableau de bord</DialogTitle>
            <DialogDescription>
              Donnez un nom à votre nouvelle page (ex : Développement, Jeux Steam, Crypto, Veille...).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <Input
              placeholder="Nom de la page (ex: Gaming, Projets...)"
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e.target.value)}
              autoFocus
              className="text-xs"
              required
            />
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newDashboardName.trim()}
              >
                Créer la page
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Renommer la page</DialogTitle>
            <DialogDescription>
              Modifiez l'intitulé de la page « {renameTarget?.name} ».
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenameSubmit} className="space-y-4 pt-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              className="text-xs"
              required
            />
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRenameTarget(null)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!renameValue.trim()}
              >
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Supprimer la page ?</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la page « {deleteTarget?.name} » ? Les widgets associés seront réassignés à la page principale.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomizePageDialog
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        targetDashboard={customizeTarget}
      />
    </div>
  );
}

export default DashboardTabs;

