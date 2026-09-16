import { InputField } from '@/components/ui/input-field'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JsonPathPicker } from '../JsonPathPicker'
import { API_PRESETS, type ApiPreset } from '@/config/widgetPresets'

interface CustomApiParamsFormProps {
  apiUrl: string
  jsonPath: string
  displayMode: 'kpi' | 'gauge'
  unit: string
  onApiUrlChange: (url: string) => void
  onJsonPathChange: (path: string) => void
  onDisplayModeChange: (mode: 'kpi' | 'gauge') => void
  onUnitChange: (unit: string) => void
  onApplyPreset: (preset: ApiPreset) => void
  onSelectPath: (path: string, previewValue: any, suggestedMode?: 'kpi' | 'gauge') => void
}

export function CustomApiParamsForm({
  apiUrl,
  jsonPath,
  displayMode,
  unit,
  onApiUrlChange,
  onJsonPathChange,
  onDisplayModeChange,
  onUnitChange,
  onApplyPreset,
  onSelectPath,
}: CustomApiParamsFormProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground font-medium">Modèles rapides :</span>
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-muted text-xs py-1 px-2.5"
          onClick={() =>
            onApplyPreset({
              title: 'Santé Serveur Backend',
              apiUrl: 'http://127.0.0.1:8000/api/v1/health',
              refresh: 15,
              jsonPath: 'status',
              displayMode: 'kpi',
              unit: '',
            })
          }
        >
          ⚡ Santé API FastAPI
        </Badge>
        {API_PRESETS.map((preset) => (
          <Badge
            key={preset.title}
            variant="outline"
            className="cursor-pointer hover:bg-muted text-xs py-1 px-2.5"
            onClick={() => onApplyPreset(preset)}
          >
            {preset.title}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InputField
          label="URL de l'API (GET)"
          placeholder="https://api.example.com/data"
          value={apiUrl}
          onChange={(e) => onApiUrlChange(e.target.value)}
          required
        />
        <InputField
          label="Chemin JSON (Path)"
          placeholder="status ou response.data.count"
          value={jsonPath}
          onChange={(e) => onJsonPathChange(e.target.value)}
          required
        />
      </div>

      {apiUrl.trim().length > 5 && (
        <JsonPathPicker
          apiUrl={apiUrl}
          selectedPath={jsonPath}
          onSelectPath={onSelectPath}
          className="p-3 rounded-xl border border-border bg-muted/20"
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="Unité affichée (optionnelle)"
          placeholder="Ex: ms, %, €, FPS..."
          value={unit}
          onChange={(e) => onUnitChange(e.target.value)}
        />
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-foreground">Mode d'affichage</span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={displayMode === 'kpi' ? 'default' : 'outline'}
              size="sm"
              className="cursor-pointer text-xs h-9"
              onClick={() => onDisplayModeChange('kpi')}
            >
              KPI
            </Button>
            <Button
              type="button"
              variant={displayMode === 'gauge' ? 'default' : 'outline'}
              size="sm"
              className="cursor-pointer text-xs h-9"
              onClick={() => onDisplayModeChange('gauge')}
            >
              Jauge (0-100%)
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

