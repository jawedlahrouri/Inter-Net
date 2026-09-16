import { useMemo } from 'react'
import { Search, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { STEAM_PRESETS, STEAM_CATEGORIES, type SteamPreset } from '@/config/widgetPresets'
import type { SteamMetricType } from '@/types/widget'

interface SteamPresetCatalogProps {
  selectedPresetId: SteamMetricType
  selectedCategory: string
  searchQuery: string
  onSelectCategory: (category: string) => void
  onSearchChange: (query: string) => void
  onSelectPreset: (preset: SteamPreset) => void
}

export function SteamPresetCatalog({
  selectedPresetId,
  selectedCategory,
  searchQuery,
  onSelectCategory,
  onSearchChange,
  onSelectPreset,
}: SteamPresetCatalogProps) {
  const filteredPresets = useMemo(() => {
    return STEAM_PRESETS.filter((p) => {
      const matchCategory = selectedCategory === 'Tous' || p.category === selectedCategory
      const matchQuery =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchQuery
    })
  }, [selectedCategory, searchQuery])

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-2.5 overflow-hidden">
      {/* Barre de recherche dans les presets Steam */}
      <div className="relative shrink-0">
        <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher une métrique Steam..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border/70 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Filtres par catégories */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs shrink-0 no-scrollbar">
        {STEAM_CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => onSelectCategory(cat.label)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              selectedCategory === cat.label
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span>{cat.label}</span>
            <span className="text-[9px] opacity-80">{cat.count}</span>
          </button>
        ))}
      </div>

      {/* Liste des cartes de visualisations Steam */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
        {filteredPresets.map((preset) => {
          const Icon = preset.icon
          const isSelected = selectedPresetId === preset.id
          return (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative text-left group ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-sm'
                  : 'border-border/70 bg-card hover:bg-muted/40 hover:border-border'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:text-foreground'
                }`}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-semibold text-xs text-foreground truncate">
                    {preset.title}
                  </p>
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                    {preset.category}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                  {preset.description}
                </p>
              </div>
              {isSelected && (
                <div className="absolute top-3 right-3 text-primary">
                  <Check className="size-4" />
                </div>
              )}
            </div>
          )
        })}
        {filteredPresets.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Aucune métrique Steam ne correspond à votre recherche.
          </div>
        )}
      </div>
    </div>
  )
}

