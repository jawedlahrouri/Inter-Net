import { useState, useEffect, useMemo } from 'react';
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminDashboards,
  deleteAdminUser,
  deleteAdminDashboard,
  createAdminDashboard,
  type AdminStats,
  type AdminUserSummary,
  type AdminDashboardSummary,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { UserDialog } from '@/components/admin/UserDialog';
import { DashboardContentDialog } from '@/components/admin/DashboardContentDialog';
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
  Users,
  Shield,
  Layout,
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  Sliders,
  Filter,
  RefreshCw,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface AdminPanelProps {
  initialTab?: 'users' | 'dashboards';
  onNavigateToVisualDashboard: (userId: number, dashboardId: string) => void;
}

/**
 * @brief Renders the administration panel with global stats, and searchable user and dashboard management tables with dialogs.
 * @param initialTab Tab shown first in the panel, either users or dashboards (defaults to users).
 * @param onNavigateToVisualDashboard Callback receiving a user id and dashboard id to open that user's dashboard visually.
 * @return JSX showing the admin header, statistic cards, the users and dashboards tabs, and the related create, edit and delete dialogs.
 */
export function AdminPanel({
  initialTab = 'users',
  onNavigateToVisualDashboard,
}: AdminPanelProps) {
  const { user: currentAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'dashboards'>(initialTab);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AdminUserSummary | null>(null);

  const [dashboards, setDashboards] = useState<AdminDashboardSummary[]>([]);
  const [loadingDashboards, setLoadingDashboards] = useState(false);
  const [dashSearch, setDashSearch] = useState('');
  const [dashUserFilter, setDashUserFilter] = useState<string>('all');
  const [selectedDashboard, setSelectedDashboard] = useState<AdminDashboardSummary | null>(null);
  const [dashDialogOpen, setDashDialogOpen] = useState(false);

  const [isCreateDashOpen, setIsCreateDashOpen] = useState(false);
  const [newDashTargetUser, setNewDashTargetUser] = useState<number | null>(null);
  const [newDashName, setNewDashName] = useState('');
  const [creatingDash, setCreatingDash] = useState(false);

  const [userToDelete, setUserToDelete] = useState<AdminUserSummary | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [dashToDelete, setDashToDelete] = useState<AdminDashboardSummary | null>(null);
  const [deletingDash, setDeletingDash] = useState(false);

  /**
   * @brief Fetches the global admin statistics and stores them in state, tracking the loading flag.
   */
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement stats admin:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  /**
   * @brief Fetches the admin user list filtered by the current search text and role filter.
   */
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await fetchAdminUsers(
        userSearch.trim() || undefined,
        userRoleFilter !== 'all' ? userRoleFilter : undefined
      );
      setUsers(data);
    } catch (err) {
      console.error('Erreur chargement utilisateurs admin:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  /**
   * @brief Fetches the admin dashboard list filtered by the selected user and search text.
   */
  const loadDashboards = async () => {
    try {
      setLoadingDashboards(true);
      const uid = dashUserFilter !== 'all' ? Number(dashUserFilter) : undefined;
      const data = await fetchAdminDashboards(uid, dashSearch.trim() || undefined);
      setDashboards(data);
    } catch (err) {
      console.error('Erreur chargement dashboards admin:', err);
    } finally {
      setLoadingDashboards(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [userSearch, userRoleFilter]);

  useEffect(() => {
    loadDashboards();
  }, [dashSearch, dashUserFilter]);

  /**
   * @brief Reloads the admin stats, users and dashboards lists.
   */
  const refreshAll = () => {
    loadStats();
    loadUsers();
    loadDashboards();
  };

  /**
   * @brief Deletes the user selected for deletion through the admin API, then refreshes the data.
   */
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setDeletingUser(true);
      await deleteAdminUser(userToDelete.id);
      setUserToDelete(null);
      refreshAll();
    } catch (err) {
      console.error('Erreur suppression utilisateur:', err);
    } finally {
      setDeletingUser(false);
    }
  };

  /**
   * @brief Deletes the dashboard selected for deletion through the admin API, then refreshes the data.
   */
  const handleConfirmDeleteDash = async () => {
    if (!dashToDelete) return;
    try {
      setDeletingDash(true);
      await deleteAdminDashboard(dashToDelete.user_id, dashToDelete.dashboard_id);
      setDashToDelete(null);
      refreshAll();
    } catch (err) {
      console.error('Erreur suppression dashboard:', err);
    } finally {
      setDeletingDash(false);
    }
  };

  /**
   * @brief Handles the create-dashboard form submission by creating a dashboard for the target user and refreshing the data.
   * @param e The form submit event, whose default behavior is prevented.
   */
  const handleCreateDashboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDashTargetUser || !newDashName.trim()) return;
    try {
      setCreatingDash(true);
      await createAdminDashboard(newDashTargetUser, {
        name: newDashName.trim(),
      });
      setIsCreateDashOpen(false);
      setNewDashName('');
      refreshAll();
    } catch (err) {
      console.error('Erreur création dashboard admin:', err);
    } finally {
      setCreatingDash(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20 font-semibold">
              Supervision Globale
            </span>
            <span className="text-xs text-muted-foreground">• Panneau de contrôle système</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-2">
            <Shield className="size-6 text-primary" />
            Panel d'Administration
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gérez l'intégralité des comptes utilisateurs et supervisez tous les tableaux de bord en direct.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            className="text-xs gap-1.5 h-8 border-border hover:bg-muted cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`size-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Utilisateurs inscrits</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {stats ? stats.total_users : '...'}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Comptes enregistrés en base</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Administrateurs</span>
            <Shield className="size-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {stats ? stats.total_admins : '...'}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Droits d'administration actifs</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Pages de Dashboards</span>
            <Layout className="size-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {stats ? stats.total_dashboards : '...'}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Pages personnalisées déployées</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Widgets configurés</span>
            <Layers className="size-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {stats ? stats.total_widgets : '...'}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Widgets persistants en JSON</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Users className="size-4" />
          <span>Gestion des Utilisateurs</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-mono">
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dashboards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'dashboards'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Layout className="size-4" />
          <span>Supervision des Tableaux de bord</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-mono">
            {dashboards.length}
          </span>
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Rechercher par pseudo ou email..."
                  className="pl-9 h-8 text-xs bg-muted/30 border-border"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="h-8 px-2.5 rounded-md border border-border bg-background text-xs cursor-pointer text-muted-foreground"
              >
                <option value="all">Tous les rôles</option>
                <option value="user">Utilisateurs standards</option>
                <option value="admin">Administrateurs</option>
              </select>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setUserToEdit(null);
                setUserDialogOpen(true);
              }}
              className="text-xs gap-1.5 h-8 cursor-pointer shrink-0 w-full sm:w-auto"
            >
              <Plus className="size-3.5" />
              <span>Créer un utilisateur</span>
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4">Date de création</th>
                    <th className="py-3 px-4">Dashboards</th>
                    <th className="py-3 px-4">Widgets</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Chargement des utilisateurs...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Aucun utilisateur trouvé pour ces critères.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelf = currentAdmin?.id === u.id;
                      const isAdmin = u.role === 'admin';

                      return (
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-lg bg-muted border border-border flex items-center justify-center font-mono text-xs font-semibold text-foreground shrink-0">
                                {u.username.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground flex items-center gap-1.5">
                                  <span>{u.username}</span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-primary/20 text-primary">
                                      Vous
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                isAdmin
                                  ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                  : 'bg-muted text-muted-foreground border border-border'
                              }`}
                            >
                              <Shield className="size-3" />
                              {isAdmin ? 'Administrateur' : 'Utilisateur'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                            {new Date(u.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => {
                                setDashUserFilter(String(u.id));
                                setActiveTab('dashboards');
                              }}
                              className="font-mono text-xs font-medium text-primary hover:underline cursor-pointer"
                              title="Voir les dashboards de cet utilisateur"
                            >
                              {u.dashboards_count} page{u.dashboards_count > 1 ? 's' : ''}
                            </button>
                          </td>

                          <td className="py-3 px-4 font-mono text-xs text-foreground">
                            {u.widgets_count} widget{u.widgets_count > 1 ? 's' : ''}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setUserToEdit(u);
                                  setUserDialogOpen(true);
                                }}
                                className="h-7 text-xs px-2.5 gap-1 cursor-pointer"
                                title="Modifier l'utilisateur"
                              >
                                <Edit2 className="size-3 text-muted-foreground" />
                                <span>Modifier</span>
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUserToDelete(u)}
                                disabled={isSelf}
                                className={`h-7 text-xs px-2 cursor-pointer ${
                                  isSelf
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'text-rose-500 hover:text-rose-400 hover:bg-rose-500/10'
                                }`}
                                title={
                                  isSelf
                                    ? 'Vous ne pouvez pas supprimer votre propre compte'
                                    : 'Supprimer ce compte'
                                }
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dashboards' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={dashSearch}
                  onChange={(e) => setDashSearch(e.target.value)}
                  placeholder="Rechercher dashboard ou propriétaire..."
                  className="pl-9 h-8 text-xs bg-muted/30 border-border"
                />
              </div>

              <select
                value={dashUserFilter}
                onChange={(e) => setDashUserFilter(e.target.value)}
                className="h-8 px-2.5 rounded-md border border-border bg-background text-xs cursor-pointer text-muted-foreground max-w-[200px] truncate"
              >
                <option value="all">Tous les utilisateurs</option>
                {users.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.username} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setNewDashTargetUser(
                  dashUserFilter !== 'all' ? Number(dashUserFilter) : (users[0]?.id || null)
                );
                setNewDashName('');
                setIsCreateDashOpen(true);
              }}
              className="text-xs gap-1.5 h-8 cursor-pointer shrink-0 w-full sm:w-auto"
            >
              <Plus className="size-3.5" />
              <span>Nouveau Dashboard pour un utilisateur</span>
            </Button>
          </div>

          {loadingDashboards ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              Chargement des tableaux de bord...
            </div>
          ) : dashboards.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-border/80 p-8 space-y-2">
              <Layout className="size-8 mx-auto text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                Aucun tableau de bord trouvé pour les critères sélectionnés.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.map((dash) => {
                const isDefault = dash.dashboard_id === 'default';

                return (
                  <div
                    key={`${dash.user_id}-${dash.dashboard_id}`}
                    className="p-5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-all flex flex-col justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h2 className="text-sm font-semibold text-foreground">
                              {dash.name}
                            </h2>
                            {isDefault && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-muted text-muted-foreground border border-border">
                                Page Principale
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Propriétaire :{' '}
                            <span className="text-foreground font-medium">@{dash.user_username}</span>
                          </p>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 shrink-0">
                          {dash.widgets_count} widget{dash.widgets_count > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] uppercase font-mono text-muted-foreground">
                          Palette :
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="size-3.5 rounded-full border border-border shadow-xs"
                            style={{ backgroundColor: dash.primary_color || '#0b0f19' }}
                            title={`Primaire: ${dash.primary_color}`}
                          />
                          <span
                            className="size-3.5 rounded-full border border-border shadow-xs"
                            style={{ backgroundColor: dash.secondary_color || '#131b2e' }}
                            title={`Secondaire: ${dash.secondary_color}`}
                          />
                          <span
                            className="size-3.5 rounded-full border border-border shadow-xs"
                            style={{ backgroundColor: dash.tertiary_color || '#38bdf8' }}
                            title={`Accent: ${dash.tertiary_color}`}
                          />
                        </div>
                        {dash.background_image && (
                          <span className="text-[10px] font-mono text-muted-foreground ml-auto truncate max-w-[120px]">
                            🌄 Image personnalisée
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() =>
                          onNavigateToVisualDashboard(dash.user_id, dash.dashboard_id)
                        }
                        className="h-8 text-xs gap-1.5 flex-1 cursor-pointer"
                        title="Ouvrir la vue interactive comme l'utilisateur"
                      >
                        <Eye className="size-3.5" />
                        <span>Accéder</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDashboard(dash);
                          setDashDialogOpen(true);
                        }}
                        className="h-8 text-xs gap-1.5 px-3 cursor-pointer hover:bg-muted"
                        title="Modifier les widgets et les styles du dashboard"
                      >
                        <Sliders className="size-3.5 text-muted-foreground" />
                        <span>Gérer</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDashToDelete(dash)}
                        disabled={isDefault}
                        className={`h-8 text-xs px-2.5 cursor-pointer ${
                          isDefault
                            ? 'opacity-30 cursor-not-allowed'
                            : 'text-rose-500 hover:text-rose-400 hover:bg-rose-500/10'
                        }`}
                        title={
                          isDefault
                            ? 'Le tableau de bord par défaut ne peut pas être supprimé'
                            : 'Supprimer ce tableau de bord'
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        userToEdit={userToEdit}
        onSuccess={refreshAll}
      />

      <DashboardContentDialog
        open={dashDialogOpen}
        onOpenChange={setDashDialogOpen}
        dashboardSummary={selectedDashboard}
        onSuccess={refreshAll}
        onOpenVisualDashboard={onNavigateToVisualDashboard}
      />

      <Dialog open={isCreateDashOpen} onOpenChange={setIsCreateDashOpen}>
        <DialogContent className="sm:max-w-md border-border bg-background shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Layout className="size-4 text-primary" />
              Créer un tableau de bord
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ajoutez une nouvelle page de tableau de bord pour l'utilisateur choisi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDashboardSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Utilisateur cible</label>
              <select
                value={newDashTargetUser || ''}
                onChange={(e) => setNewDashTargetUser(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-md border border-border bg-background text-xs cursor-pointer"
                required
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Nom du tableau de bord</label>
              <Input
                value={newDashName}
                onChange={(e) => setNewDashName(e.target.value)}
                placeholder="ex. Monitoring Serveurs, E-Commerce, Gaming..."
                className="h-9 text-xs"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateDashOpen(false)}
                className="text-xs"
              >
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={creatingDash} className="text-xs">
                {creatingDash ? 'Création...' : 'Créer le dashboard'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(userToDelete)} onOpenChange={(o) => !o && setUserToDelete(null)}>
        <DialogContent className="sm:max-w-md border-border bg-background shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-rose-500">
              <AlertTriangle className="size-4" />
              Supprimer cet utilisateur ?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cette action est irréversible. Le compte de{' '}
              <strong className="text-foreground">@{userToDelete?.username}</strong>, l'ensemble de ses
              tableaux de bord et ses fichiers JSON de widgets seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUserToDelete(null)}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deletingUser}
              onClick={handleConfirmDeleteUser}
              className="text-xs"
            >
              {deletingUser ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(dashToDelete)} onOpenChange={(o) => !o && setDashToDelete(null)}>
        <DialogContent className="sm:max-w-md border-border bg-background shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-rose-500">
              <AlertTriangle className="size-4" />
              Supprimer ce tableau de bord ?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Le tableau de bord <strong className="text-foreground">{dashToDelete?.name}</strong> de{' '}
              <strong className="text-foreground">@{dashToDelete?.user_username}</strong> ainsi que tous ses
              widgets associés seront supprimés.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDashToDelete(null)}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deletingDash}
              onClick={handleConfirmDeleteDash}
              className="text-xs"
            >
              {deletingDash ? 'Suppression...' : 'Supprimer ce dashboard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
