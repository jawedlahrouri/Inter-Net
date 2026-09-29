import { Layers, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface IntegrationItem {
  id: string
  name: string
  category: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: 'coming_soon' | 'connected' | 'disconnected'
  account?: string
}

interface IntegrationsSettingsTabProps {
  integrations: IntegrationItem[]
  onConnect: (id: string) => void
  onDisconnect: (id: string) => void
}

/**
 * @brief Renders the settings tab listing external service integrations with their connection status and actions.
 * @param integrations List of integration items to display with their status and account.
 * @param onConnect Callback invoked with an integration id when its connect button is clicked.
 * @param onDisconnect Callback invoked with an integration id when its disconnect button is clicked.
 * @return A heading and a grid of integration cards with status badges and connect, disconnect or coming-soon buttons.
 */
export function IntegrationsSettingsTab({
  integrations,
  onConnect,
  onDisconnect,
}: IntegrationsSettingsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          Intégrations & Connexions
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Liez vos services externes pour alimenter vos widgets de tableau de bord.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => {
          const IconComponent = item.icon
          return (
            <Card
              key={item.id}
              className="border border-border bg-card rounded-lg shadow-xs hover:border-border/90 transition-colors flex flex-col justify-between"
            >
              <CardHeader className="p-5 pb-3">
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
                <span className="text-muted-foreground text-[11px] font-mono truncate max-w-[180px]">
                  {item.status === 'connected' && (item.account || 'Compte actif')}
                  {item.status === 'disconnected' && 'Prêt à être associé'}
                  {item.status === 'coming_soon' && 'Intégration à venir'}
                </span>

                {item.status === 'connected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDisconnect(item.id)}
                    className="h-8 text-xs px-3 text-muted-foreground hover:text-destructive hover:border-destructive/40 cursor-pointer"
                  >
                    Déconnecter
                  </Button>
                )}

                {item.status === 'disconnected' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onConnect(item.id)}
                    className="h-8 text-xs px-3 cursor-pointer"
                  >
                    Se connecter
                  </Button>
                )}

                {item.status === 'coming_soon' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    className="h-8 text-xs px-3 opacity-50 cursor-not-allowed text-muted-foreground border border-border/40"
                  >
                    Bientôt
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

