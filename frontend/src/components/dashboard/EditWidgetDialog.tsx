import * as React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { InputField } from '@/components/ui/input-field'
import { RefreshField } from '@/components/ui/refresh-field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Widget } from '@/types/widget'
import { useSettings } from '@/context/SettingsContext'
import { WidgetDimensionSelector } from '@/components/dashboard/WidgetDimensionSelector'

export interface EditWidgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widget: Widget | null
  onUpdateWidget: (id: string, data: Partial<Widget>) => void
}

/**
 * @brief Renders the dialog that lets the user edit a widget's title, refresh interval, dashboard page, size and type-specific settings.
 * @param open Whether the dialog is currently visible.
 * @param onOpenChange Callback invoked with the new open state, e.g. false after saving.
 * @param widget Widget being edited, or null to render nothing.
 * @param onUpdateWidget Callback receiving the widget id and the partial updated data when the form is submitted.
 * @return A dialog with a form of widget fields and save/cancel buttons, or null when no widget is selected.
 */
export function EditWidgetDialog({
  open,
  onOpenChange,
  widget,
  onUpdateWidget,
}: EditWidgetDialogProps) {
  const { dashboards } = useSettings()
  const [title, setTitle] = useState('')
  const [city, setCity] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [jsonPath, setJsonPath] = useState('')
  const [displayMode, setDisplayMode] = useState<'kpi' | 'gauge'>('kpi')
  const [unit, setUnit] = useState('')
  const [refreshInterval, setRefreshInterval] = useState<number>(30)
  const [url, setUrl] = useState('')
  const [repoFullName, setRepoFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [dashboardId, setDashboardId] = useState<string>('default')
  const [width, setWidth] = useState<number>(1)
  const [height, setHeight] = useState<number>(1)

  useEffect(() => {
    if (widget) {
      setTitle(widget.title || '')
      setCity(widget.city || '')
      setApiUrl(widget.apiUrl || '')
      setJsonPath(widget.jsonPath || '')
      setDisplayMode(widget.displayMode || 'kpi')
      setUnit(widget.unit || '')
      setRefreshInterval(widget.refreshIntervalSeconds || 30)
      setUrl(widget.url || '')
      setRepoFullName(widget.repoFullName || '')
      setOrgName(widget.orgName || '')
      setDashboardId(widget.dashboardId || 'default')
      setWidth(widget.width || 1)
      setHeight(widget.height || 1)
    }
  }, [widget])

  if (!widget) return null

  /**
   * @brief Builds the updated widget data from the form state, sends it to onUpdateWidget and closes the dialog.
   * @param e The form submit event, whose default behavior is prevented.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedData: Partial<Widget> = {
      title: title.trim() || widget.title,
      refreshIntervalSeconds: refreshInterval,
      dashboardId: dashboardId || 'default',
      width,
      height,
    }

    if (widget.type === 'weather') {
      updatedData.type = 'weather'
      updatedData.city = city.trim() || undefined
    } else if (widget.type === 'custom_api') {
      updatedData.type = 'custom_api'
      updatedData.apiUrl = apiUrl.trim()
      updatedData.jsonPath = jsonPath.trim()
      updatedData.displayMode = displayMode
      updatedData.unit = unit.trim() || undefined
    } else if (widget.type === 'steam') {
      updatedData.type = 'steam'
      updatedData.steamMetric = widget.steamMetric
    } else if (widget.type === 'github') {
      updatedData.type = 'github'
      updatedData.githubMetric = widget.githubMetric
      if (repoFullName.trim()) updatedData.repoFullName = repoFullName.trim()
      if (orgName.trim()) updatedData.orgName = orgName.trim()
    } else {
      updatedData.type = 'default'
      updatedData.url = url.trim() || undefined
    }

    onUpdateWidget(widget.id, updatedData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[560px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le widget</DialogTitle>
          <DialogDescription>
            Ajustez les paramètres et l'intervalle de rafraîchissement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <InputField
            label="Nom du widget"
            placeholder="Titre affiché sur le panneau"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {dashboards.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Page de tableau de bord
              </label>
              <select
                value={dashboardId}
                onChange={(e) => setDashboardId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {dashboards.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <RefreshField
            label="Timer de rafraîchissement"
            value={refreshInterval}
            onChange={(val) => setRefreshInterval(val)}
          />

          {widget.type === 'github' && widget.githubMetric?.startsWith('repo_') && (
            <InputField
              label="Dépôt GitHub (owner/repo)"
              placeholder="Ex: facebook/react ou octocat/Hello-World"
              value={repoFullName}
              onChange={(e) => setRepoFullName(e.target.value)}
              description="Laissez vide pour utiliser votre dépôt le plus actif"
            />
          )}

          {widget.type === 'github' && widget.githubMetric === 'org_overview' && (
            <InputField
              label="Organisation GitHub"
              placeholder="Ex: vercel, facebook, microsoft..."
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              description="Nom de l'organisation GitHub à analyser"
            />
          )}

          {widget.type === 'weather' && (
            <InputField
              label="Ville"
              placeholder="Ex: Paris, Bordeaux, Tokyo..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              description="Laissez vide pour la géolocalisation automatique"
            />
          )}

          {widget.type === 'custom_api' && (
            <>
              <InputField
                label="URL de l'API"
                placeholder="https://..."
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                required
              />
              <InputField
                label="Chemin JSON (Path)"
                placeholder="Ex: status ou main.temp"
                value={jsonPath}
                onChange={(e) => setJsonPath(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Unité (optionnelle)"
                  placeholder="Ex: %, ms, °C"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">Affichage</span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant={displayMode === 'kpi' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 text-xs cursor-pointer"
                      onClick={() => setDisplayMode('kpi')}
                    >
                      KPI
                    </Button>
                    <Button
                      type="button"
                      variant={displayMode === 'gauge' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 text-xs cursor-pointer"
                      onClick={() => setDisplayMode('gauge')}
                    >
                      Jauge
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {widget.type === 'default' && (
            <InputField
              label="Lien externe"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          )}

          <div className="pt-3 border-t border-border/60">
            <WidgetDimensionSelector
              width={width}
              height={height}
              onChange={(w, h) => {
                setWidth(w)
                setHeight(h)
              }}
            />
          </div>

          <DialogFooter className="pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditWidgetDialog
