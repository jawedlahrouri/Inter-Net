import * as React from 'react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getGithubAuthRedirectUrl, connectGithubToken, type GithubProfileInfo } from '@/services/api'
import { GitBranch, ExternalLink, Key, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export interface GithubConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (profile: GithubProfileInfo) => void
}

export function GithubConnectDialog({
  open,
  onOpenChange,
  onSuccess,
}: GithubConnectDialogProps) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'choice' | 'token'>('choice')

  const handleOAuthConnect = () => {
    window.location.href = getGithubAuthRedirectUrl()
  }

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = token.trim()
    if (!trimmed) {
      setError('Veuillez renseigner votre Personal Access Token.')
      return
    }

    setLoading(true)
    try {
      const res = await connectGithubToken(trimmed)
      onSuccess(res.profile)
      onOpenChange(false)
      setToken('')
      setMode('choice')
    } catch (err: any) {
      setError(err?.message || 'Jeton GitHub invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-6">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground shrink-0">
              <GitBranch className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Connexion à GitHub
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Associez votre compte pour débloquer les widgets de vos repositories.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 mt-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'choice' ? (
          <div className="space-y-4 py-2">
            {/* Option 1: Standard OAuth2 */}
            <div className="p-4 rounded-xl border border-border bg-card/60 hover:bg-muted/30 transition-colors space-y-3">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ExternalLink className="size-3.5 text-primary" />
                  Connexion Web GitHub (OAuth2)
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Redirection vers GitHub pour autoriser l'application en un clic (nécessite une OAuth App configurée).
                </p>
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleOAuthConnect}
                className="w-full h-9 text-xs font-medium cursor-pointer"
              >
                Continuer avec GitHub
              </Button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/80" />
              </div>
              <span className="relative bg-card px-2 text-[10px] uppercase font-mono text-muted-foreground">
                OU
              </span>
            </div>

            {/* Option 2: Personal Access Token (PAT) */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors space-y-3">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Key className="size-3.5 text-amber-500" />
                  Personal Access Token (PAT)
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Idéal en environnement local ou sans configuration d'application OAuth préalable.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMode('token')}
                className="w-full h-9 text-xs font-medium cursor-pointer"
              >
                Saisir un jeton d'accès
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleTokenSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">
                Jeton personnel GitHub (PAT)
              </label>
              <Input
                type="password"
                placeholder="ghp_... ou jeton classique"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading}
                className="h-9 text-xs font-mono"
                required
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Générez un token avec les droits <code className="bg-muted px-1 py-0.5 rounded text-[10px]">read:user</code> et <code className="bg-muted px-1 py-0.5 rounded text-[10px]">repo</code> sur{' '}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline hover:text-primary/80 inline-flex items-center gap-0.5"
                >
                  github.com/settings/tokens <ExternalLink className="size-2.5" />
                </a>.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(null)
                  setMode('choice')
                }}
                disabled={loading}
                className="h-9 text-xs cursor-pointer"
              >
                Retour
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={loading || !token.trim()}
                className="h-9 text-xs font-medium cursor-pointer gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    Lier le compte
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default GithubConnectDialog

