import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  fetchAdminDashboardDetail,
  updateAdminDashboard,
  createAdminWidget,
  updateAdminWidget,
  deleteAdminWidget,
  type AdminDashboardSummary,
  type AdminDashboardDetail,
  type ApiUserWidget,
} from '@/services/api';
import {
  Layout,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Save,
  Clock,
  Palette,
  AlertCircle,
  Maximize2,
} from 'lucide-react';

interface DashboardContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardSummary: AdminDashboardSummary | null;
  onSuccess: () => void;
  onOpenVisualDashboard?: (userId: number, dashboardId: string) => void;
}

/**
 * @brief Renders the admin dialog for editing a user's dashboard style and managing its widgets.
 * @param open Whether the dialog is currently visible.
 * @param onOpenChange Callback invoked with the new open state when the dialog is opened or closed.
 * @param dashboardSummary Summary of the dashboard to edit (user id, dashboard id), or null when none is selected.
 * @param onSuccess Callback invoked after a style or widget change is saved so the parent can refresh.
 * @param onOpenVisualDashboard Optional callback receiving user id and dashboard id to open the dashboard visually.
 * @return JSX for a dialog with style and widgets tabs, widget create and edit forms, and delete actions.
 */
export function DashboardContentDialog({
  open,
  onOpenChange,
  dashboardSummary,
  onSuccess,
  onOpenVisualDashboard,
}: DashboardContentDialogProps) {
  const [detail, setDetail] = useState<AdminDashboardDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'style' | 'widgets'>('widgets');

  const [dashName, setDashName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0b0f19');
  const [secondaryColor, setSecondaryColor] = useState('#131b2e');
  const [tertiaryColor, setTertiaryColor] = useState('#38bdf8');
  const [bgImage, setBgImage] = useState('');
  const [savingStyle, setSavingStyle] = useState(false);
  const [styleSuccess, setStyleSuccess] = useState(false);

  const [editingWidget, setEditingWidget] = useState<ApiUserWidget | null>(null);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [newWidgetType, setNewWidgetType] = useState<string>('weather');
  const [newWidgetTitle, setNewWidgetTitle] = useState<string>('');
  const [newWidgetParam, setNewWidgetParam] = useState<string>('');
  const [newWidgetRate, setNewWidgetRate] = useState<number>(60);
  const [newWidgetWidth, setNewWidgetWidth] = useState<number>(1);
  const [newWidgetHeight, setNewWidgetHeight] = useState<number>(1);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * @brief Fetches the selected dashboard's details and fills the style form fields from them.
   */
  const loadDetail = async () => {
    if (!dashboardSummary) return;
    try {
      setLoading(true);
      const data = await fetchAdminDashboardDetail(
        dashboardSummary.user_id,
        dashboardSummary.dashboard_id
      );
      setDetail(data);
      setDashName(data.name || '');
      setPrimaryColor(data.primary_color || '#0b0f19');
      setSecondaryColor(data.secondary_color || '#131b2e');
      setTertiaryColor(data.tertiary_color || '#38bdf8');
      setBgImage(data.background_image || '');
    } catch (err) {
      console.error('Erreur chargement dashboard detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && dashboardSummary) {
      loadDetail();
      setIsAddingWidget(false);
      setEditingWidget(null);
      setStyleSuccess(false);
    }
  }, [open, dashboardSummary]);

  /**
   * @brief Saves the dashboard name, colors and background image via the admin API and reloads the details.
   * @param e The form submit event, whose default behavior is prevented.
   */
  const handleSaveStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardSummary) return;
    try {
      setSavingStyle(true);
      await updateAdminDashboard(
        dashboardSummary.user_id,
        dashboardSummary.dashboard_id,
        {
          name: dashName.trim(),
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          tertiary_color: tertiaryColor,
          background_image: bgImage.trim() || null,
        }
      );
      setStyleSuccess(true);
      setTimeout(() => setStyleSuccess(false), 2500);
      onSuccess();
      await loadDetail();
    } catch (err) {
      console.error('Erreur mise à jour style dashboard:', err);
    } finally {
      setSavingStyle(false);
    }
  };

  /**
   * @brief Builds type-specific parameters and creates a new widget on the dashboard through the admin API.
   * @param e The form submit event, whose default behavior is prevented.
   */
  const handleCreateWidgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardSummary) return;
    setWidgetError(null);

    try {
      setActionLoading(true);
      const params_values: Record<string, any> = {
        dashboardId: dashboardSummary.dashboard_id,
      };

      if (newWidgetType === 'weather') {
        params_values.city = newWidgetParam.trim() || 'Paris';
      } else if (newWidgetType === 'custom_api') {
        params_values.apiUrl = newWidgetParam.trim() || 'http://127.0.0.1:8000/api/v1/health';
        params_values.jsonPath = 'status';
        params_values.displayMode = 'kpi';
      } else if (newWidgetType === 'steam') {
        params_values.steamMetric = newWidgetParam.trim() || 'last_played';
      } else if (newWidgetType === 'github') {
        params_values.githubMetric = newWidgetParam.trim() || 'profile_card';
      } else {
        params_values.url = newWidgetParam.trim() || 'https://google.com';
      }

      await createAdminWidget(dashboardSummary.user_id, {
        title: newWidgetTitle.trim() || undefined,
        type: newWidgetType,
        params_values,
        refresh_rate: newWidgetRate,
        width: newWidgetWidth,
        height: newWidgetHeight,
      });

      setIsAddingWidget(false);
      setNewWidgetTitle('');
      setNewWidgetParam('');
      await loadDetail();
      onSuccess();
    } catch (err: any) {
      setWidgetError(err?.message || 'Erreur lors de la création du widget');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * @brief Saves the edited widget's title, refresh rate, size and parameters through the admin API.
   * @param e The form submit event, whose default behavior is prevented.
   */
  const handleUpdateWidgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardSummary || !editingWidget) return;
    setWidgetError(null);

    try {
      setActionLoading(true);
      await updateAdminWidget(dashboardSummary.user_id, editingWidget.id, {
        title: editingWidget.title,
        refresh_rate: editingWidget.refresh_rate,
        width: editingWidget.width,
        height: editingWidget.height,
        params_values: editingWidget.params_values,
      });

      setEditingWidget(null);
      await loadDetail();
      onSuccess();
    } catch (err: any) {
      setWidgetError(err?.message || 'Erreur lors de la modification');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * @brief Deletes a widget through the admin API after user confirmation, then reloads the dashboard details.
   * @param widgetId The numeric id of the widget to delete.
   */
  const handleDeleteWidget = async (widgetId: number) => {
    if (!dashboardSummary) return;
    if (!confirm('Confirmez-vous la suppression de ce widget ?')) return;

    try {
      setActionLoading(true);
      await deleteAdminWidget(dashboardSummary.user_id, widgetId);
      await loadDetail();
      onSuccess();
    } catch (err) {
      console.error('Erreur suppression widget:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col border-border bg-background shadow-2xl p-0 overflow-hidden">
        <div className="p-6 pb-3 border-b border-border">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <Layout className="size-4 text-primary" />
                  Administration du Dashboard : {dashboardSummary?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Propriétaire : <span className="text-foreground font-medium">{dashboardSummary?.user_username}</span> ({dashboardSummary?.user_email}) • ID: <code className="text-[10px] font-mono">{dashboardSummary?.dashboard_id}</code>
                </DialogDescription>
              </div>

              {onOpenVisualDashboard && dashboardSummary && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenVisualDashboard(dashboardSummary.user_id, dashboardSummary.dashboard_id);
                  }}
                  className="gap-1.5 text-xs shrink-0 cursor-pointer border-primary/40 hover:bg-primary/10 text-primary"
                >
                  <Maximize2 className="size-3.5" />
                  <span>Superviser en direct</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('widgets')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'widgets'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Sliders className="size-3.5" />
              <span>Contenu des Widgets ({detail?.widgets?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('style')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'style'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Palette className="size-3.5" />
              <span>Style & Thème du Dashboard</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground">Chargement des données du dashboard...</p>
            </div>
          ) : activeTab === 'style' ? (
            <form onSubmit={handleSaveStyle} className="space-y-4 max-w-lg mx-auto py-2">
              {styleSuccess && (
                <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <Save className="size-3.5" />
                  <span>Style et nom du tableau de bord enregistrés avec succès !</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Nom du tableau de bord</label>
                <Input
                  value={dashName}
                  onChange={(e) => setDashName(e.target.value)}
                  placeholder="Général, Gaming, Pro..."
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Couleur primaire</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="size-8 rounded border border-border cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] font-mono text-muted-foreground">{primaryColor}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Couleur secondaire</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="size-8 rounded border border-border cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] font-mono text-muted-foreground">{secondaryColor}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Couleur accent</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tertiaryColor}
                      onChange={(e) => setTertiaryColor(e.target.value)}
                      className="size-8 rounded border border-border cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] font-mono text-muted-foreground">{tertiaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Image d'arrière-plan (URL web optionnelle)</label>
                <Input
                  value={bgImage}
                  onChange={(e) => setBgImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" size="sm" disabled={savingStyle} className="text-xs gap-1.5">
                  <Save className="size-3.5" />
                  {savingStyle ? 'Sauvegarde...' : 'Appliquer les modifications'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {widgetError && (
                <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="size-3.5" />
                  <span>{widgetError}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Modifiez, redimensionnez ou supprimez n'importe quel widget configuré sur cette page.
                </p>
                <Button
                  size="sm"
                  variant={isAddingWidget ? 'secondary' : 'default'}
                  onClick={() => {
                    setIsAddingWidget((prev) => !prev);
                    setEditingWidget(null);
                  }}
                  className="text-xs gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="size-3.5" />
                  <span>{isAddingWidget ? 'Fermer le formulaire' : 'Ajouter un widget'}</span>
                </Button>
              </div>

              {isAddingWidget && (
                <form
                  onSubmit={handleCreateWidgetSubmit}
                  className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Plus className="size-3.5 text-primary" />
                      Nouveau widget pour cet utilisateur
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Type de service</label>
                      <select
                        value={newWidgetType}
                        onChange={(e) => setNewWidgetType(e.target.value)}
                        className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs"
                      >
                        <option value="weather">Météo (Weather)</option>
                        <option value="custom_api">API Universelle</option>
                        <option value="steam">Steam Gaming</option>
                        <option value="github">GitHub Stats</option>
                        <option value="default">Raccourci Web</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Titre affiché</label>
                      <Input
                        value={newWidgetTitle}
                        onChange={(e) => setNewWidgetTitle(e.target.value)}
                        placeholder="ex. Météo Paris"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        {newWidgetType === 'weather'
                          ? 'Ville'
                          : newWidgetType === 'custom_api'
                          ? 'URL API'
                          : newWidgetType === 'steam'
                          ? 'Métrique Steam'
                          : newWidgetType === 'github'
                          ? 'Métrique GitHub'
                          : 'URL Web'}
                      </label>
                      <Input
                        value={newWidgetParam}
                        onChange={(e) => setNewWidgetParam(e.target.value)}
                        placeholder={newWidgetType === 'weather' ? 'Paris' : 'Valeur'}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Refresh (sec)</label>
                      <Input
                        type="number"
                        min={5}
                        max={86400}
                        value={newWidgetRate}
                        onChange={(e) => setNewWidgetRate(Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Colonnes (Width 1-6)</label>
                      <Input
                        type="number"
                        min={1}
                        max={6}
                        value={newWidgetWidth}
                        onChange={(e) => setNewWidgetWidth(Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Lignes (Height 1-3)</label>
                      <Input
                        type="number"
                        min={1}
                        max={3}
                        value={newWidgetHeight}
                        onChange={(e) => setNewWidgetHeight(Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingWidget(false)}
                      className="h-7 text-xs"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={actionLoading}
                      className="h-7 text-xs"
                    >
                      {actionLoading ? 'Ajout en cours...' : 'Confirmer l\'ajout'}
                    </Button>
                  </div>
                </form>
              )}

              {editingWidget && (
                <form
                  onSubmit={handleUpdateWidgetSubmit}
                  className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Edit2 className="size-3.5 text-violet-400" />
                      Modifier le widget #{editingWidget.id} ({editingWidget.type})
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingWidget(null)}
                      className="h-6 text-xs text-muted-foreground"
                    >
                      Fermer
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Titre</label>
                      <Input
                        value={editingWidget.title || ''}
                        onChange={(e) =>
                          setEditingWidget({ ...editingWidget, title: e.target.value })
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Timer (secondes)</label>
                      <Input
                        type="number"
                        min={5}
                        max={86400}
                        value={editingWidget.refresh_rate || 60}
                        onChange={(e) =>
                          setEditingWidget({
                            ...editingWidget,
                            refresh_rate: Number(e.target.value),
                          })
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Largeur (1-6)</label>
                        <Input
                          type="number"
                          min={1}
                          max={6}
                          value={editingWidget.width || 1}
                          onChange={(e) =>
                            setEditingWidget({
                              ...editingWidget,
                              width: Number(e.target.value),
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Hauteur (1-3)</label>
                        <Input
                          type="number"
                          min={1}
                          max={3}
                          value={editingWidget.height || 1}
                          onChange={(e) =>
                            setEditingWidget({
                              ...editingWidget,
                              height: Number(e.target.value),
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={actionLoading}
                      className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      {actionLoading ? 'Enregistrement...' : 'Sauvegarder ce widget'}
                    </Button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {!detail?.widgets || detail.widgets.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-border/80">
                    <Sliders className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Ce dashboard ne contient actuellement aucun widget.
                    </p>
                  </div>
                ) : (
                  detail.widgets.map((widget) => {
                    const p = widget.params_values || {};
                    return (
                      <div
                        key={widget.id}
                        className="p-3.5 rounded-xl border border-border/70 bg-card/60 hover:border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {widget.title || 'Widget sans titre'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-primary/10 text-primary border border-primary/20">
                              {widget.type || 'standard'}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              #{widget.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3 text-muted-foreground/80" />
                              {widget.refresh_rate}s
                            </span>
                            <span>
                              Format : {widget.width || 1}x{widget.height || 1}
                            </span>
                            {p.city && <span>Ville : {p.city}</span>}
                            {p.apiUrl && <span className="font-mono truncate max-w-[180px]">{p.apiUrl}</span>}
                            {p.steamMetric && <span>Steam : {p.steamMetric}</span>}
                            {p.githubMetric && <span>GitHub : {p.githubMetric}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingWidget({ ...widget });
                              setIsAddingWidget(false);
                            }}
                            className="h-7 text-xs px-2.5 gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Edit2 className="size-3" />
                            <span>Modifier</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWidget(widget.id)}
                            className="h-7 text-xs px-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
