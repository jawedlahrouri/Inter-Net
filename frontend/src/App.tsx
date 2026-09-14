import { useState, useEffect, useCallback } from 'react'
import { fetchHealth, fetchRoot, type HealthResponse, type RootResponse } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Server,
  Activity,
  RefreshCw,
  ExternalLink,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-6">
        {/* Header Hero Card */}
        <Card className="bg-neutral-900/90 border-neutral-800 shadow-2xl backdrop-blur-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                  INTER-NET
                </CardTitle>
                <Badge variant="secondary" className="gap-1 text-[11px]">
                  <Sparkles className="size-3 text-cyan-400" />
                  shadcn/ui
                </Badge>
              </div>
              <CardDescription className="text-neutral-400 text-sm">
                Stack moderne FastAPI (Python) + React (TypeScript, Vite, Tailwind CSS, shadcn/ui)
              </CardDescription>
            </div>

            <div>
              {loading ? (
                <Badge variant="outline" className="gap-1.5 border-amber-500/40 text-amber-300 bg-amber-950/30">
                  <Activity className="size-3 animate-spin text-amber-400" />
                  Connexion...
                </Badge>
              ) : health ? (
                <Badge variant="outline" className="gap-1.5 border-emerald-500/40 text-emerald-300 bg-emerald-950/30">
                  <CheckCircle2 className="size-3 text-emerald-400" />
                  Backend Connecté
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1.5">
                  <AlertTriangle className="size-3" />
                  Backend Hors Ligne
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Status Monitoring Card */}
        <Card className="bg-neutral-900/90 border-neutral-800 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2 text-neutral-200">
                <Server className="size-5 text-indigo-400" />
                Statut de l'API FastAPI
              </CardTitle>
              <CardDescription className="text-neutral-400 text-xs">
                Surveillance de l'état du serveur backend en temps réel
              </CardDescription>
            </div>

            <Button
              onClick={checkConnection}
              disabled={loading}
              variant="outline"
              size="sm"
              className="gap-2 cursor-pointer border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Test...' : 'Rafraîchir'}
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-neutral-400 py-4 text-center">
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
              <div className="space-y-3">
                {rootInfo?.message && (
                  <div className="p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-lg text-sm text-indigo-200 flex items-center gap-2">
                    <Code2 className="size-4 text-indigo-400 shrink-0" />
                    <span>
                      Message backend : <strong className="text-white">{rootInfo.message}</strong>
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800">
                    <span className="text-neutral-400 text-xs block">Service</span>
                    <span className="font-mono font-medium text-neutral-200 text-xs sm:text-sm truncate block">
                      {health.service}
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800">
                    <span className="text-neutral-400 text-xs block">Version</span>
                    <span className="font-mono font-medium text-neutral-200 text-xs sm:text-sm block">
                      {health.version}
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800">
                    <span className="text-neutral-400 text-xs block">Statut</span>
                    <span className="font-mono font-medium text-emerald-400 text-xs sm:text-sm block">
                      {health.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800">
                    <span className="text-neutral-400 text-xs block">Dernier Ping</span>
                    <span className="font-mono text-neutral-300 text-xs block truncate">
                      {new Date(health.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Documentation Links Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="http://localhost:8000/api/v1/docs"
            target="_blank"
            rel="noreferrer"
            className="group block"
          >
            <Card className="bg-neutral-900/60 border-neutral-800 hover:border-indigo-500/50 hover:bg-neutral-900 transition-all h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between text-neutral-200 group-hover:text-indigo-400">
                  Swagger OpenAPI
                  <ExternalLink className="size-3.5 opacity-60 group-hover:opacity-100" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-400">Documentation interactive des endpoints FastAPI</p>
              </CardContent>
            </Card>
          </a>

          <a
            href="http://localhost:8000/api/v1/redoc"
            target="_blank"
            rel="noreferrer"
            className="group block"
          >
            <Card className="bg-neutral-900/60 border-neutral-800 hover:border-indigo-500/50 hover:bg-neutral-900 transition-all h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between text-neutral-200 group-hover:text-indigo-400">
                  ReDoc
                  <ExternalLink className="size-3.5 opacity-60 group-hover:opacity-100" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-400">Documentation détaillée et lisible des schemas</p>
              </CardContent>
            </Card>
          </a>

          <a
            href="https://ui.shadcn.com/docs"
            target="_blank"
            rel="noreferrer"
            className="group block"
          >
            <Card className="bg-neutral-900/60 border-neutral-800 hover:border-indigo-500/50 hover:bg-neutral-900 transition-all h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between text-neutral-200 group-hover:text-indigo-400">
                  shadcn/ui Docs
                  <ExternalLink className="size-3.5 opacity-60 group-hover:opacity-100" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-400">Composants accessibles et stylables à volonté</p>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-500 pt-2">
          INTER-NET • FastAPI + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui
        </p>
      </div>
    </div>
  )
}

export default App
