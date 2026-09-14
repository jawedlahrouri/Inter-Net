import { useState, useEffect, useCallback } from 'react'
import { fetchHealth, fetchRoot, type HealthResponse, type RootResponse } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Server,
  RefreshCw,
  Code2,
  AlertTriangle,
  Globe,
  BookOpen,
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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-cyan-500/20">
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                  INTER-NET
                </span>
              </div>
            </div>

            {/* Quick links */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-neutral-800/80">
              <a
                href="#dashboard"
                className="px-3 py-1.5 text-xs font-medium text-neutral-100 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xs"
              >
                Dashboard
              </a>
              <a
                href="http://localhost:8000/api/v1/docs"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <BookOpen className="size-3" />
                API Docs
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Page Hero Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-100">
            DashBoard - INTER-NET
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-md mx-auto">
            Suivez l'état de votre application et jeux en temps réel.
          </p>
        </div>

        {/* TODO: Peut être supprimer cette partie du code ou la déplacé dans une autre page par la suite.*/}

        {/* Status Monitoring Card
        <Card className="bg-neutral-900/90 border-neutral-800 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2 text-neutral-200">
                <Server className="size-5 text-indigo-400" />
                Statut de l'API
              </CardTitle>
              <CardDescription className="text-neutral-400 text-xs">
                Informations en temps réel du serveur backend FastAPI.
              </CardDescription>
            </div>

            <Button
              onClick={checkConnection}
              disabled={loading}
              variant="outline"
              size="sm"
              className="gap-2 cursor-pointer border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Test...' : 'Rafraîchir'}
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-neutral-400 py-6 text-center">
                Interrogation des endpoints API...
              </p>
            ) : error ? (
              <div className="bg-rose-950/30 border border-rose-800/40 rounded-lg p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-medium">
                  <AlertTriangle className="size-4" />
                  Impossible de contacter le backend
                </div>
                <p className="font-mono text-xs text-rose-400">{error}</p>
                <div className="text-xs text-neutral-400 pt-2 border-t border-rose-900/40">
                  Lancez FastAPI dans le terminal :
                  <pre className="mt-1 p-2 bg-neutral-950 rounded font-mono text-neutral-300 overflow-x-auto">
                    cd backend &amp;&amp; source .venv/bin/activate &amp;&amp; uvicorn app.main:app --reload
                  </pre>
                </div>
              </div>
            ) : health ? (
              <div className="space-y-4">
                {rootInfo?.message && (
                  <div className="p-3.5 bg-indigo-950/30 border border-indigo-900/40 rounded-lg text-sm text-indigo-200 flex items-center gap-2.5">
                    <Code2 className="size-4 text-indigo-400 shrink-0" />
                    <span>
                      Message backend : <strong className="text-white">{rootInfo.message}</strong>
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="p-3.5 bg-neutral-950/60 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-400 text-xs block mb-1">Service</span>
                    <span className="font-mono font-medium text-neutral-200 text-xs sm:text-sm truncate block">
                      {health.service}
                    </span>
                  </div>
                  <div className="p-3.5 bg-neutral-950/60 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-400 text-xs block mb-1">Version</span>
                    <span className="font-mono font-medium text-neutral-200 text-xs sm:text-sm block">
                      {health.version}
                    </span>
                  </div>
                  <div className="p-3.5 bg-neutral-950/60 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-400 text-xs block mb-1">Statut</span>
                    <span className="font-mono font-medium text-emerald-400 text-xs sm:text-sm block">
                      {health.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-3.5 bg-neutral-950/60 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-400 text-xs block mb-1">Dernier Ping</span>
                    <span className="font-mono text-neutral-300 text-xs block truncate">
                      {new Date(health.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card> */}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 py-6 text-center text-xs text-neutral-500 mt-auto">
        <p className="font-medium text-neutral-400 mb-2">CrabeCorp Tools</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a
            href="http://localhost:8000/api/v1/docs"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-400 hover:text-indigo-400 inline-flex items-center gap-1 transition-colors"
          >
            Documentation (Swagger)
            <ExternalLink className="size-3" />
          </a>
          <span className="text-neutral-700">•</span>
          <a
            href="http://localhost:8000/api/v1/redoc"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-400 hover:text-indigo-400 inline-flex items-center gap-1 transition-colors"
          >
            Documentation (ReDoc)
            <ExternalLink className="size-3" />
          </a>
          <span className="text-neutral-700">•</span>
          <a
            href="https://ui.shadcn.com/docs"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-400 hover:text-indigo-400 inline-flex items-center gap-1 transition-colors"
          >
            shadcn/ui Docs
            <ExternalLink className="size-3" />
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
