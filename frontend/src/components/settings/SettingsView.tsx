import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useTheme } from '@/context/ThemeContext';
import {
  getStoredToken,
  fetchSteamStatus,
  disconnectSteam,
  fetchGithubStatus,
  disconnectGithub,
} from '@/services/api';
import { GithubConnectDialog } from './GithubConnectDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Shield,
  Calendar,
  LogOut,
  Layers,
  Gamepad2,
  Video,
  Music,
  Radio,
  CloudSun,
  CheckCircle2,
  Clock,
  GitBranch,
  Sparkles,
  Palette,
  Volume2,
  VolumeX,
  Upload,
  Link2,
  Check,
  Play,
  RotateCcw,
  Sun,
  Moon,
  Laptop,
  PanelLeftClose,
  PanelLeft,
  SlidersHorizontal,
} from 'lucide-react';

export type SettingsSubpage = 'account' | 'integrations' | 'ambiance' | 'appearance';

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: typeof GitBranch;
  status: 'coming_soon' | 'connected' | 'disconnected';
  account?: string;
}

const INTEGRATIONS: IntegrationItem[] = [
  {
    id: 'steam',
    name: 'Steam',
    category: 'Gaming',
    description: 'Suivi de la Wishlist, temps de jeu et statistiques de bibliothèque.',
    icon: Gamepad2,
    status: 'disconnected',
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Développement',
    description: 'Surveillance des repositories, pull requests, issues et activité de commits.',
    icon: GitBranch,
    status: 'disconnected',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'Média',
    description: 'Statistiques de chaînes, nombre d\'abonnés et dernières vidéos publiées.',
    icon: Video,
    status: 'coming_soon',
  },
  {
    id: 'weather',
    name: 'Open-Meteo',
    category: 'Météo',
    description: 'Synchronisation des alertes et prévisions météorologiques locales.',
    icon: CloudSun,
    status: 'coming_soon',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'Audio',
    description: 'Affichage du morceau en cours de lecture et gestion des playlists.',
    icon: Music,
    status: 'coming_soon',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    category: 'Streaming',
    description: 'Notification de direct pour vos streamers favoris et nombre de viewers.',
    icon: Radio,
    status: 'coming_soon',
  },
];

export interface SettingsViewProps {
  initialSubpage?: SettingsSubpage;
  onSubpageChange?: (subpage: SettingsSubpage) => void;
  onLaunchMeditation?: () => void;
}

