import { useState, useEffect, useCallback } from 'react'
import { fetchHealth, fetchRoot, type HealthResponse, type RootResponse } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { WidgetGrid } from '@/components/dashboard/WidgetGrid'
import { useWidgets } from '@/hooks/useWidgets'
import {
  Server,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'


export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [rootInfo, setRootInfo] = useState<RootResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const checkConnection = useCallback(async () => {
    setLoading(true)
    setError(null)
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

  const [isEditing, setIsEditing] = useState<boolean>(false)

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev)
  }

  const { widgets, addWidget, removeWidget } = useWidgets()

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

          {/* Boutons header */}
          <nav className="flex items-center gap-2">
            <Button variant="secondary" size="sm" asChild>
              <a href="#dashboard">Dashboard</a>
            </Button>
            <Button
              variant={isEditing ? 'default' : 'outline'}
              size="sm"
              onClick={toggleEditMode}
            >
              {isEditing ? 'Done' : 'Edit'}
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 w-full px-6 sm:px-8 py-8 space-y-8">
        {/* Page Hero Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            DashBoard - INTER-NET
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Suivez l'état de votre application et jeux en temps réel.
          </p>
        </div>
        {/* Widgets Grid */}
        <WidgetGrid
          widgets={widgets}
          isEditing={isEditing}
          onAddWidget={addWidget}
          onRemoveWidget={removeWidget}
        />

        {/* TODO: Peut être supprimer cette partie du code ou la déplacé dans une autre page par la suite.*/}

        {/* Status Monitoring Card
        <Card className="bg-card border-border shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
                <Server className="size-5 text-indigo-400" />
                Statut de l'API
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Informations en temps réel du serveur backend FastAPI.
              </CardDescription>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={checkHealth}
              disabled={healthLoading}
              title="Tester l'état du serveur"
              className="size-8 p-0"
            >
              <RefreshCw className={`size-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
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
          <div className="space-y-6">
            <UserDashboardHeader />

            {/* Dashboard Workspace Placeholder */}
            <Card className="border-border/60 bg-card/50 backdrop-blur-sm shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="size-5 text-indigo-400" />
                    Mes Widgets
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Gérez et personnalisez vos flux d'informations en direct.
                  </CardDescription>
                </div>

                <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer">
                  <PlusCircle className="size-4" />
                  Ajouter un Widget
                </Button>
              </CardHeader>

              <CardContent className="py-12 text-center space-y-3">
                <div className="size-14 mx-auto rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground">
                  <PlusCircle className="size-6" />
                </div>
                <h3 className="font-semibold text-foreground">Aucun widget configuré pour le moment</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Votre compte est actif et la base de données est prête. Vous pouvez désormais souscrire à des services (Météo, RSS, etc.) et configurer vos premiers widgets !
                </p>
              </CardContent>
            </Card>

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
