import { useState, useEffect, useRef } from 'react'
import {
  Palette,
  Image as ImageIcon,
  Upload,
  Trash2,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Layers,
  CheckCircle2,
  Loader2,
  Info,
  Music,
  Play,
  Pause,
  Radio,
} from 'lucide-react'
import {
  useSettings,
  DEFAULT_CUSTOMIZATION,
  type DashboardPageInfo,
  type ThemeCustomization,
} from '@/context/SettingsContext'
import { MUSIC_PRESETS, type MusicPreset } from '@/config/musicPresets'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface CustomizePageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetDashboard: DashboardPageInfo | null
}

interface ColorPreset {
  name: string
  primary: string
  secondary: string
  tertiary: string
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'Deep Slate & Sky',
    primary: '#0b0f19',
    secondary: '#131b2e',
    tertiary: '#38bdf8',
  },
  {
    name: 'Cyberpunk Neon',
    primary: '#090514',
    secondary: '#180d2d',
    tertiary: '#ec4899',
  },
  {
    name: 'Emerald Matrix',
    primary: '#02140a',
    secondary: '#072615',
    tertiary: '#10b981',
  },
  {
    name: 'Obsidian Gold',
    primary: '#101012',
    secondary: '#1c1c21',
    tertiary: '#f59e0b',
  },
  {
    name: 'Crimson Velvet',
    primary: '#14080a',
    secondary: '#241014',
    tertiary: '#f43f5e',
  },
  {
    name: 'Royal Amethyst',
    primary: '#0c0721',
    secondary: '#1a103c',
    tertiary: '#a855f7',
  },
]

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

/**
 * @brief Renders the dialog for customizing a dashboard page's colors, background image and background music.
 * @param open Whether the dialog is currently visible.
 * @param onOpenChange Callback invoked with the new open state when the dialog is opened or closed.
 * @param targetDashboard Dashboard page being customized (colors, background, music), or null to render nothing.
 * @return A dialog with color presets, background and music pickers, upload controls and a save button, or null without a target dashboard.
 */
