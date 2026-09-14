import { useState, useEffect, useCallback } from 'react'
import { fetchHealth, fetchRoot, type HealthResponse, type RootResponse } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddButton } from '@/components/ui/addbutton'
import { RemoveButton } from '@/components/ui/removebutton'
import { Separator } from '@/components/ui/separator'
import { InputField } from '@/components/ui/input-field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Server,
  RefreshCw,
  Code2,
  AlertTriangle,
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
      const [healthData, rootData] = await Promise.all([fetchHealth(), fetchRoot()])
      setHealth(healthData)
      setRootInfo(rootData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue de connexion au backend')
      setHealth(null)
      setRootInfo(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  const [isEditing, setIsEditing] = useState<boolean>(false)

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev)
  }

  interface Widget {
    id: string
    title: string
  }

  const [widgets, setWidgets] = useState<Widget[]>([
    { id: '1', title: 'Widget 1' },
    { id: '2', title: 'Widget 2' },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [widgetTitle, setWidgetTitle] = useState<string>('')

  const handleCreateWidget = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!widgetTitle.trim()) return

    const newId = (widgets.length + 1).toString()
    setWidgets((prev) => [
      ...prev,
      { id: newId, title: widgetTitle.trim() },
    ])
    setWidgetTitle('')
    setIsDialogOpen(false)
  }

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id))
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-cyan-500/20">
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="w-full px-6 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo & Version à gauche */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              INTER-NET
            </span>
            <Badge variant="outline" className="text-[10px] font-mono">
              0.1.0
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => (
            <Card key={widget.id} className="min-h-[320px] bg-card border-border flex flex-col justify-between">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-card-foreground">{widget.title}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Widget #{widget.id}</CardDescription>
                </div>
                {isEditing && (
                  <RemoveButton onClick={() => removeWidget(widget.id)} />
                )}
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-t border-dashed border-border/60 m-4 rounded-lg bg-muted/20">
                Contenu du widget
              </CardContent>
            </Card>
          ))}

          {isEditing && (
            <AddButton onClick={() => setIsDialogOpen(true)} />
          )}
        </div>

        {/* Modal d'ajout de widget (UX 1) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter un widget</DialogTitle>
              <DialogDescription>
                Renseignez les détails de votre nouveau widget.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateWidget} className="space-y-4 py-2">
              <InputField
                label="Nom du widget"
                placeholder="Entrez le nom du widget"
                value={widgetTitle}
                onChange={(e) => setWidgetTitle(e.target.value)}
                autoFocus
                required
              />

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={!widgetTitle.trim()}>
                  Créer le widget
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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
              onClick={checkConnection}
              disabled={loading}
              variant="outline"
              size="sm"
              className="gap-2 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Test...' : 'Rafraîchir'}
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Interrogation des endpoints API...
              </p>
            ) : error ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 text-destructive font-medium">
                  <AlertTriangle className="size-4" />
                  Impossible de contacter le backend
                </div>
                <p className="font-mono text-xs text-destructive">{error}</p>
                <div className="text-xs text-muted-foreground pt-2 border-t border-destructive/20">
                  Lancez FastAPI dans le terminal :
                  <pre className="mt-1 p-2 bg-background rounded font-mono text-foreground overflow-x-auto">
                    cd backend &amp;&amp; source .venv/bin/activate &amp;&amp; uvicorn app.main:app --reload
                  </pre>
                </div>
              </div>
            ) : health ? (
              <div className="space-y-4">
                {rootInfo?.message && (
                  <div className="p-3.5 bg-secondary/50 border border-border rounded-lg text-sm text-secondary-foreground flex items-center gap-2.5">
                    <Code2 className="size-4 text-indigo-400 shrink-0" />
                    <span>
                      Message backend : <strong className="text-foreground">{rootInfo.message}</strong>
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="p-3.5 bg-background/60 rounded-lg border border-border">
                    <span className="text-muted-foreground text-xs block mb-1">Service</span>
                    <span className="font-mono font-medium text-foreground text-xs sm:text-sm truncate block">
                      {health.service}
                    </span>
                  </div>
                  <div className="p-3.5 bg-background/60 rounded-lg border border-border">
                    <span className="text-muted-foreground text-xs block mb-1">Version</span>
                    <span className="font-mono font-medium text-foreground text-xs sm:text-sm block">
                      {health.version}
                    </span>
                  </div>
                  <div className="p-3.5 bg-background/60 rounded-lg border border-border">
                    <span className="text-muted-foreground text-xs block mb-1">Statut</span>
                    <span className="font-mono font-medium text-emerald-400 text-xs sm:text-sm block">
                      {health.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-3.5 bg-background/60 rounded-lg border border-border">
                    <span className="text-muted-foreground text-xs block mb-1">Dernier Ping</span>
                    <span className="font-mono text-muted-foreground text-xs block truncate">
                      {new Date(health.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card> */}
      </main>

      {/* Page Content Dashboard */}

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        <p className="font-medium text-foreground mb-2">CrabeCorp Tools</p>
        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
          <Button variant="link" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground h-auto p-1">
            <a
              href="http://localhost:8000/api/v1/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1"
            >
              Documentation (Swagger)
              <ExternalLink className="size-3" />
            </a>
          </Button>

          <span className="text-border">•</span>

          <Button variant="link" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground h-auto p-1">
            <a
              href="http://localhost:8000/api/v1/redoc"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1"
            >
              Documentation (ReDoc)
              <ExternalLink className="size-3" />
            </a>
          </Button>

          <span className="text-border">•</span>

          <Button variant="link" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground h-auto p-1">
            <a
              href="https://ui.shadcn.com/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1"
            >
              shadcn/ui Docs
              <ExternalLink className="size-3" />
            </a>
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default App
