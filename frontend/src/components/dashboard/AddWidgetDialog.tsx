import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InputField } from '@/components/ui/input-field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CloudSun, Activity, ExternalLink } from 'lucide-react'
import type { NewWidgetData, WidgetType } from '@/types/widget'

export interface AddWidgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddWidget: (data: NewWidgetData) => void
}

export function AddWidgetDialog({
  open,
  onOpenChange,
  onAddWidget,
}: AddWidgetDialogProps) {
  const [selectedType, setSelectedType] = useState<WidgetType>('weather')

  // Common
  const [title, setTitle] = useState('')

  // Weather
  const [city, setCity] = useState('')

  // Custom API
  const [apiUrl, setApiUrl] = useState('')
  const [jsonPath, setJsonPath] = useState('')
  const [displayMode, setDisplayMode] = useState<'kpi' | 'gauge'>('kpi')
  const [unit, setUnit] = useState('')
  const [refreshInterval, setRefreshInterval] = useState<number>(30)

  // Default link
  const [url, setUrl] = useState('')

  const handleApplyPreset = (preset: {
    title: string
    apiUrl: string
    jsonPath: string
    displayMode: 'kpi' | 'gauge'
    unit: string
  }) => {
    setTitle(preset.title)
    setApiUrl(preset.apiUrl)
    setJsonPath(preset.jsonPath)
    setDisplayMode(preset.displayMode)
    setUnit(preset.unit)
  }

  const resetForm = () => {
    setTitle('')
    setCity('')
    setApiUrl('')
    setJsonPath('')
    setDisplayMode('kpi')
    setUnit('')
    setRefreshInterval(30)
    setUrl('')
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedType === 'weather') {
      onAddWidget({
        title: title.trim() || 'Météo locale',
        type: 'weather',
        city: city.trim() || undefined,
      })
    } else if (selectedType === 'custom_api') {
      if (!apiUrl.trim() || !jsonPath.trim()) return
      onAddWidget({
        title: title.trim() || 'Métrique API',
        type: 'custom_api',
        apiUrl: apiUrl.trim(),
        jsonPath: jsonPath.trim(),
        displayMode,
        unit: unit.trim() || undefined,
        refreshIntervalSeconds: refreshInterval || 30,
      })
    } else {
      if (!title.trim()) return
      onAddWidget({
        title: title.trim(),
        type: 'default',
        url: url.trim() || undefined,
      })
    }

    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un widget</DialogTitle>
          <DialogDescription>
            Choisissez le type de panneau et configurez sa source de données.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Tabs
            value={selectedType}
            onValueChange={(val) => setSelectedType(val as WidgetType)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full h-10">
              <TabsTrigger value="weather" className="flex items-center gap-1.5 text-xs cursor-pointer">
                <CloudSun className="size-4" />
                Météo
              </TabsTrigger>
              <TabsTrigger value="custom_api" className="flex items-center gap-1.5 text-xs cursor-pointer">
                <Activity className="size-4" />
                API JSON
              </TabsTrigger>
              <TabsTrigger value="default" className="flex items-center gap-1.5 text-xs cursor-pointer">
                <ExternalLink className="size-4" />
                Raccourci
              </TabsTrigger>
            </TabsList>

            {/* Onglet Météo */}
            <TabsContent value="weather" className="space-y-3 pt-3">
              <InputField
                label="Nom du widget"
                placeholder="Ex: Météo locale (optionnel)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <InputField
                label="Ville spécifique (optionnel)"
                placeholder="Ex: Paris, Lyon, Bordeaux..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                description="Laissez vide pour détecter automatiquement votre position GPS."
              />
            </TabsContent>

            {/* Onglet API JSON Universelle */}
            <TabsContent value="custom_api" className="space-y-3 pt-3">
              {/* Presets rapides */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted-foreground text-[11px]">Exemples :</span>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted text-[11px]"
                  onClick={() =>
                    handleApplyPreset({
                      title: 'Statut Backend',
                      apiUrl: 'http://127.0.0.1:8000/api/v1/health',
                      jsonPath: 'status',
                      displayMode: 'kpi',
                      unit: '',
                    })
                  }
                >
                  Backend FastAPI
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted text-[11px]"
                  onClick={() =>
                    handleApplyPreset({
                      title: 'Wishlist Steam',
                      apiUrl: 'https://api.steampowered.com/IWishlistService/GetWishlist/v1/?steamid=76561199802292886',
                      jsonPath: 'response.items.length',
                      displayMode: 'kpi',
                      unit: 'jeux',
                    })
                  }
                >
                  🎮 Wishlist Steam
                </Badge>
              </div>

              <InputField
                label="Nom du panneau"
                placeholder="Ex: Santé API ou Wishlist Steam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <InputField
                label="URL de l'API (GET)"
                placeholder="http://... ou https://..."
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Chemin JSON (Path)"
                  placeholder="status ou data.value"
                  value={jsonPath}
                  onChange={(e) => setJsonPath(e.target.value)}
                  required
                />
                <InputField
                  label="Unité (optionnelle)"
                  placeholder="Ex: $, ms, %, °C"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-foreground">
                  Mode d'affichage
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={displayMode === 'kpi' ? 'default' : 'outline'}
                    size="sm"
                    className="cursor-pointer text-xs"
                    onClick={() => setDisplayMode('kpi')}
                  >
                    Chiffre clé (KPI)
                  </Button>
                  <Button
                    type="button"
                    variant={displayMode === 'gauge' ? 'default' : 'outline'}
                    size="sm"
                    className="cursor-pointer text-xs"
                    onClick={() => setDisplayMode('gauge')}
                  >
                    Jauge Radiale (0-100%)
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Onglet Raccourci classique */}
            <TabsContent value="default" className="space-y-3 pt-3">
              <InputField
                label="Nom du widget"
                placeholder="Entrez le nom du widget"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <InputField
                label="Lien externe (optionnel)"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Annuler
            </Button>
            <Button type="submit">
              Créer le widget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddWidgetDialog
