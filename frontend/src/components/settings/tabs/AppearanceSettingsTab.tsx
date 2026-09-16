import { useState, useRef } from 'react'
import {
  Palette,
  Moon,
  Sun,
  Laptop,
  Check,
  Image as ImageIcon,
  Upload,
  Trash2,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Info,
  Layers,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { useSettings, DEFAULT_CUSTOMIZATION, type ThemeCustomization } from '@/context/SettingsContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface AppearanceSettingsTabProps {
  theme: 'dark' | 'light' | 'system'
  onSetTheme: (theme: 'dark' | 'light' | 'system') => void
}

interface ColorPreset {
  name: string
  primary: string
  secondary: string
  tertiary: string
  description: string
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'Deep Slate & Sky',
    primary: '#0b0f19',
    secondary: '#131b2e',
    tertiary: '#38bdf8',
    description: 'Ambiance sobre et high-tech',
  },
  {
    name: 'Cyberpunk Neon',
    primary: '#090514',
    secondary: '#180d2d',
    tertiary: '#ec4899',
    description: 'Violet profond & fuchsia vibrant',
  },
  {
    name: 'Emerald Matrix',
    primary: '#02140a',
    secondary: '#072615',
    tertiary: '#10b981',
    description: 'Verte sombre hacker chic',
  },
  {
    name: 'Obsidian Gold',
    primary: '#101012',
    secondary: '#1c1c21',
    tertiary: '#f59e0b',
    description: 'Noir pur & accents dorés',
  },
  {
    name: 'Crimson Velvet',
    primary: '#14080a',
    secondary: '#241014',
    tertiary: '#f43f5e',
    description: 'Teintes rubis chaleureuses',
  },
  {
    name: 'Royal Amethyst',
    primary: '#0c0721',
    secondary: '#1a103c',
    tertiary: '#a855f7',
    description: 'Nébuleuse violette et néon',
  },
]

// Fonds pré-intégrés (abstractions et dégradés élégants)
const PRESET_BACKGROUNDS = [
  {
    name: 'Cosmic Deep',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop',
    description: 'Espace étoilé profond',
  },
  {
    name: 'Cyber Grid',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop',
    description: 'Composants & reflets numériques',
  },
  {
    name: 'Midnight Horizon',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600&auto=format&fit=crop',
    description: 'Paysage nocturne brumeux',
  },
  {
    name: 'Dark Auroras',
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?q=80&w=1600&auto=format&fit=crop',
    description: 'Aurore boréale tamisée',
  },
]

