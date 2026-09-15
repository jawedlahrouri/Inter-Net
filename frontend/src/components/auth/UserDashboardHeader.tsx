import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Shield, Calendar } from 'lucide-react';

export function UserDashboardHeader() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();
  const formattedDate = new Date(user.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card className="border border-border/80 bg-card rounded-lg shadow-xs">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Minimalist Monochromatic Avatar */}
            <div className="size-10 rounded-md bg-muted/80 border border-border flex items-center justify-center font-mono text-xs font-semibold text-foreground select-none">
              {initials}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  {user.username}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 font-normal tracking-wide text-muted-foreground border-border"
                >
                  {user.role === 'admin' ? (
                    <span className="flex items-center gap-1">
                      <Shield className="size-2.5" /> Admin
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <User className="size-2.5" /> Membre
                    </span>
                  )}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5 text-muted-foreground/70" />
              <span>Depuis le {formattedDate}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="h-8 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10"
            >
              <LogOut className="size-3" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default UserDashboardHeader;
