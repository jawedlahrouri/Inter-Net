import { useState, useRef } from 'react';
import { useSettings } from '@/context/SettingsContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  Volume2,
  VolumeX,
  Upload,
  Link2,
  Sparkles,
  Check,
  Play,
  RotateCcw,
} from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLaunchMeditation?: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  onLaunchMeditation,
}: SettingsDialogProps) {
  const {
    settings,
    availableVideos,
    updateMeditationSettings,
    uploadVideo,
  } = useSettings();

  const [customUrl, setCustomUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentVideoUrl = settings.meditation.video_url;
  const isVideoEnabled = settings.meditation.video_enabled;
  const isSoundEnabled = settings.meditation.sound_enabled;

  const handleSelectVideo = async (url: string) => {
    await updateMeditationSettings({ video_url: url });
  };

  const handleCustomUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    await updateMeditationSettings({ video_url: customUrl.trim() });
    setCustomUrl('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      const uploaded = await uploadVideo(file);
      await updateMeditationSettings({ video_url: uploaded.url });
    } catch (err: any) {
      setUploadError(err.message || 'Erreur lors du téléversement.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetToDefault = async () => {
    await updateMeditationSettings({
      video_enabled: true,
      video_url: '/custom_vids/la_peace.mp4',
      sound_enabled: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border/80 text-foreground p-6">
        <DialogHeader className="space-y-1 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="size-4" />
            </div>
            <DialogTitle className="text-base font-semibold tracking-tight">
              Paramètres & Personnalisation
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Configurez l'apparence et l'expérience immersive de la pause méditation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-3">
          {/* Section: Activer la vidéo d'arrière-plan */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/70 bg-muted/20">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <Video className="size-4 text-foreground/80" />
                <Label className="text-xs font-semibold text-foreground cursor-pointer">
                  Vidéo d'arrière-plan en méditation
                </Label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Diffuse une vidéo en fond derrière la citation lorsque vous lancez la méditation.
              </p>
            </div>
            <Switch
              checked={isVideoEnabled}
              onCheckedChange={(checked) =>
                updateMeditationSettings({ video_enabled: checked })
              }
            />
          </div>

          {/* Si vidéo activée : Choix et configuration de la vidéo */}
          {isVideoEnabled && (
            <div className="space-y-4 rounded-lg border border-border/60 p-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground">
                  Vidéo sélectionnée
                </Label>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleResetToDefault}
                  className="h-6 text-[11px] text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                >
                  <RotateCcw className="size-3" />
                  Réinitialiser (La Peace)
                </Button>
              </div>

              {/* Liste des vidéos proposées / disponibles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableVideos.map((vid) => {
                  const isSelected =
                    currentVideoUrl === vid.url ||
                    currentVideoUrl.endsWith(vid.filename);
                  return (
                    <div
                      key={vid.id}
                      onClick={() => handleSelectVideo(vid.url)}
                      className={`relative flex items-center justify-between p-2.5 rounded-md border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-xs'
                          : 'border-border/60 hover:border-border bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div className="size-6 rounded bg-muted flex items-center justify-center shrink-0">
                          <Play className="size-3 text-muted-foreground" />
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-foreground truncate">
                            {vid.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {vid.filename === 'la_peace.mp4' ? 'Par défaut' : vid.filename}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                          <Check className="size-2.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Option d'upload ou URL personnalisée */}
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
                    {isUploading ? 'Téléversement...' : 'Uploader une vidéo (.mp4)'}
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

              {/* Configuration audio de la vidéo */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {isSoundEnabled ? (
                      <Volume2 className="size-3.5 text-foreground/80" />
                    ) : (
                      <VolumeX className="size-3.5 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium text-foreground">
                      Son de la vidéo
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Activer la piste audio de la vidéo pendant la méditation.
                  </p>
                </div>
                <Switch
                  checked={isSoundEnabled}
                  onCheckedChange={(checked) =>
                    updateMeditationSettings({ sound_enabled: checked })
                  }
                />
              </div>

              {/* Prévisualisation miniature */}
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Aperçu du flux actif</span>
                  <Badge variant="outline" className="text-[10px] font-mono py-0">
                    {currentVideoUrl}
                  </Badge>
                </div>
                <div className="relative h-28 w-full rounded-md overflow-hidden bg-black/60 border border-border/60">
                  <video
                    key={currentVideoUrl}
                    src={currentVideoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <p className="text-white/90 text-xs font-serif italic text-center px-4 drop-shadow-md">
                      « Respirer, c'est vivre. »
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/60 mt-4">
          {onLaunchMeditation && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onLaunchMeditation();
              }}
              className="text-xs gap-1.5 h-8 cursor-pointer"
            >
              <Sparkles className="size-3.5 text-primary" />
              <span>Tester la méditation</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 ml-auto cursor-pointer"
          >
            Terminé
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;