export function AppearanceSettingsTab({ theme, onSetTheme }: AppearanceSettingsTabProps) {
  const {
    customization,
    updateCustomization,
    removeBackgroundImage,
    availableBackgrounds,
    uploadBackground,
  } = useSettings()

  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [customUrlInput, setCustomUrlInput] = useState<string>('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleColorChange = (key: keyof ThemeCustomization, value: string) => {
    updateCustomization({ [key]: value })
  }

  const handleApplyPreset = (preset: ColorPreset) => {
    updateCustomization({
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      tertiary_color: preset.tertiary,
    })
  }

  const handleResetColors = () => {
    updateCustomization({
      primary_color: DEFAULT_CUSTOMIZATION.primary_color,
      secondary_color: DEFAULT_CUSTOMIZATION.secondary_color,
      tertiary_color: DEFAULT_CUSTOMIZATION.tertiary_color,
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadError(null)
    try {
      await uploadBackground(file)
    } catch (err: any) {
      setUploadError(err?.message || 'Erreur lors de l\'envoi de l\'image')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleApplyCustomUrl = () => {
    const trimmed = customUrlInput.trim()
    if (!trimmed) return
    updateCustomization({ background_image: trimmed })
    setCustomUrlInput('')
  }

  const hasBackgroundImage = Boolean(customization.background_image)

  return (
    <div className="space-y-8 max-w-4xl">
      {/* 1. Mode Thème Clair / Sombre / Système */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Palette className="size-4 text-sky-500" />
            Mode d'Affichage Global
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sélectionnez la base claire ou sombre du thème système.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Mode Sombre */}
          <div
            onClick={() => onSetTheme('dark')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-28 ${
              theme === 'dark'
                ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-sm'
                : 'border-border bg-card hover:bg-muted/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <Moon className="size-5 text-purple-400" />
              {theme === 'dark' && <Check className="size-4 text-primary" />}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">Thème Sombre</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Contraste optimisé pour faible luminosité.
              </p>
            </div>
          </div>

          {/* Mode Clair */}
          <div
            onClick={() => onSetTheme('light')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-28 ${
              theme === 'light'
                ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-sm'
                : 'border-border bg-card hover:bg-muted/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <Sun className="size-5 text-amber-500" />
              {theme === 'light' && <Check className="size-4 text-primary" />}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">Thème Clair</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Luminosité pour travail de jour.
              </p>
            </div>
          </div>

          {/* Mode Système */}
          <div
            onClick={() => onSetTheme('system')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-28 ${
              theme === 'system'
                ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-sm'
                : 'border-border bg-card hover:bg-muted/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <Laptop className="size-5 text-sky-500" />
              {theme === 'system' && <Check className="size-4 text-primary" />}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">Système (Auto)</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Suit les réglages de votre système d'exploitation.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-border/60 w-full" />

      {/* 2. Personnalisation des 3 Couleurs du Dashboard */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Palette de Couleurs Personnalisée
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choisissez précisément vos teintes primaire, secondaire et ternaire.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetColors}
            className="text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Rétablir les couleurs d'origine"
          >
            <RotateCcw className="size-3.5" />
            <span>Réinitialiser</span>
          </Button>
        </div>

        {/* 3 Cartes de sélection des couleurs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Couleur Primaire */}
          <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span
                  className="size-3 rounded-full border border-white/20 shadow-xs"
                  style={{ backgroundColor: customization.primary_color }}
                />
                Couleur Primaire
              </span>
              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                {customization.primary_color.toUpperCase()}
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Arrière-plan par défaut du dashboard si aucune image n'est choisie.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <label
                className="size-9 rounded-lg border border-border cursor-pointer shadow-xs shrink-0 flex items-center justify-center relative overflow-hidden transition-transform hover:scale-105"
                style={{ backgroundColor: customization.primary_color }}
                title="Cliquez pour ouvrir la palette"
              >
                <input
                  type="color"
                  value={customization.primary_color}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
              <Input
                type="text"
                value={customization.primary_color}
                onChange={(e) => handleColorChange('primary_color', e.target.value)}
                className="h-9 font-mono text-xs uppercase"
                placeholder="#0B0F19"
                maxLength={9}
              />
            </div>
          </div>

          {/* Couleur Secondaire */}
          <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span
                  className="size-3 rounded-full border border-white/20 shadow-xs"
                  style={{ backgroundColor: customization.secondary_color }}
                />
                Couleur Secondaire
              </span>
              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                {customization.secondary_color.toUpperCase()}
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Couleur appliquée aux conteneurs de widgets et surfaces des cartes.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <label
                className="size-9 rounded-lg border border-border cursor-pointer shadow-xs shrink-0 flex items-center justify-center relative overflow-hidden transition-transform hover:scale-105"
                style={{ backgroundColor: customization.secondary_color }}
                title="Cliquez pour ouvrir la palette"
              >
                <input
                  type="color"
                  value={customization.secondary_color}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
              <Input
                type="text"
                value={customization.secondary_color}
                onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                className="h-9 font-mono text-xs uppercase"
                placeholder="#131B2E"
                maxLength={9}
              />
            </div>
          </div>

          {/* Couleur Ternaire */}
          <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span
                  className="size-3 rounded-full border border-white/20 shadow-xs"
                  style={{ backgroundColor: customization.tertiary_color }}
                />
                Couleur Ternaire
              </span>
              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                {customization.tertiary_color.toUpperCase()}
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Couleur d'accent pour les badges, indicateurs et bordures actives.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <label
                className="size-9 rounded-lg border border-border cursor-pointer shadow-xs shrink-0 flex items-center justify-center relative overflow-hidden transition-transform hover:scale-105"
                style={{ backgroundColor: customization.tertiary_color }}
                title="Cliquez pour ouvrir la palette"
              >
                <input
                  type="color"
                  value={customization.tertiary_color}
                  onChange={(e) => handleColorChange('tertiary_color', e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
              <Input
                type="text"
                value={customization.tertiary_color}
                onChange={(e) => handleColorChange('tertiary_color', e.target.value)}
                className="h-9 font-mono text-xs uppercase"
                placeholder="#38BDF8"
                maxLength={9}
              />
            </div>
          </div>
        </div>

        {/* Palettes thématiques en 1 clic */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-medium text-muted-foreground">Palettes prêtes à l'emploi :</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="p-2.5 rounded-lg border border-border bg-card hover:bg-muted/40 transition-all flex flex-col gap-1.5 text-left cursor-pointer group hover:border-primary/50"
              >
                <div className="flex items-center gap-1">
                  <span className="size-3.5 rounded-full border border-black/20" style={{ backgroundColor: preset.primary }} />
                  <span className="size-3.5 rounded-full border border-black/20" style={{ backgroundColor: preset.secondary }} />
                  <span className="size-3.5 rounded-full border border-black/20" style={{ backgroundColor: preset.tertiary }} />
                </div>
                <span className="text-[11px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px bg-border/60 w-full" />

      {/* 3. Gestion de l'Image de Fond du Dashboard */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <ImageIcon className="size-4 text-emerald-500" />
            Image de Fond du Dashboard
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personnalisez l'arrière-plan de votre dashboard. Si aucune image n'est choisie, la <strong className="text-foreground font-semibold">couleur primaire</strong> sera automatiquement appliquée en fond.
          </p>
        </div>

        {/* État actuel du fond */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="size-12 rounded-lg border border-border overflow-hidden shrink-0 flex items-center justify-center relative shadow-sm"
              style={
                hasBackgroundImage
                  ? {
                      backgroundImage: `url("${customization.background_image}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {
                      backgroundColor: customization.primary_color,
                    }
              }
            >
              {!hasBackgroundImage && (
                <div className="size-3 rounded-full border border-white/40 shadow-xs" style={{ backgroundColor: customization.primary_color }} />
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {hasBackgroundImage ? 'Image personnalisée active' : 'Arrière-plan couleur primaire'}
                </span>
                <Badge
                  variant={hasBackgroundImage ? 'default' : 'secondary'}
                  className="text-[10px] px-1.5 py-0"
                >
                  {hasBackgroundImage ? 'Image de fond' : 'Couleur primaire'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground max-w-md truncate">
                {hasBackgroundImage
                  ? customization.background_image
                  : `Aucune image définie — La couleur primaire (${customization.primary_color}) sert d'arrière-plan.`}
              </p>
            </div>
          </div>

          {hasBackgroundImage && (
            <Button
              variant="destructive"
              size="sm"
              onClick={removeBackgroundImage}
              className="text-xs gap-1.5 h-8 shrink-0 cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Retirer l'image (Fond couleur primaire)</span>
            </Button>
          )}
        </div>

        {/* Actions d'ajout / sélection d'image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upload de fichier local */}
          <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Upload className="size-3.5 text-primary" />
                Uploader depuis votre ordinateur
              </span>
              <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP (max 15 Mo)</span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Téléversez votre propre image ou fond d'écran haute résolution.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                onChange={handleFileUpload}
                className="hidden"
                id="bg-upload-input"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full gap-2 text-xs h-9 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Téléversement en cours...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" />
                    <span>Choisir une image locale</span>
                  </>
                )}
              </Button>
            </div>
            {uploadError && (
              <p className="text-[11px] text-rose-500">{uploadError}</p>
            )}
          </div>

          {/* Saisie d'une URL d'image */}
          <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <LinkIcon className="size-3.5 text-primary" />
                URL d'image directe
              </span>
              <span className="text-[10px] text-muted-foreground">Lien HTTPS web</span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Collez un lien d'image direct (ex. Unsplash, Wallpaper).
            </p>

            <div className="flex items-center gap-2 pt-1">
              <Input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="h-9 text-xs"
              />
              <Button
                variant="default"
                size="sm"
                onClick={handleApplyCustomUrl}
                disabled={!customUrlInput.trim()}
                className="h-9 px-3 text-xs shrink-0 cursor-pointer"
              >
                Appliquer
              </Button>
            </div>
          </div>
        </div>

        {/* Galerie de presets de fonds d'écran */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Layers className="size-3.5" />
            Galerie de fonds d'écran prêts à l'emploi :
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRESET_BACKGROUNDS.map((preset) => {
              const isSelected = customization.background_image === preset.url
              return (
                <div
                  key={preset.name}
                  onClick={() => updateCustomization({ background_image: preset.url })}
                  className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all h-24 flex flex-col justify-end p-2.5 ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary shadow-md'
                      : 'border-border/80 hover:border-border hover:shadow-sm'
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%), url("${preset.url}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                  )}
                  <span className="text-xs font-semibold text-white drop-shadow-sm truncate">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-white/70 drop-shadow-sm truncate">
                    {preset.description}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Images uploadées par l'utilisateur si existantes */}
        {availableBackgrounds.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-medium text-muted-foreground">Vos fonds téléversés :</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {availableBackgrounds.map((bg) => {
                const isSelected = customization.background_image === bg.url
                return (
                  <div
                    key={bg.id}
                    onClick={() => updateCustomization({ background_image: bg.url })}
                    className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all h-24 flex flex-col justify-end p-2.5 ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary shadow-md'
                        : 'border-border/80 hover:border-border hover:shadow-sm'
                    }`}
                    style={{
                      backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%), url("${bg.url}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                        <CheckCircle2 className="size-3.5" />
                      </div>
                    )}
                    <span className="text-xs font-semibold text-white drop-shadow-sm truncate">
                      {bg.name}
                    </span>
                    <span className="text-[10px] text-white/70 drop-shadow-sm truncate">
                      {(bg.size / 1024).toFixed(0)} Ko
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-border/60 w-full" />

      {/* 4. Aperçu en Direct (Live Preview) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Info className="size-4 text-sky-500" />
            Aperçu en Direct de Votre Dashboard
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {hasBackgroundImage
              ? 'Rendu avec image de fond'
              : `Rendu avec fond couleur primaire (${customization.primary_color})`}
          </span>
        </div>

        {/* Mini simulateur de dashboard */}
        <div
          className="w-full rounded-2xl border border-border p-6 shadow-md transition-all relative overflow-hidden min-h-[220px] flex flex-col justify-between"
          style={
            hasBackgroundImage
              ? {
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.6)), url("${customization.background_image}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {
                  backgroundColor: customization.primary_color,
                }
          }
        >
          {/* Faux header du dashboard */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">
                INTER-NET
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white shadow-xs"
                style={{ backgroundColor: customization.tertiary_color }}
              >
                Dashboard Live
              </span>
            </div>
            <div className="text-[11px] text-white/80 font-mono">
              {!hasBackgroundImage && 'Fond = Couleur primaire'}
            </div>
          </div>

          {/* Fausses cartes de widgets habillées avec la couleur secondaire et accents ternaires */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 my-4">
            {/* Widget 1 */}
            <div
              className="p-3.5 rounded-xl border transition-all shadow-sm flex flex-col justify-between"
              style={{
                backgroundColor: customization.secondary_color,
                borderColor: `${customization.tertiary_color}44`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Météo Paris</span>
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: customization.tertiary_color }}
                />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">21°C</span>
                <span className="text-[11px] text-white/70">Ensoleillé</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ backgroundColor: customization.tertiary_color, width: '70%' }}
                />
              </div>
            </div>

            {/* Widget 2 */}
            <div
              className="p-3.5 rounded-xl border transition-all shadow-sm flex flex-col justify-between"
              style={{
                backgroundColor: customization.secondary_color,
                borderColor: `${customization.tertiary_color}44`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Steam Gaming</span>
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: customization.tertiary_color }}
                />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">42h</span>
                <span className="text-[11px] text-white/70">Dernières semaines</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ backgroundColor: customization.tertiary_color, width: '45%' }}
                />
              </div>
            </div>

            {/* Widget 3 */}
            <div
              className="hidden md:flex p-3.5 rounded-xl border transition-all shadow-sm flex-col justify-between"
              style={{
                backgroundColor: customization.secondary_color,
                borderColor: `${customization.tertiary_color}44`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Activité GitHub</span>
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: customization.tertiary_color }}
                />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">12</span>
                <span className="text-[11px] text-white/70">Commits aujourd'hui</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ backgroundColor: customization.tertiary_color, width: '85%' }}
                />
              </div>
            </div>
          </div>

          <div className="text-[11px] text-white/70 text-right">
            Surfaces widgets = <strong className="text-white">{customization.secondary_color}</strong> • Accents = <strong className="text-white">{customization.tertiary_color}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppearanceSettingsTab


