import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AuthCard } from '@/components/auth/AuthCard';
import { UserDashboardHeader } from '@/components/auth/UserDashboardHeader';
import { MotivationalLoader } from '@/components/auth/MotivationalLoader';
import { WidgetGrid } from '@/components/dashboard/WidgetGrid';
import { SettingsView } from '@/components/settings/SettingsView';
import { useWidgets } from '@/hooks/useWidgets';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ExternalLink,
  Quote,
  LayoutDashboard,
  SlidersHorizontal,
  ChevronDown,
  Sun,
  Moon,
  Laptop,
  LogOut,
  Check,
  Plus,
} from 'lucide-react';

type NavTab = 'dashboard' | 'settings';

function DashboardContent() {
  const {
    user,
    loading: authLoading,
    showMotivationalTransition,
    setShowMotivationalTransition,
    logout,
  } = useAuth();
  const { theme, setTheme } = useTheme();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };
  const { widgets, addWidget, removeWidget } = useWidgets();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-mono">Chargement de la session...</p>
        </div>
      </div>
    );
  }

  if (showMotivationalTransition) {
    return (
      <MotivationalLoader onComplete={() => setShowMotivationalTransition(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased w-full">
      {/* Top Navbar Header - Full-Width Edge-to-Edge */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
        <div className="w-full px-6 sm:px-8 lg:px-12 h-14 flex items-center justify-between gap-4">
          {/* Brand & Main Nav Links (Far Left) */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setCurrentTab('dashboard')}
              className="font-semibold text-sm tracking-widest text-foreground uppercase select-none cursor-pointer hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm"
            >
              INTER-NET
            </button>

            {user && (
              <nav className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                    currentTab === 'dashboard'
                      ? 'bg-muted text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <LayoutDashboard className="size-3.5" />
                  <span>Dashboard</span>
                </button>
              </nav>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Secondary Actions */}
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => setShowMotivationalTransition(true)}
                  className="h-10 text-xs gap-1.5 px-3 cursor-pointer text-muted-foreground hover:text-foreground"
                  title="Pause méditation"
                >
                  <Quote className="size-3.5 text-muted-foreground" />
                  <span className="hidden md:inline">Méditer</span>
                </Button>

                {currentTab === 'dashboard' && (
                  <Button
                    variant={isEditing ? 'default' : 'outline'}
                    size="default"
                    onClick={toggleEditMode}
                    className="h-10 text-xs gap-1.5 px-3.5 cursor-pointer font-medium"
                  >
                    {isEditing ? (
                      'Terminer'
                    ) : (
                      <>
                        <Plus className="size-3.5" />
                        <span>Éditer les widgets</span>
                      </>
                    )}
                  </Button>
                )}

                {/* Profile & Settings Dropdown Menu (Far Right) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className="h-10 px-2.5 sm:px-3 gap-2 border-border/80 hover:bg-muted/60 data-state-open:bg-muted/80 cursor-pointer select-none"
                    >
                      <div className="size-6 rounded-md bg-muted border border-border/80 flex items-center justify-center font-mono text-[11px] font-semibold text-foreground shrink-0">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="hidden sm:inline text-xs font-medium text-foreground tracking-tight max-w-[120px] truncate">
                        {user.username}
                      </span>
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-60 p-1.5 shadow-lg border border-border">
                    <div className="px-2.5 py-2">
                      <p className="text-xs font-semibold text-foreground truncate">{user.username}</p>
                      <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">{user.email}</p>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => setCurrentTab('settings')}
                      className="cursor-pointer gap-2 text-xs py-2"
                    >
                      <SlidersHorizontal className="size-4 text-muted-foreground" />
                      <span>Paramètres & Intégrations</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuLabel className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground/80 px-2.5 pt-1">
                      Thème
                    </DropdownMenuLabel>

                    <DropdownMenuItem
                      onClick={() => setTheme('light')}
                      className="cursor-pointer gap-2 text-xs py-2 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Sun className="size-4 text-muted-foreground" />
                        <span>Thème Clair</span>
                      </div>
                      {theme === 'light' && <Check className="size-3.5 text-foreground" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setTheme('dark')}
                      className="cursor-pointer gap-2 text-xs py-2 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Moon className="size-4 text-muted-foreground" />
                        <span>Thème Sombre</span>
                      </div>
                      {theme === 'dark' && <Check className="size-3.5 text-foreground" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setTheme('system')}
                      className="cursor-pointer gap-2 text-xs py-2 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Laptop className="size-4 text-muted-foreground" />
                        <span>Système</span>
                      </div>
                      {theme === 'system' && <Check className="size-3.5 text-foreground" />}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      variant="destructive"
                      onClick={logout}
                      className="cursor-pointer gap-2 text-xs py-2 text-rose-500 focus:text-rose-500"
                    >
                      <LogOut className="size-4" />
                      <span>Se déconnecter</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <ThemeToggle />
            )}
          </div>
        </div>
      </header>

      {/* Main Full-Width Content Container */}
      <main className="flex-1 w-full px-6 sm:px-8 lg:px-12 py-8 space-y-8">
        {!user ? (
          /* Non-authentifié : Formulaire Login/Register épuré */
          <div className="space-y-8 max-w-md mx-auto py-12">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                INTER-NET
              </h1>
              <p className="text-xs text-muted-foreground">
                Connectez vos APIs et surveillez vos flux en direct.
              </p>
            </div>

            <AuthCard />
          </div>
        ) : currentTab === 'settings' ? (
          /* Vue Profil & Intégrations / Paramètres */
          <SettingsView />
        ) : (
          /* Vue Dashboard Utilisateur & Widgets */
          <div className="space-y-8 w-full">
            <UserDashboardHeader />

            {/* Widgets Grid Section */}
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="space-y-0.5">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    Mes Widgets
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Flux d'informations et métriques en direct (<span className="tabular-nums font-mono">{widgets.length}</span> {widgets.length > 1 ? 'panneaux' : 'panneau'}).
                  </p>
                </div>
              </div>

              <WidgetGrid
                widgets={widgets}
                isEditing={isEditing}
                onAddWidget={addWidget}
                onRemoveWidget={removeWidget}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer - Full-Width Edge-to-Edge */}
      <footer className="w-full border-t border-border py-6 text-xs text-muted-foreground mt-auto">
        <div className="w-full px-6 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium text-foreground/80">CrabeCorp • INTER-NET</p>
          <div className="flex items-center gap-6">
            <a
              href="http://localhost:8080/about.json"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-mono text-xs"
            >
              /about.json
              <ExternalLink className="size-3.5" />
            </a>
            <a
              href="http://localhost:8080/api/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-mono text-xs"
            >
              Swagger Docs
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="internet-theme">
      <AuthProvider>
        <DashboardContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
