import { useState, useRef } from 'react'
import {
  Sparkles,
  Video,
  Play,
  RotateCcw,
  Upload,
  Link2,
  Volume2,
  VolumeX,
  Check,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { VideoInfo, UserSettings } from '@/context/SettingsContext'

interface AmbianceSettingsTabProps {
  isVideoEnabled: boolean
  isSoundEnabled: boolean
  currentVideoUrl: string
  availableVideos: VideoInfo[]
  onUpdateMeditationSettings: (updates: Partial<UserSettings['meditation']>) => Promise<void>
  onUploadVideo: (file: File) => Promise<VideoInfo>
  onLaunchMeditation?: () => void
}

/**
 * @brief Renders the settings tab for meditation ambiance, letting users toggle video and sound and choose or upload a background video.
 * @param isVideoEnabled Whether the meditation background video is turned on.
 * @param isSoundEnabled Whether the meditation video sound is turned on.
 * @param currentVideoUrl URL of the video currently selected as meditation background.
 * @param availableVideos Catalog of videos the user can pick as background.
 * @param onUpdateMeditationSettings Async callback that saves partial meditation settings changes.
 * @param onUploadVideo Async callback that uploads a video file and returns its video info.
 * @param onLaunchMeditation Optional callback that starts the meditation session.
 * @return A settings panel with toggles, a video catalog, custom URL and file upload inputs, and reset and launch buttons.
 */
export function AmbianceSettingsTab({
  isVideoEnabled,
  isSoundEnabled,
  currentVideoUrl,
  availableVideos,
  onUpdateMeditationSettings,
  onUploadVideo,
  onLaunchMeditation,
}: AmbianceSettingsTabProps) {
  const [customUrl, setCustomUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * @brief Saves the chosen video URL as the meditation background video.
   * @param videoUrl URL of the video the user selected.
   */
  const handleSelectVideo = async (videoUrl: string) => {
    await onUpdateMeditationSettings({ video_url: videoUrl })
  }

  /**
   * @brief Saves the trimmed custom video URL as the meditation background video and clears the input.
   * @param e Form submit event whose default browser submission is prevented.
   */
  const handleCustomUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customUrl.trim()) return
    await onUpdateMeditationSettings({ video_url: customUrl.trim() })
    setCustomUrl('')
  }

  /**
   * @brief Uploads the selected video file, applies it as the meditation video, and tracks upload and error state.
   * @param e File input change event carrying the file chosen by the user.
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      setUploadError(null)
      const uploaded = await onUploadVideo(file)
      await onUpdateMeditationSettings({ video_url: uploaded.url })
    } catch (err: any) {
      setUploadError(err.message || 'Erreur lors du téléversement.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  /**
   * @brief Resets the meditation settings to the default video with video and sound enabled.
   */
  const handleResetToDefault = async () => {
    await onUpdateMeditationSettings({
      video_enabled: true,
      video_url: '/custom_vids/la_peace.mp4',
      sound_enabled: true,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          Ambiance & Pause Méditation
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Personnalisez l'expérience visuelle et sonore de vos pauses méditatives.
        </p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
        <div className="space-y-0.5 pr-4">
          <div className="flex items-center gap-2">
            <Video className="size-4 text-foreground" />
            <Label className="text-xs font-semibold text-foreground cursor-pointer">
              Vidéo d'arrière-plan immersive
            </Label>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Affiche une vidéo en fond continu derrière la citation lors du lancement d'une pause méditation.
          </p>
        </div>
        <Switch
          checked={isVideoEnabled}
          onCheckedChange={(checked) =>
            onUpdateMeditationSettings({ video_enabled: checked })
          }
        />
      </div>

      {isVideoEnabled && (
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Galerie de vidéos d'ambiance
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Sélectionnez une boucle vidéo ou ajoutez la vôtre.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetToDefault}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
              >
                <RotateCcw className="size-3" />
                Réinitialiser (La Peace)
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableVideos.map((vid) => {
                const isSelected =
                  currentVideoUrl === vid.url ||
                  currentVideoUrl.endsWith(vid.filename)
                return (
                  <div
                    key={vid.id}
                    onClick={() => handleSelectVideo(vid.url)}
                    className={`relative flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-xs'
                        : 'border-border/60 hover:border-border bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="size-7 rounded bg-muted flex items-center justify-center shrink-0">
                        <Play className="size-3 text-muted-foreground" />
                      </div>
                      <div className="truncate">
                        <p className="font-medium text-foreground truncate">
                          {vid.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {vid.filename === 'la_peace.mp4' ? 'Officielle (CrabeCorp)' : vid.filename}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                        <Check className="size-2.5" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="video/mp4,video/webm,video/ogg"
                  className="hidden"
                  id="video-upload-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs gap-1.5 h-8 cursor-pointer shrink-0"
                >
                  <Upload className="size-3.5" />
                  {isUploading ? 'Téléversement...' : 'Téléverser une vidéo (.mp4)'}
                </Button>

                <form onSubmit={handleCustomUrlSubmit} className="flex-1 flex gap-1.5">
                  <div className="relative flex-1">
                    <Link2 className="size-3 text-muted-foreground absolute left-2.5 top-2.5" />
                    <Input
                      type="url"
                      placeholder="Ou URL directe (.mp4)..."
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="text-xs h-8 pl-8 font-mono"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={!customUrl.trim()}
                    className="h-8 text-xs cursor-pointer"
                  >
                    Appliquer
                  </Button>
                </form>
              </div>

              {uploadError && (
                <p className="text-destructive text-[11px] font-mono">{uploadError}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  {isSoundEnabled ? (
                    <Volume2 className="size-3.5 text-foreground/80" />
                  ) : (
                    <VolumeX className="size-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium text-foreground">
                    Piste audio de la vidéo
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Diffuser le son de fond pendant vos séances de méditation.
                </p>
              </div>
              <Switch
                checked={isSoundEnabled}
                onCheckedChange={(checked) =>
                  onUpdateMeditationSettings({ sound_enabled: checked })
                }
              />
            </div>

            <div className="space-y-1.5 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Aperçu de la vidéo active</span>
                <Badge variant="outline" className="text-[10px] font-mono py-0">
                  {currentVideoUrl}
                </Badge>
              </div>
              <div className="relative h-44 w-full rounded-xl overflow-hidden bg-black/80 border border-border shadow-inner">
                <video
                  key={currentVideoUrl}
                  src={currentVideoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 p-4 text-center">
                  <p className="text-white/90 text-sm font-serif italic drop-shadow-md">
                    « Prenez une grande inspiration et recentrez-vous. »
                  </p>
                  {onLaunchMeditation && (
                    <Button
                      size="sm"
                      onClick={onLaunchMeditation}
                      className="mt-3 text-xs gap-1.5 cursor-pointer bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20"
                    >
                      <Sparkles className="size-3.5" />
                      Lancer la méditation
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

