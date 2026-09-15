import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthCard } from '@/components/auth/AuthCard';
import { UserDashboardHeader } from '@/components/auth/UserDashboardHeader';
import { MotivationalLoader } from '@/components/auth/MotivationalLoader';
import { WidgetGrid } from '@/components/dashboard/WidgetGrid';
import { useWidgets } from '@/hooks/useWidgets';
import { fetchHealth, type HealthResponse } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Server,
  RefreshCw,
  ExternalLink,
  Zap,
  Activity,
  Quote,
} from 'lucide-react';

function DashboardContent() {
  const {
    user,
    loading: authLoading,
    showMotivationalTransition,
    setShowMotivationalTransition,
  } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };
  const { widgets, addWidget, removeWidget } = useWidgets();

  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      setHealthError(err instanceof Error ? err.message : 'Impossible de joindre le serveur API');
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="size-8 animate-spin text-indigo-400" />
          <p className="text-sm text-muted-foreground">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  if (showMotivationalTransition) {
    return (
      <MotivationalLoader onComplete={() => setShowMotivationalTransition(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20">
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              INTER-NET
            </span>
            <Badge variant="outline" className="text-[10px] font-mono border-indigo-500/30 text-indigo-400">
              v0.1.0
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMotivationalTransition(true)}
                  className="text-xs gap-1.5 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                >
                  <Quote className="size-3" />
                  Méditer
                </Button>
                <Button
                  variant={isEditing ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleEditMode}
                  className="text-xs cursor-pointer"
                >
                  {isEditing ? 'Terminer' : 'Éditer'}
                </Button>
              </>
            )}

            {health ? (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1.5 py-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                API Connectée
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-1.5 py-1">
                <span className="size-1.5 rounded-full bg-destructive" />
                API Déconnectée
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={checkHealth}
              disabled={healthLoading}
              title="Tester l'état du serveur"
              className="size-8 p-0 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {!user ? (
          /* Non-authentifié : Présentation et Formulaire Login/Register */
          <div className="space-y-10">
            <div className="text-center space-y-3 pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-2">
                <Zap className="size-3.5" />
                Tableau de bord modulaire & temps réel
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-b from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
                Votre Dashboard Interactif
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
                Connectez vos services, composez vos widgets en direct et visualisez toutes vos informations à cadence synchronisée.
              </p>
            </div>

            <AuthCard />
          </div>
        ) : (
          /* Authentifié : Espace Dashboard Utilisateur */
          <div className="space-y-8">
            <UserDashboardHeader />

            {/* Widgets Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Activity className="size-5 text-indigo-400" />
                    Mes Widgets
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Gérez et personnalisez vos flux d'informations en direct.
                  </p>
                </div>
                <Button
                  variant={isEditing ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleEditMode}
                  className="cursor-pointer"
                >
                  {isEditing ? 'Terminer' : 'Éditer les widgets'}
                </Button>
              </div>

              <WidgetGrid
                widgets={widgets}
                isEditing={isEditing}
                onAddWidget={addWidget}
                onRemoveWidget={removeWidget}
              />
            </div>

            {/* Server Health Status Card */}
            <Card className="border-border/50 bg-card/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Server className="size-4 text-indigo-400" />
                  État du serveur et Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                {health ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-background/50 rounded-lg border border-border">
                      <span className="text-muted-foreground block mb-1">API Backend</span>
                      <span className="font-semibold text-emerald-400">En ligne (port 8080)</span>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg border border-border">
                      <span className="text-muted-foreground block mb-1">Authentification</span>
                      <span className="font-semibold text-emerald-400">JWT Actif</span>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg border border-border">
                      <span className="text-muted-foreground block mb-1">Base MySQL</span>
                      <span className="font-semibold text-emerald-400">Connectée</span>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg border border-border">
                      <span className="text-muted-foreground block mb-1">Format standard</span>
                      <span className="font-mono text-indigo-400">about.json prêt</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-destructive">{healthError || 'Serveur non disponible'}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-foreground">CrabeCorp • INTER-NET Dashboard</p>
          <div className="flex items-center gap-4">
            <a
              href="http://localhost:8080/about.json"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              /about.json
              <ExternalLink className="size-3" />
            </a>
            <a
              href="http://localhost:8080/api/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              Swagger Docs
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;
