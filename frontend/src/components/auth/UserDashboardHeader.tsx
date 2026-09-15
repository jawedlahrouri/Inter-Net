import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Shield, Calendar, Activity } from 'lucide-react';

export function UserDashboardHeader() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();
  const formattedDate = new Date(user.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card className="w-full border border-border bg-card rounded-lg shadow-xs">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* User Identity & Avatar */}
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-lg bg-muted/70 border border-border flex items-center justify-center font-mono text-sm font-semibold text-foreground select-none shrink-0">
              {initials}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base font-semibold tracking-tight text-foreground">
                  {user.username}
                </span>
                <Badge
                  variant="outline"
                  className="text-[11px] px-2 py-0.5 font-normal tracking-wide text-muted-foreground border-border"
                >
                  {user.role === 'admin' ? (
                    <span className="flex items-center gap-1 text-foreground">
                      <Shield className="size-3" /> Admin
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <User className="size-3" /> Membre
                    </span>
                  )}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground/80 tabular-nums">
                  #{user.id}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {user.email}
              </p>
            </div>
          </div>

          {/* User Metadata & Logout Action */}
          <div className="flex items-center gap-6 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-border/50">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground/70 shrink-0" />
                <span className="font-mono tabular-nums text-foreground/90">
                  Depuis le {formattedDate}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 border-l border-border pl-4">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-muted-foreground">Session active</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="default"
              onClick={logout}
              className="h-10 text-xs gap-2 cursor-pointer text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10"
            >
              <LogOut className="size-3.5" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default UserDashboardHeader;