export function SettingsView({
  initialSubpage = 'account',
  onSubpageChange,
  onLaunchMeditation,
}: SettingsViewProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    settings,
    availableVideos,
    updateMeditationSettings,
    uploadVideo,
  } = useSettings();

  const [activeSubpage, setActiveSubpage] = useState<SettingsSubpage>(initialSubpage);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(INTEGRATIONS);
  const [isGithubDialogOpen, setIsGithubDialogOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return localStorage.getItem('settings_sidebar_open') !== 'false';
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('settings_sidebar_open', String(next));
      return next;
    });
  };

  // Ambiance State
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentVideoUrl = settings.meditation.video_url;
  const isVideoEnabled = settings.meditation.video_enabled;
  const isSoundEnabled = settings.meditation.sound_enabled;

  useEffect(() => {
    if (initialSubpage) {
      setActiveSubpage(initialSubpage);
    }
  }, [initialSubpage]);

  const handleSubpageChange = (subpage: SettingsSubpage) => {
    setActiveSubpage(subpage);
    if (onSubpageChange) {
      onSubpageChange(subpage);
    }
  };

  useEffect(() => {
    async function checkConnectedServices() {
      // 1. Statut Steam
      try {
        const steam = await fetchSteamStatus();
        if (steam.connected) {
          setIntegrations((prev) =>
            prev.map((item) =>
              item.id === 'steam'
                ? {
                    ...item,
                    status: 'connected' as const,
                    account: steam.profile?.username || steam.steam_id || 'Steam lié',
                  }
                : item
            )
          );
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du statut Steam:', err);
      }

      // 2. Statut GitHub
      try {
        const github = await fetchGithubStatus();
        if (github.connected) {
          setIntegrations((prev) =>
            prev.map((item) =>
              item.id === 'github'
                ? {
                    ...item,
                    status: 'connected' as const,
                    account: github.profile?.username || github.profile?.login || 'GitHub lié',
                  }
                : item
            )
          );
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du statut GitHub:', err);
      }
    }

    checkConnectedServices();
  }, []);

  if (!user) return null;

  const handleConnect = (id: string) => {
    if (id === 'steam') {
      const token = getStoredToken();
      const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
      const redirectUrl = token
        ? `${apiUrl}/api/v1/auth/steam?token=${encodeURIComponent(token)}`
        : `${apiUrl}/api/v1/auth/steam`;
      window.location.href = redirectUrl;
      return;
    }

    if (id === 'github') {
      setIsGithubDialogOpen(true);
      return;
    }

    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'connected' as const, account: `${user.username}` }
          : item
      )
    );
  };

  const handleDisconnect = async (id: string) => {
    if (id === 'steam') {
      try {
        await disconnectSteam();
      } catch (err) {
        console.error('Erreur lors de la déconnexion Steam:', err);
      }
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === 'steam'
            ? { ...item, status: 'disconnected' as const, account: undefined }
            : item
        )
      );
      return;
    }

    if (id === 'github') {
      try {
        await disconnectGithub();
      } catch (err) {
        console.error('Erreur lors de la déconnexion GitHub:', err);
      }
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === 'github'
            ? { ...item, status: 'disconnected' as const, account: undefined }
            : item
        )
      );
      return;
    }

    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'disconnected' as const, account: undefined }
          : item
      )
    );
  };

  // Ambiance handlers
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

  const initials = user.username.slice(0, 2).toUpperCase();
  const formattedDate = new Date(user.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const connectedCount = integrations.filter((i) => i.status === 'connected').length;

  return (
    <div className="w-full space-y-6">
      {/* Header section */}
      <div className="border-b border-border/60 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Paramètres
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Gérez votre profil, vos intégrations de services, l'ambiance et vos préférences d'affichage.
        </p>
      </div>

      {/* Main Settings Layout with Left Sidebar */}
      <div className="flex flex-col md:flex-row items-start gap-6 w-full">
        {/* Left Sidebar */}
        {isSidebarOpen ? (
          <aside className="w-full md:w-64 shrink-0 rounded-2xl border border-border/80 bg-card/90 p-3.5 shadow-md backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between px-2 py-1 border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Navigation
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Masquer la barre latérale"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </div>

            <nav className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleSubpageChange('account')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeSubpage === 'account'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <User className="size-4" />
                  <span>Compte & Profil</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSubpageChange('integrations')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeSubpage === 'integrations'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="size-4" />
                  <span>Intégrations</span>
                </div>
                {connectedCount > 0 && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      activeSubpage === 'integrations'
                        ? 'border-white/30 text-white bg-white/20'
                        : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                    }`}
                  >
                    {connectedCount}
                  </Badge>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSubpageChange('ambiance')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeSubpage === 'ambiance'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="size-4" />
                  <span>Ambiance</span>
                </div>
                {isVideoEnabled && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      activeSubpage === 'ambiance'
                        ? 'border-white/30 text-white bg-white/20'
                        : 'border-amber-500/30 text-amber-500 bg-amber-500/10'
                    }`}
                  >
                    Actif
                  </Badge>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSubpageChange('appearance')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  activeSubpage === 'appearance'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Palette className="size-4" />
                  <span>Apparence</span>
                </div>
              </button>
            </nav>
          </aside>
        ) : null}

        {/* Right Content Area */}
        <section className="flex-1 min-w-0 w-full space-y-6">
          {!isSidebarOpen && (
            <div className="flex items-center gap-2 pb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="h-8 gap-2 px-3 text-xs rounded-lg border-border/80 bg-card hover:bg-muted cursor-pointer shadow-2xs"
              >
                <PanelLeft className="size-3.5 text-primary" />
                <span>Afficher le menu des paramètres</span>
              </Button>
            </div>
          )}
          {/* 1. SOUS-PAGE : COMPTE & PROFIL */}
          {activeSubpage === 'account' && (
            <div className="space-y-6">
              <Card className="border border-border bg-card rounded-lg shadow-xs">
                <CardHeader className="p-6 pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Informations du compte
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Détails de votre session et identité utilisateur.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-lg bg-muted/70 border border-border flex items-center justify-center font-mono text-sm font-semibold text-foreground select-none shrink-0">
                        {initials}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base font-semibold text-foreground">
                            {user.username}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[11px] px-2 py-0.5 font-normal tracking-wide text-muted-foreground border-border"
                          >
                            {user.role === 'admin' ? (
                              <span className="flex items-center gap-1">
                                <Shield className="size-3" /> Admin
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <User className="size-3" /> Membre
                              </span>
                            )}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="default"
                      onClick={logout}
                      className="h-10 text-xs gap-2 cursor-pointer text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 self-start sm:self-auto"
                    >
                      <LogOut className="size-3.5" />
                      <span>Se déconnecter</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-1">
                      <span className="text-muted-foreground text-[11px] block">Identifiant unique</span>
                      <span className="font-mono tabular-nums text-foreground font-semibold">#{user.id}</span>
                    </div>
                    <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-1">
                      <span className="text-muted-foreground text-[11px] block">Date d'inscription</span>
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span className="font-mono tabular-nums">{formattedDate}</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-1">
                      <span className="text-muted-foreground text-[11px] block">État de l'authentification</span>
                      <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
                        <CheckCircle2 className="size-3.5" />
                        <span>Jeton JWT Valide</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 2. SOUS-PAGE : INTÉGRATIONS */}
          {activeSubpage === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  Intégrations & Connexions
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Liez vos services externes pour alimenter vos widgets de tableau de bord.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Card
                      key={item.id}
                      className="border border-border bg-card rounded-lg shadow-xs hover:border-border/90 transition-colors flex flex-col justify-between"
                    >
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-center text-foreground shrink-0">
                              <IconComponent className="size-5" />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                                {item.name}
                                <span className="text-[10px] font-normal text-muted-foreground font-mono">
                                  {item.category}
                                </span>
                              </CardTitle>
                              <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {item.description}
                              </CardDescription>
                            </div>
                          </div>

                          {item.status === 'connected' && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10 shrink-0"
                            >
                              <CheckCircle2 className="size-2.5 mr-1" />
                              Connecté
                            </Badge>
                          )}
                          {item.status === 'disconnected' && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-muted-foreground shrink-0 border-border/60"
                            >
                              Non lié
                            </Badge>
                          )}
                          {item.status === 'coming_soon' && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] text-muted-foreground shrink-0 border border-border/60"
                            >
                              <Clock className="size-2.5 mr-1" />
                              Bientôt
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 border-t border-border/50 p-4 flex items-center justify-between text-xs mt-auto">
                        <span className="text-muted-foreground text-[11px] font-mono truncate max-w-[180px]">
                          {item.status === 'connected' && (item.account || 'Compte actif')}
                          {item.status === 'disconnected' && 'Prêt à être associé'}
                          {item.status === 'coming_soon' && 'Intégration à venir'}
                        </span>

                        {item.status === 'connected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(item.id)}
                            className="h-8 text-xs px-3 text-muted-foreground hover:text-destructive hover:border-destructive/40 cursor-pointer"
                          >
                            Déconnecter
                          </Button>
                        )}

                        {item.status === 'disconnected' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleConnect(item.id)}
                            className="h-8 text-xs px-3 cursor-pointer"
                          >
                            Se connecter
                          </Button>
                        )}

                        {item.status === 'coming_soon' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="h-8 text-xs px-3 opacity-50 cursor-not-allowed text-muted-foreground border border-border/40"
                          >
                            Bientôt
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. SOUS-PAGE : AMBIANCE & MÉDITATION (MIGRÉE) */}
          {activeSubpage === 'ambiance' && (
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

              {/* Interrupteur vidéo de fond */}
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
                    updateMeditationSettings({ video_enabled: checked })
                  }
                />
              </div>

              {/* Panneau de configuration si la vidéo est activée */}
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
                    {/* Grille des vidéos disponibles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {availableVideos.map((vid) => {
                        const isSelected =
                          currentVideoUrl === vid.url ||
                          currentVideoUrl.endsWith(vid.filename);
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
                        );
                      })}
                    </div>

                    {/* Uploader une vidéo ou saisir une URL */}
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

                    {/* Contrôle audio */}
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
                          updateMeditationSettings({ sound_enabled: checked })
                        }
                      />
                    </div>

                    {/* Lecteur d'aperçu */}
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
          )}

          {/* 4. SOUS-PAGE : APPARENCE & THÈME */}
          {activeSubpage === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <Palette className="size-4 text-sky-500" />
                  Apparence & Thème
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choisissez le mode d'affichage adapté à votre environnement de travail.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Mode Sombre */}
                <div
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-36 ${
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
                    <h4 className="text-sm font-semibold text-foreground">Thème Sombre</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Contraste optimisé pour les environnements à faible luminosité.
                    </p>
                  </div>
                </div>

                {/* Mode Clair */}
                <div
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-36 ${
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
                    <h4 className="text-sm font-semibold text-foreground">Thème Clair</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Interface lumineuse et aérée pour travailler en plein jour.
                    </p>
                  </div>
                </div>

                {/* Mode Système */}
                <div
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-36 ${
                    theme === 'system'
                      ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-sm'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Laptop className="size-5 text-sky-400" />
                    {theme === 'system' && <Check className="size-4 text-primary" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Système</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      S'adapte automatiquement aux réglages de votre système d'exploitation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <GithubConnectDialog
        open={isGithubDialogOpen}
        onOpenChange={setIsGithubDialogOpen}
        onSuccess={(profile) => {
          setIntegrations((prev) =>
            prev.map((item) =>
              item.id === 'github'
                ? {
                    ...item,
                    status: 'connected' as const,
                    account: profile.username || profile.login || 'GitHub lié',
                  }
                : item
            )
          );
        }}
      />
    </div>
  );
}

export default SettingsView;
