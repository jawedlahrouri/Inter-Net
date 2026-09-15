import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthCard } from '@/components/auth/AuthCard';
import { UserDashboardHeader } from '@/components/auth/UserDashboardHeader';
import { MotivationalLoader } from '@/components/auth/MotivationalLoader';
import { WidgetGrid } from '@/components/dashboard/WidgetGrid';
import { useWidgets } from '@/hooks/useWidgets';
import { Button } from '@/components/ui/button';
import { ExternalLink, Quote } from 'lucide-react';

function DashboardContent() {
  const {
    user,
    loading: authLoading,
    showMotivationalTransition,
    setShowMotivationalTransition,
  } = useAuth();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };
  const { widgets, addWidget, updateWidget, removeWidget } = useWidgets();


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Chargement de la session...</p>
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
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top Navbar Header - Linear / Dub Style */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand Wordmark - Far Left */}
          <div className="flex items-center">
            <span className="font-semibold text-sm tracking-widest text-foreground uppercase select-none">
              INTER-NET
            </span>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {user && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMotivationalTransition(true)}
                  className="h-8 text-xs gap-1.5 px-3 cursor-pointer"
                >
                  <Quote className="size-3 text-muted-foreground" />
                  <span>Méditer</span>
                </Button>
                <Button
                  variant={isEditing ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleEditMode}
                  className="h-8 text-xs cursor-pointer"
                >
                  {isEditing ? 'Terminer' : 'Éditer les widgets'}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
        {!user ? (
          /* Non-authentifié : Présentation épurée & Formulaire Login/Register */
          <div className="space-y-8 max-w-xl mx-auto">
            <div className="text-center space-y-2 pt-2">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                Votre Dashboard Modulaire
              </h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Connectez vos APIs, composez vos flux de données et surveillez vos métriques en temps réel.
              </p>
            </div>

            <AuthCard />
          </div>
        ) : (
          /* Authentifié : Espace Dashboard Utilisateur */
          <div className="space-y-8">
            <UserDashboardHeader />

            {/* Widgets Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    Mes Widgets
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Flux d'informations et métriques en temps réel.
                  </p>
                </div>
                <Button
                  variant={isEditing ? 'default' : 'secondary'}
                  size="sm"
                  onClick={toggleEditMode}
                  className="h-8 text-xs cursor-pointer"
                >
                  {isEditing ? 'Terminer' : 'Éditer les widgets'}
                </Button>
              </div>

              <WidgetGrid
                widgets={widgets}
                isEditing={isEditing}
                onAddWidget={addWidget}
                onUpdateWidget={updateWidget}
                onRemoveWidget={removeWidget}
              />

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-xs text-muted-foreground mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium text-foreground/80">CrabeCorp • INTER-NET</p>
          <div className="flex items-center gap-5">
            <a
              href="http://localhost:8080/about.json"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-mono text-[11px]"
            >
              /about.json
              <ExternalLink className="size-3" />
            </a>
            <a
              href="http://localhost:8080/api/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-mono text-[11px]"
            >
              Swagger Docs
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;
