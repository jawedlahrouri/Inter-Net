import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStoredToken, fetchSteamStatus, disconnectSteam } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

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
    status: 'coming_soon',
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

export function SettingsView() {
  const { user, logout } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(INTEGRATIONS);

  if (!user) return null;

  useEffect(() => {
    async function checkConnectedServices() {
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
    }

    checkConnectedServices();
  }, []);

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

    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'disconnected' as const, account: undefined }
          : item
      )
    );
  };

  const initials = user.username.slice(0, 2).toUpperCase();
  const formattedDate = new Date(user.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="w-full space-y-8">
      {/* Header section */}
      <div className="border-b border-border/60 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Profil & Paramètres
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Gérez les détails de votre compte et découvrez les futures intégrations de services.
        </p>
      </div>

      {/* User profile card */}
      <Card className="w-full border border-border bg-card rounded-lg shadow-xs">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-base font-semibold text-foreground">
            Informations du compte
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Détails de votre session et de votre identité utilisateur.
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

      {/* Integrations section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            Intégrations & Connexions
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Services externes bientôt disponibles pour alimenter vos widgets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {integrations.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card
                key={item.id}
                className="border border-border bg-card rounded-lg shadow-xs hover:border-border/90 transition-colors flex flex-col justify-between"
              >
                <CardHeader className="p-6 pb-3">
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
                  <span className="text-muted-foreground text-[11px] font-mono truncate">
                    {item.status === 'connected' && (item.account || 'Compte actif')}
                    {item.status === 'disconnected' && 'Prêt à être associé'}
                    {item.status === 'coming_soon' && 'Intégration à venir'}
                  </span>

                  {item.status === 'connected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(item.id)}
                      className="h-9 text-xs px-3 text-muted-foreground hover:text-destructive hover:border-destructive/40 cursor-pointer"
                    >
                      Déconnecter
                    </Button>
                  )}

                  {item.status === 'disconnected' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleConnect(item.id)}
                      className="h-9 text-xs px-3 cursor-pointer"
                    >
                      Se connecter
                    </Button>
                  )}

                  {item.status === 'coming_soon' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      className="h-9 text-xs px-3 opacity-50 cursor-not-allowed text-muted-foreground border border-border/40"
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
    </div>
  );
}

export default SettingsView;