export function CustomizePageDialog({
  open,
  onOpenChange,
  targetDashboard,
}: CustomizePageDialogProps) {
  const {
    updateDashboardCustomization,
    uploadBackgroundForDashboard,
    uploadMusicForDashboard,
    availableBackgrounds,
    availableMusic,
  } = useSettings()

  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_CUSTOMIZATION.primary_color)
  const [secondaryColor, setSecondaryColor] = useState<string>(DEFAULT_CUSTOMIZATION.secondary_color)
  const [tertiaryColor, setTertiaryColor] = useState<string>(DEFAULT_CUSTOMIZATION.tertiary_color)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [backgroundMusic, setBackgroundMusic] = useState<string | null>(null)
  const [backgroundMusicName, setBackgroundMusicName] = useState<string | null>(null)

  const [customUrlInput, setCustomUrlInput] = useState<string>('')
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [customMusicUrlInput, setCustomMusicUrlInput] = useState<string>('')
  const [isUploadingMusic, setIsUploadingMusic] = useState<boolean>(false)
  const [musicUploadError, setMusicUploadError] = useState<string | null>(null)
  const musicFileInputRef = useRef<HTMLInputElement>(null)

  const [previewingTrackUrl, setPreviewingTrackUrl] = useState<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (targetDashboard) {
      setPrimaryColor(targetDashboard.primary_color || DEFAULT_CUSTOMIZATION.primary_color)
      setSecondaryColor(targetDashboard.secondary_color || DEFAULT_CUSTOMIZATION.secondary_color)
      setTertiaryColor(targetDashboard.tertiary_color || DEFAULT_CUSTOMIZATION.tertiary_color)
      setBackgroundImage(targetDashboard.background_image ?? null)
      setBackgroundMusic(targetDashboard.background_music ?? null)
      setBackgroundMusicName(targetDashboard.background_music_name ?? null)
      setCustomUrlInput('')
      setCustomMusicUrlInput('')
      setUploadError(null)
      setMusicUploadError(null)
    }

    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }
      setPreviewingTrackUrl(null)
    }
  }, [targetDashboard, open])

  if (!targetDashboard) return null

  /**
   * @brief Applies the primary, secondary and tertiary colors of a color preset to the local form state.
   * @param preset The color preset whose three colors are applied.
   */
  const handleApplyPreset = (preset: ColorPreset) => {
    setPrimaryColor(preset.primary)
    setSecondaryColor(preset.secondary)
    setTertiaryColor(preset.tertiary)
  }

  /**
   * @brief Resets colors to the default customization and clears the background image and music in the local form state.
   */
  const handleReset = () => {
    setPrimaryColor(DEFAULT_CUSTOMIZATION.primary_color)
    setSecondaryColor(DEFAULT_CUSTOMIZATION.secondary_color)
    setTertiaryColor(DEFAULT_CUSTOMIZATION.tertiary_color)
    setBackgroundImage(null)
    setBackgroundMusic(null)
    setBackgroundMusicName(null)
  }

  /**
   * @brief Uploads the chosen image file as the dashboard background and stores its URL, tracking loading and error state.
   * @param e The change event of the file input holding the selected image.
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadError(null)
    try {
      const uploaded = await uploadBackgroundForDashboard(targetDashboard.id, file)
      setBackgroundImage(uploaded.url)
    } catch (err: any) {
      setUploadError(err?.message || "Erreur lors de l'envoi de l'image")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  /**
   * @brief Uploads the chosen audio file as the dashboard background music and stores its URL and name, tracking loading and error state.
   * @param e The change event of the file input holding the selected audio file.
   */
  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingMusic(true)
    setMusicUploadError(null)
    try {
      const uploaded = await uploadMusicForDashboard(targetDashboard.id, file)
      setBackgroundMusic(uploaded.url)
      setBackgroundMusicName(uploaded.name)
    } catch (err: any) {
      setMusicUploadError(err?.message || "Erreur lors de l'envoi du fichier audio")
    } finally {
      setIsUploadingMusic(false)
      if (musicFileInputRef.current) musicFileInputRef.current.value = ''
    }
  }

  /**
   * @brief Sets the trimmed custom URL input as the background image and clears the input.
   */
  const handleApplyUrl = () => {
    const trimmed = customUrlInput.trim()
    if (!trimmed) return
    setBackgroundImage(trimmed)
    setCustomUrlInput('')
  }

  /**
   * @brief Sets the trimmed custom audio URL input as the background music with a generic name and clears the input.
   */
  const handleApplyMusicUrl = () => {
    const trimmed = customMusicUrlInput.trim()
    if (!trimmed) return
    setBackgroundMusic(trimmed)
    setBackgroundMusicName('Flux audio personnalisé')
    setCustomMusicUrlInput('')
  }

  /**
   * @brief Starts or stops a preview playback of a music track using a shared audio element.
   * @param url The audio URL to preview or stop if it is already playing.
   */
  const handleTogglePreview = (url: string) => {
    if (previewingTrackUrl === url) {
      previewAudioRef.current?.pause()
      setPreviewingTrackUrl(null)
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio()
      }
      previewAudioRef.current.src = url
      previewAudioRef.current.volume = 0.5
      previewAudioRef.current.play().catch(() => {})
      setPreviewingTrackUrl(url)
    }
  }

  /**
   * @brief Stops any preview audio, saves the chosen colors, background and music to the dashboard, and closes the dialog.
   */
  const handleSave = async () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    const updates: Partial<ThemeCustomization> = {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      tertiary_color: tertiaryColor,
      background_image: backgroundImage,
      background_music: backgroundMusic,
      background_music_name: backgroundMusicName,
    }
    await updateDashboardCustomization(targetDashboard.id, updates)
    onOpenChange(false)
  }

  const hasBg = Boolean(backgroundImage)
  const hasMusic = Boolean(backgroundMusic)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Palette className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Personnaliser la page « {targetDashboard.name} »
              </DialogTitle>
              <DialogDescription className="text-xs">
                Modifiez les couleurs et l'image de fond spécifiques à cette page.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Couleurs de la page
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Valeurs par défaut</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">Primaire</span>
                  <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                    {primaryColor.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Fond de page si aucune image n'est définie.
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <label
                    className="size-8 rounded-md border border-border cursor-pointer shrink-0 relative overflow-hidden transition-transform hover:scale-105"
                    style={{ backgroundColor: primaryColor }}
                    title="Choisir la couleur primaire"
                  >
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-8 font-mono text-[11px] uppercase"
                    maxLength={9}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">Secondaire</span>
                  <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                    {secondaryColor.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Surfaces et cartes des widgets.
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <label
                    className="size-8 rounded-md border border-border cursor-pointer shrink-0 relative overflow-hidden transition-transform hover:scale-105"
                    style={{ backgroundColor: secondaryColor }}
                    title="Choisir la couleur secondaire"
                  >
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>
                  <Input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-8 font-mono text-[11px] uppercase"
                    maxLength={9}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">Ternaire</span>
                  <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                    {tertiaryColor.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Accents, badges et bordures.
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <label
                    className="size-8 rounded-md border border-border cursor-pointer shrink-0 relative overflow-hidden transition-transform hover:scale-105"
                    style={{ backgroundColor: tertiaryColor }}
                    title="Choisir la couleur ternaire"
                  >
                    <input
                      type="color"
                      value={tertiaryColor}
                      onChange={(e) => setTertiaryColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>
                  <Input
                    type="text"
                    value={tertiaryColor}
                    onChange={(e) => setTertiaryColor(e.target.value)}
                    className="h-8 font-mono text-[11px] uppercase"
                    maxLength={9}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-medium text-muted-foreground">Palettes prêtes à l'emploi :</span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-1.5 rounded-md border border-border bg-card hover:bg-muted/40 transition-all flex flex-col gap-1 text-left cursor-pointer group hover:border-primary/50"
                  >
                    <div className="flex items-center gap-1">
                      <span className="size-2.5 rounded-full border border-black/20" style={{ backgroundColor: preset.primary }} />
                      <span className="size-2.5 rounded-full border border-black/20" style={{ backgroundColor: preset.secondary }} />
                      <span className="size-2.5 rounded-full border border-black/20" style={{ backgroundColor: preset.tertiary }} />
                    </div>
                    <span className="text-[10px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-border/60 w-full" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ImageIcon className="size-3.5 text-emerald-500" />
                Image de fond de cette page
              </span>
              <span className="text-[10px] text-muted-foreground">
                {hasBg ? 'Image active' : 'Fond = Couleur primaire'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="size-10 rounded-md border border-border overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs"
                  style={
                    hasBg
                      ? {
                          backgroundImage: `url("${backgroundImage}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : {
                          backgroundColor: primaryColor,
                        }
                  }
                />
                <div className="min-w-0">
                  <span className="text-xs font-medium text-foreground block truncate">
                    {hasBg ? 'Image personnalisée' : 'Arrière-plan couleur primaire'}
                  </span>
                  <span className="text-[10px] text-muted-foreground block truncate">
                    {hasBg ? backgroundImage : `Sans image : fond défini par ${primaryColor}`}
                  </span>
                </div>
              </div>

              {hasBg && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBackgroundImage(null)}
                  className="h-7 text-[11px] gap-1 px-2.5 cursor-pointer shrink-0"
                >
                  <Trash2 className="size-3" />
                  <span>Retirer l'image</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full h-8 text-xs gap-1.5 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Téléversement...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="size-3.5 text-primary" />
                      <span>Téléverser une image</span>
                    </>
                  )}
                </Button>
                {uploadError && <p className="text-[10px] text-rose-500">{uploadError}</p>}
              </div>

              <div className="flex items-center gap-1.5">
                <Input
                  type="url"
                  placeholder="URL d'image https://..."
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleApplyUrl}
                  disabled={!customUrlInput.trim()}
                  className="h-8 px-2.5 text-xs shrink-0 cursor-pointer"
                >
                  Lier
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Layers className="size-3" />
                Fonds suggérés :
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_BACKGROUNDS.map((preset) => {
                  const isSelected = backgroundImage === preset.url
                  return (
                    <div
                      key={preset.name}
                      onClick={() => setBackgroundImage(preset.url)}
                      className={`group relative rounded-lg border overflow-hidden cursor-pointer transition-all h-16 flex flex-col justify-end p-1.5 ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary shadow-xs'
                          : 'border-border/80 hover:border-border'
                      }`}
                      style={{
                        backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%), url("${preset.url}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                          <CheckCircle2 className="size-3" />
                        </div>
                      )}
                      <span className="text-[10px] font-semibold text-white truncate drop-shadow-xs">
                        {preset.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="h-px bg-border/60 w-full" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Music className="size-3.5 text-purple-500" />
                Musique d'ambiance de cette page
              </span>
              <span className="text-[10px] text-muted-foreground">
                {hasMusic ? 'Musique active' : 'Aucune musique (silence)'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-10 rounded-md border border-border bg-card flex items-center justify-center shrink-0 text-purple-400">
                  <Music className="size-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-foreground block truncate">
                    {hasMusic ? (backgroundMusicName || 'Piste audio active') : 'Aucune musique configurée'}
                  </span>
                  <span className="text-[10px] text-muted-foreground block truncate">
                    {hasMusic ? backgroundMusic : 'La page restera silencieuse sans musique de fond.'}
                  </span>
                </div>
              </div>

              {hasMusic && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setBackgroundMusic(null)
                    setBackgroundMusicName(null)
                  }}
                  className="h-7 text-[11px] gap-1 px-2.5 cursor-pointer shrink-0"
                >
                  <Trash2 className="size-3" />
                  <span>Retirer la musique</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <input
                  ref={musicFileInputRef}
                  type="file"
                  accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/aac,audio/flac,audio/mpeg"
                  onChange={handleMusicUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => musicFileInputRef.current?.click()}
                  disabled={isUploadingMusic}
                  className="w-full h-8 text-xs gap-1.5 cursor-pointer"
                >
                  {isUploadingMusic ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Téléversement audio...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="size-3.5 text-purple-400" />
                      <span>Importer un fichier audio</span>
                    </>
                  )}
                </Button>
                {musicUploadError && <p className="text-[10px] text-rose-500">{musicUploadError}</p>}
              </div>

              <div className="flex items-center gap-1.5">
                <Input
                  type="url"
                  placeholder="URL audio HTTPS https://..."
                  value={customMusicUrlInput}
                  onChange={(e) => setCustomMusicUrlInput(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleApplyMusicUrl}
                  disabled={!customMusicUrlInput.trim()}
                  className="h-8 px-2.5 text-xs shrink-0 cursor-pointer"
                >
                  Lier
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Radio className="size-3" />
                Morceaux suggérés (avec aperçu audio) :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MUSIC_PRESETS.map((preset) => {
                  const isSelected = backgroundMusic === preset.url
                  const isPreviewing = previewingTrackUrl === preset.url
                  return (
                    <div
                      key={preset.id}
                      className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-xs'
                          : 'border-border/80 bg-card hover:border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePreview(preset.url)}
                          className={`size-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                            isPreviewing
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80 text-foreground'
                          }`}
                          title={isPreviewing ? 'Arrêter l’écoute' : 'Écouter un extrait'}
                        >
                          {isPreviewing ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5" />}
                        </button>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-foreground block truncate">
                            {preset.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate">
                            {preset.genre} • {preset.artist}
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setBackgroundMusic(preset.url)
                          setBackgroundMusicName(preset.title)
                        }}
                        className="h-6 text-[10px] px-2 cursor-pointer shrink-0"
                      >
                        {isSelected ? 'Sélectionné' : 'Choisir'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="h-px bg-border/60 w-full" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Info className="size-3.5 text-sky-500" />
                Aperçu du rendu pour « {targetDashboard.name} »
              </span>
              <span className="text-[10px] text-muted-foreground">
                {hasBg ? 'Fond image' : `Fond = ${primaryColor}`}
              </span>
            </div>

            <div
              className="w-full rounded-xl border border-border p-4 transition-all relative overflow-hidden min-h-[140px] flex flex-col justify-between shadow-xs"
              style={
                hasBg
                  ? {
                      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url("${backgroundImage}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {
                      backgroundColor: primaryColor,
                    }
              }
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-mono text-[10px] font-bold text-white tracking-wider uppercase">
                  {targetDashboard.name}
                </span>
                <span
                  className="text-[9px] px-2 py-0.2 rounded-full font-medium text-white"
                  style={{ backgroundColor: tertiaryColor }}
                >
                  Page Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 my-2">
                <div
                  className="p-2.5 rounded-lg border shadow-xs flex flex-col justify-between"
                  style={{
                    backgroundColor: secondaryColor,
                    borderColor: `${tertiaryColor}44`,
                  }}
                >
                  <span className="text-[10px] font-semibold text-white">Météo</span>
                  <span className="text-sm font-bold text-white mt-1">21°C</span>
                  <div className="w-full bg-white/10 h-1 rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full" style={{ backgroundColor: tertiaryColor, width: '65%' }} />
                  </div>
                </div>

                <div
                  className="p-2.5 rounded-lg border shadow-xs flex flex-col justify-between"
                  style={{
                    backgroundColor: secondaryColor,
                    borderColor: `${tertiaryColor}44`,
                  }}
                >
                  <span className="text-[10px] font-semibold text-white">Activité</span>
                  <span className="text-sm font-bold text-white mt-1">42h</span>
                  <div className="w-full bg-white/10 h-1 rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full" style={{ backgroundColor: tertiaryColor, width: '80%' }} />
                  </div>
                </div>
              </div>

              <span className="text-[9px] text-white/70 text-right">
                Cartes = <strong className="text-white">{secondaryColor}</strong> • Accents = <strong className="text-white">{tertiaryColor}</strong>
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSave}
            className="text-xs font-semibold"
          >
            Enregistrer pour cette page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
