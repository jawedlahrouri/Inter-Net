import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Shield, Calendar, LayoutDashboard, Layers } from 'lucide-react';

export function UserDashboardHeader() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/70 backdrop-blur-md shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-32 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20">
              <div className="size-full bg-background rounded-[14px] flex items-center justify-center font-bold text-lg text-indigo-400">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold">{user.username}</CardTitle>
                <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="text-[10px]">
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
              <CardDescription className="text-xs text-muted-foreground">
                {user.email}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            >
              <LogOut className="size-3.5" />
              Déconnexion
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-4 text-indigo-400" />
              <span>Membre depuis le {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layers className="size-4 text-cyan-400" />
              <span>Services : Prêt à connecter</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <LayoutDashboard className="size-4 text-emerald-400" />
              <span>Dashboard personnalisé actif</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
