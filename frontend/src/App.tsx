import { useState, useEffect, useCallback } from 'react'
import { fetchHealth, fetchRoot, type HealthResponse, type RootResponse } from './services/api'

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              INTER-NET
            </h1>
            <p className="text-slate-400 text-sm mt-1">Fullstack FastAPI + React (TypeScript + Vite)</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                loading
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                  : health
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  loading
                    ? 'bg-amber-400 animate-ping'
                    : health
                    ? 'bg-emerald-400'
                    : 'bg-rose-400'
                }`}
              />
              {loading ? 'Connexion en cours...' : health ? 'Backend Connecté' : 'Backend Hors Ligne'}
            </span>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-200">Statut du Backend FastAPI</h2>
            <button
              onClick={checkConnection}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              {loading ? 'Test...' : 'Rafraîchir'}
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Vérification de la connectivité API...</p>
          ) : error ? (
            <div className="bg-rose-950/30 border border-rose-900/50 rounded-lg p-4 text-sm text-rose-300">
              <p className="font-semibold">Impossible de joindre le backend :</p>
              <p className="font-mono text-xs mt-1 text-rose-400">{error}</p>
              <p className="text-xs text-slate-400 mt-2">
                Assurez-vous que FastAPI est lancé sur le port 8000 :
                <code className="block mt-1 p-2 bg-slate-900 rounded font-mono text-slate-300">
                  cd backend &amp;&amp; source .venv/bin/activate &amp;&amp; uvicorn app.main:app --reload
                </code>
              </p>
            </div>
          ) : health ? (
            <div className="space-y-4">
              {rootInfo?.message && (
                <div className="p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-lg text-sm text-indigo-300">
                  Message API : <span className="font-medium text-slate-200">{rootInfo.message}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-xs block">Service</span>
                  <span className="font-mono text-slate-200">{health.service}</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-xs block">Version</span>
                  <span className="font-mono text-slate-200">{health.version}</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-xs block">Statut</span>
                  <span className="font-mono text-emerald-400">{health.status}</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-xs block">Dernier ping</span>
                  <span className="font-mono text-slate-300 text-xs">
                    {new Date(health.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Documentation &amp; Liens Utiles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="http://localhost:8000/api/v1/docs"
              target="_blank"
              rel="noreferrer"
              className="block p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 hover:border-indigo-500/50 transition-all text-left group"
            >
              <h3 className="font-medium text-slate-200 group-hover:text-indigo-400">Swagger Docs</h3>
              <p className="text-xs text-slate-400 mt-1">Tester interactivement les endpoints API</p>
            </a>
            <a
              href="http://localhost:8000/api/v1/redoc"
              target="_blank"
              rel="noreferrer"
              className="block p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 hover:border-indigo-500/50 transition-all text-left group"
            >
              <h3 className="font-medium text-slate-200 group-hover:text-indigo-400">ReDoc</h3>
              <p className="text-xs text-slate-400 mt-1">Documentation d'API lisible et claire</p>
            </a>
            <a
              href="http://localhost:8000/api/v1/health"
              target="_blank"
              rel="noreferrer"
              className="block p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 hover:border-indigo-500/50 transition-all text-left group"
            >
              <h3 className="font-medium text-slate-200 group-hover:text-indigo-400">Endpoint Health</h3>
              <p className="text-xs text-slate-400 mt-1">JSON brut du statut de l'application</p>
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-center text-slate-500 pt-4 border-t border-slate-800">
          Frontend : React 19 + TypeScript + Vite + Tailwind CSS | Backend : FastAPI + Pydantic v2
        </div>
      </div>
    </div>
  )
}

export default App
