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
import { Plus, MoreVertical, Pencil, Trash2, Layout } from 'lucide-react';

interface DashboardTabsProps {
  widgets: Widget[];
  onDashboardChange?: (dashboardId: string) => void;
}

export function DashboardTabs({ widgets, onDashboardChange }: DashboardTabsProps) {
  const {
    dashboards,
    activeDashboardId,
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

  const handleSelectTab = (id: string) => {
    setActiveDashboardId(id);
    if (onDashboardChange) {
      onDashboardChange(id);
    }
  };

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

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    await renameDashboard(renameTarget.id, renameValue.trim());
    setRenameTarget(null);
    setRenameValue('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteDashboard(deleteTarget.id);
    setDeleteTarget(null);
  };

  const getWidgetCountForDashboard = (dashboardId: string) => {
    return widgets.filter((w) => {
      const wDashId = w.dashboardId || 'default';
      return wDashId === dashboardId;
    }).length;
  };

  return (
    <div className="w-full flex items-center justify-between gap-3 border-b border-border/70 pb-2.5 overflow-x-auto no-scrollbar">
      {/* Liste des onglets de tableaux de bord */}
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

              {/* Menu d'options du tableau de bord (renommer / supprimer) */}
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

        {/* Bouton pour créer une nouvelle page de tableau de bord */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setNewDashboardName('');
            setIsCreateOpen(true);
          }}
          className="h-8 text-xs gap-1.5 px-3 border-dashed border-border/80 hover:border-primary/60 hover:bg-primary/5 cursor-pointer shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5 text-primary" />
          <span>Nouvelle page</span>
        </Button>
      </div>

      {/* Boîte de dialogue Création d'une page */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[420px]">
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

      {/* Boîte de dialogue Renommer une page */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
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

      {/* Boîte de dialogue Confirmation de suppression */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
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
    </div>
  );
}

export default DashboardTabs;

