import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputField } from '@/components/ui/input-field'
import { JsonPathPicker } from './JsonPathPicker'

export interface CustomApiTabProps {
  title: string
  setTitle: (val: string) => void
  apiUrl: string
  setApiUrl: (val: string) => void
  jsonPath: string
  setJsonPath: (val: string) => void
  displayMode: 'kpi' | 'gauge'
  setDisplayMode: (val: 'kpi' | 'gauge') => void
  unit: string
  setUnit: (val: string) => void
  refreshInterval: number
  setRefreshInterval: (val: number) => void
}

const REFRESH_PRESETS = [10, 30, 60, 300]

/**
 * @brief Renders the form tab used to configure a custom API widget with presets, URL, JSON path, unit, refresh rate and display mode.
 * @param title Current widget title value in the form.
 * @param setTitle Setter called to update the widget title.
 * @param apiUrl Current URL of the API to call with a GET request.
 * @param setApiUrl Setter called to update the API URL.
 * @param jsonPath Current dot-separated JSON path of the value to display.
 * @param setJsonPath Setter called to update the JSON path.
 * @param displayMode Current display mode, either kpi or gauge.
 * @param setDisplayMode Setter called to switch between kpi and gauge display modes.
 * @param unit Current unit label shown next to the value.
 * @param setUnit Setter called to update the unit label.
 * @param refreshInterval Current auto-refresh interval in seconds.
 * @param setRefreshInterval Setter called to update the refresh interval in seconds.
 * @return A form with preset badges, input fields, a JSON path picker, refresh presets and KPI or gauge mode buttons.
 */
export function CustomApiTab({
  title,
  setTitle,
  apiUrl,
  setApiUrl,
  jsonPath,
  setJsonPath,
  displayMode,
  setDisplayMode,
  unit,
  setUnit,
  refreshInterval,
  setRefreshInterval,
}: CustomApiTabProps) {
  /**
   * @brief Applies all fields of a preset to the custom API form state.
   * @param preset Preset object with title, apiUrl, jsonPath, displayMode, unit and refreshInterval.
   */
  const handleApplyPreset = (preset: {
    title: string
    apiUrl: string
    jsonPath: string
    displayMode: 'kpi' | 'gauge'
    unit: string
    refreshInterval: number
  }) => {
    setTitle(preset.title)
    setApiUrl(preset.apiUrl)
    setJsonPath(preset.jsonPath)
    setDisplayMode(preset.displayMode)
    setUnit(preset.unit)
    setRefreshInterval(preset.refreshInterval)
  }

  /**
   * @brief Handles a JSON path chosen in the picker by setting the path, the suggested display mode and a default title.
   * @param path Selected dot-separated JSON path.
   * @param _previewValue Preview value at the path, unused.
   * @param suggestedMode Display mode suggested by the picker, if any.
   */
  const handleSelectPath = (path: string, _previewValue: any, suggestedMode?: 'kpi' | 'gauge') => {
    setJsonPath(path)
    if (suggestedMode) {
      setDisplayMode(suggestedMode)
    }
    if (!title.trim()) {
      const parts = path.split('.')
      const name = parts[parts.length - 1]
      setTitle(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }

  return (
    <div className="space-y-3 pt-3">
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
              refreshInterval: 10,
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
              refreshInterval: 60,
            })
          }
        >
          🎮 Wishlist Steam
          Wishlist Steam
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

      {apiUrl.trim().length > 5 && (
        <JsonPathPicker
          apiUrl={apiUrl}
          selectedPath={jsonPath}
          onSelectPath={handleSelectPath}
          className="p-2.5 rounded-lg border border-border/80 bg-muted/20"
        />
      )}

      <InputField
        label="Chemin JSON (Path)"
        placeholder="status ou data.value"
        value={jsonPath}
        onChange={(e) => setJsonPath(e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="Unité (optionnelle)"
          placeholder="Ex: $, ms, %, °C"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
        <div className="space-y-1">
          <InputField
            label="Rafraîchissement (sec)"
            type="number"
            min={5}
            max={3600}
            placeholder="30"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Math.max(1, Number(e.target.value)))}
          />
          <div className="flex items-center gap-1 pt-0.5">
            {REFRESH_PRESETS.map((sec) => (
              <Badge
                key={sec}
                variant={refreshInterval === sec ? 'default' : 'outline'}
                className="cursor-pointer text-[9px] px-1.5 py-0 h-4"
                onClick={() => setRefreshInterval(sec)}
              >
                {sec < 60 ? `${sec}s` : `${sec / 60}m`}
              </Badge>
            ))}
          </div>
        </div>
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
    </div>
  )
}

