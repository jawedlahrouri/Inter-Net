import { useState } from 'react'
import { GitBranch, Key, RefreshCw, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getGithubAuthRedirectUrl, connectGithubToken } from '@/services/api'

interface GithubPatFormProps {
  onConnected: () => void
}

export function GithubPatForm({ onConnected }: GithubPatFormProps) {
  const [showPatInput, setShowPatInput] = useState<boolean>(false)
  const [patTokenInput, setPatTokenInput] = useState<string>('')
  const [patSubmitting, setPatSubmitting] = useState<boolean>(false)
  const [patError, setPatError] = useState<string | null>(null)

  const handleConnectPat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patTokenInput.trim()) return

    try {
      setPatSubmitting(true)
      setPatError(null)
      await connectGithubToken(patTokenInput.trim())
      onConnected()
    } catch (err: any) {
      setPatError(err?.message || 'Token GitHub invalide ou expiré.')
    } finally {
      setPatSubmitting(false)
    }
  }

  return (
    <div className="p-6 rounded-xl border border-purple-500/40 bg-purple-500/10 text-center space-y-3">
      <Lock className="size-8 text-purple-500 mx-auto" />
      <div>
        <h4 className="font-bold text-sm text-foreground">Connexion requise</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Liez votre compte GitHub ou renseignez un Personal Access Token (PAT) pour prévisualiser vos données.
        </p>
      </div>
      <div className="flex flex-col gap-2 pt-1">
        <Button
          size="sm"
          className="gap-2 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer mx-auto w-full"
          onClick={() => {
            window.location.href = getGithubAuthRedirectUrl()
          }}
        >
          <GitBranch className="size-4" />
          Se connecter avec GitHub
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2 text-xs cursor-pointer w-full"
          onClick={() => setShowPatInput(!showPatInput)}
        >
          <Key className="size-3.5" />
          {showPatInput ? 'Masquer le token PAT' : 'Utiliser un Personal Access Token'}
        </Button>
      </div>
      {showPatInput && (
        <form onSubmit={handleConnectPat} className="space-y-2 pt-2 text-left border-t border-purple-500/20">
          <input
            type="password"
            placeholder="ghp_... ou github_pat_..."
            value={patTokenInput}
            onChange={(e) => setPatTokenInput(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded border border-border bg-background text-foreground"
          />
          {patError && <p className="text-[11px] text-destructive">{patError}</p>}
          <Button
            type="submit"
            size="sm"
            disabled={patSubmitting || !patTokenInput.trim()}
            className="w-full text-xs h-7 cursor-pointer"
          >
            {patSubmitting ? <RefreshCw className="size-3 animate-spin" /> : 'Valider le token'}
          </Button>
        </form>
      )}
    </div>
  )
}

