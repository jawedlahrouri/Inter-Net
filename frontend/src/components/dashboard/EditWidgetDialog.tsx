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

export interface EditWidgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widget: Widget | null
  onUpdateWidget: (id: string, data: Partial<Widget>) => void
}

export function EditWidgetDialog({
  open,
  onOpenChange,
  widget,
  onUpdateWidget,
}: EditWidgetDialogProps) {
  const [title, setTitle] = useState('')
  const [city, setCity] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [jsonPath, setJsonPath] = useState('')
  const [displayMode, setDisplayMode] = useState<'kpi' | 'gauge'>('kpi')
  const [unit, setUnit] = useState('')
  const [refreshInterval, setRefreshInterval] = useState<number>(30)
  const [url, setUrl] = useState('')

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
    }
  }, [widget])

  if (!widget) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedData: Partial<Widget> = {
      title: title.trim() || widget.title,
      refreshIntervalSeconds: refreshInterval,
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
    } else {
      updatedData.type = 'default'
      updatedData.url = url.trim() || undefined
    }

    onUpdateWidget(widget.id, updatedData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
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

          <RefreshField
            label="Timer de rafraîchissement"
            value={refreshInterval}
            onChange={(val) => setRefreshInterval(val)}
          />

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

          <DialogFooter className="pt-2">
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
