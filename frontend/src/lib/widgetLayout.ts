export interface DimensionOption {
  value: number
  label: string
  shortLabel: string
  description: string
}

export const WIDGET_WIDTH_OPTIONS: DimensionOption[] = [
  {
    value: 1,
    label: '1 colonne',
    shortLabel: '1x',
    description: 'Format compact standard',
  },
  {
    value: 2,
    label: '2 colonnes',
    shortLabel: '2x',
    description: 'Format double / bannière',
  },
  {
    value: 3,
    label: '3 colonnes',
    shortLabel: '3x',
    description: 'Format large panoramique',
  },
  {
    value: 4,
    label: '4 colonnes',
    shortLabel: '4x',
    description: 'Format étendu',
  },
  {
    value: 6,
    label: 'Pleine largeur',
    shortLabel: 'Full',
    description: 'Occupe toute la largeur disponible',
  },
]

export const WIDGET_HEIGHT_OPTIONS: DimensionOption[] = [
  {
    value: 1,
    label: '1 ligne',
    shortLabel: '1y',
    description: 'Hauteur standard (~300px)',
  },
  {
    value: 2,
    label: '2 lignes',
    shortLabel: '2y',
    description: 'Hauteur double (~620px)',
  },
  {
    value: 3,
    label: '3 lignes',
    shortLabel: '3y',
    description: 'Hauteur triple (~940px)',
  },
]

export interface SizePreset {
  name: string
  width: number
  height: number
  iconDesc: string
}

export const WIDGET_SIZE_PRESETS: SizePreset[] = [
  { name: 'Standard (1×1)', width: 1, height: 1, iconDesc: 'Carré 1×1' },
  { name: 'Bannière (2×1)', width: 2, height: 1, iconDesc: 'Large 2×1' },
  { name: 'Grand bloc (2×2)', width: 2, height: 2, iconDesc: 'Carré 2×2' },
  { name: 'Panoramique (3×1)', width: 3, height: 1, iconDesc: 'Large 3×1' },
  { name: 'Grand panneau (3×2)', width: 3, height: 2, iconDesc: 'Grand 3×2' },
  { name: 'Plein écran (Full×1)', width: 6, height: 1, iconDesc: 'Barre Full' },
]

export function getWidgetSpanClasses(width: number = 1, height: number = 1): string {
  const w = Math.min(Math.max(width || 1, 1), 6)
  const h = Math.min(Math.max(height || 1, 1), 3)

  const widthClasses: Record<number, string> = {
    1: 'col-span-1',
    2: 'col-span-1 sm:col-span-2',
    3: 'col-span-1 sm:col-span-2 md:col-span-3',
    4: 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4',
    5: 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5',
    6: 'col-span-full',
  }

  const heightClasses: Record<number, string> = {
    1: 'row-span-1 min-h-[300px]',
    2: 'row-span-1 sm:row-span-2 min-h-[300px] sm:min-h-[624px]',
    3: 'row-span-1 sm:row-span-3 min-h-[300px] sm:min-h-[948px]',
  }

  return `${widthClasses[w] || 'col-span-1'} ${heightClasses[h] || 'row-span-1 min-h-[300px]'}`
}
