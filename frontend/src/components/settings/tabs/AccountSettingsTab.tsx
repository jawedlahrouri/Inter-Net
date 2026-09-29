import { User, Shield, LogOut, Calendar, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { User as UserType } from '@/services/api'

interface AccountSettingsTabProps {
  user: UserType
  onLogout: () => void
}

/**
 * @brief Renders the account settings tab showing the user's identity details and a logout button.
 * @param user Current user whose username, role, email, id and creation date are displayed.
 * @param onLogout Callback invoked when the user clicks the logout button.
 * @return A card with initials avatar, username, role badge, email, logout button, user id, registration date and JWT status.
 */
export function AccountSettingsTab({ user, onLogout }: AccountSettingsTabProps) {
  const initials = user.username.slice(0, 2).toUpperCase()
  const formattedDate = new Date(user.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
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
              onClick={onLogout}
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
  )
}
